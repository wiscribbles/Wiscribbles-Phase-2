/**
 * THE NOTARIAL ACTS REGISTER — the officer's own record, not the platform's.
 *
 * Barbados Notaries Public Act 2024 **s.12(1)** requires every notary public
 * to keep a register of their notarial acts, retained for **seven years**, with
 * an offence under s.12(5) for failing to do so. The duty is on the
 * INDIVIDUAL. It is not discharged by the platform holding an audit log,
 * because the register is the notary's own professional record and the
 * obligation does not transfer to a service they happen to use.
 *
 * WHICH MEANS THIS IS A FEATURE THE NOTARY NEEDS *AGAINST* WiScribbles.
 *
 * If the platform shut down tomorrow, every notary who had relied on it would
 * be in breach of s.12(1) with no way to produce seven years of records. That
 * is precisely why nobody building a platform thinks of building it: it is a
 * feature whose purpose is to reduce the officer's dependence on the thing
 * being built. It is also the reason the export is a plain CSV rather than a
 * view inside the dashboard — a register you can only read while logged in to
 * someone else's service is not a register you keep.
 *
 * Guyana has no equivalent express statutory register that has been located,
 * but Cap. 4:02 s.7 makes acting off-register an offence and a notary there has
 * the same practical need to evidence their own acts. So the export is offered
 * to every officer, not only Barbadian ones. Offering it everywhere costs
 * nothing; withholding it until Barbados opens would mean Guyanese notaries
 * accumulate acts they cannot evidence.
 *
 * WHAT IS IN IT, and why these columns: a notarial register conventionally
 * records when the act was performed, what the instrument was, who appeared,
 * what the officer certified, and the fee. The verification reference is
 * included because it is what lets a third party check the entry against the
 * instrument years later — a register entry that cannot be tied back to a
 * document proves very little.
 *
 * WHAT IS DELIBERATELY NOT IN IT: the document file, and any identity
 * document. The register evidences that an act was performed; it is not a
 * copy of the client's papers, and a notary's own CSV sitting in their email
 * is the wrong place for a client's passport scan.
 */

import 'server-only';
import { adminDb } from '@/lib/firebase-admin';

/** Barbados s.12(1). Used to describe the obligation, never to delete. */
export const RETENTION_YEARS = 7;

/**
 * Statuses that represent a completed notarial act.
 *
 * A draft or an abandoned request is not an act and does not belong in a
 * register — padding it with work that never happened would make the register
 * worthless as evidence.
 */
const COMPLETED = new Set(['notarised', 'notarized']);

/** Columns, in order. Stable: a register whose columns move is hard to keep. */
export const REGISTER_COLUMNS = Object.freeze([
  { key: 'actDate', label: 'Date of act' },
  { key: 'reference', label: 'Verification reference' },
  { key: 'documentName', label: 'Document' },
  { key: 'documentType', label: 'Type' },
  { key: 'jurisdiction', label: 'Jurisdiction' },
  { key: 'statutoryBasis', label: 'Statutory basis' },
  { key: 'parties', label: 'Parties appearing' },
  { key: 'actPerformed', label: 'Act performed' },
  { key: 'feeCents', label: 'Fee (cents)' },
  { key: 'feeCurrency', label: 'Currency' },
]);

const partyNames = (parties) =>
  (Array.isArray(parties) ? parties : [])
    .filter((party) => party?.status === 'signed')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((party) => party.signatureName ?? party.name ?? 'Unnamed party')
    .join('; ');

function toRow(id, data) {
  return {
    id,
    actDate: data.sealedAt ?? data.executedAt ?? data.allPartiesSignedAt ?? data.updatedAt ?? null,
    reference: data.verificationReference ?? data.referenceNumber ?? null,
    documentName: data.name ?? data.fileName ?? 'Untitled document',
    documentType: data.templateName ?? data.documentCategory ?? null,
    jurisdiction: data.jurisdiction ?? null,
    /* Recorded per act, from the document, rather than looked up now. The
       provision a 2026 act was performed under is a fact about that act, and
       a register that printed today's citation against an older entry would
       misstate it if the law or our reading of it changed. */
    statutoryBasis: data.jurisdictionCheck?.statutoryBasis ?? data.statutoryBasis ?? null,
    parties: partyNames(data.parties),
    actPerformed: data.serviceType ?? 'notarisation',
    feeCents: data.fee?.totalCents ?? null,
    feeCurrency: data.fee?.currency ?? null,
  };
}

/**
 * One officer's completed acts, newest first.
 *
 * Scoped to `assignedProfessionalId` — an officer's register contains their
 * own acts and nobody else's, and that is a correctness requirement rather
 * than a privacy nicety: a register listing another notary's acts is a false
 * professional record.
 */
export async function registerFor({ uid, limit = 5000 }) {
  const snapshot = await adminDb()
    .collection('documents')
    .where('assignedProfessionalId', '==', uid)
    .limit(limit)
    .get();

  const rows = snapshot.docs
    .map((doc) => ({ id: doc.id, data: doc.data() }))
    .filter(({ data }) => COMPLETED.has(data.status))
    .map(({ id, data }) => toRow(id, data))
    .sort((a, b) => String(b.actDate ?? '').localeCompare(String(a.actDate ?? '')));

  return {
    rows,
    count: rows.length,
    /* Reported so the officer can see whether they are looking at everything.
       A truncated register that does not say it is truncated is worse than no
       register, because it looks complete. */
    truncated: snapshot.size >= limit,
    retentionYears: RETENTION_YEARS,
    generatedAt: new Date().toISOString(),
  };
}

/** RFC 4180 escaping. A document name containing a comma is not exotic. */
const cell = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * The register as CSV.
 *
 * A header row of human labels, then the rows. No totals line: a register is
 * a record of acts, and a spreadsheet-style total at the bottom of a legal
 * register invites it to be read as an account.
 */
export function toCsv({ rows, generatedAt }) {
  const lines = [REGISTER_COLUMNS.map((column) => cell(column.label)).join(',')];

  for (const row of rows) {
    lines.push(REGISTER_COLUMNS.map((column) => cell(row[column.key])).join(','));
  }

  /* A trailing comment line, not a column: whoever opens this in five years
     should be able to tell what it is and where it came from. Prefixed with #
     so a spreadsheet shows it as text in the first cell rather than mangling
     a row. */
  lines.push('');
  lines.push(
    cell(
      `# Notarial acts register generated by WiScribbles on ${generatedAt}. ` +
        `Retain for ${RETENTION_YEARS} years (Barbados Notaries Public Act 2024 s.12(1)). ` +
        'This is your own professional record — keep a copy independently of this platform.',
    ),
  );

  return lines.join('\r\n');
}
