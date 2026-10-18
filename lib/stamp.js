/**
 * The virtual stamp — the professional's electronic seal.
 *
 * Brief: the Notary places a virtual stamp (e-seal) on the document.
 *
 * WHAT WAS WRONG WITH THE PHASE 1 STAMP ROUTES
 *
 * `api/stamp-pdf` and `api/notary-stamp-pdf` both took a PDF **URL** in the
 * request body, fetched it over HTTP with retries and a 30-second timeout,
 * stamped the result and uploaded it. Two problems:
 *
 *   1. The URL came from the client. `isTrustedDocumentUrl` was bolted on to
 *      stop it fetching arbitrary hosts, which closed the SSRF — but the design
 *      still means the server asks the client which bytes to seal. A client who
 *      can name the document being stamped can have the notary's seal applied
 *      to a document the notary never saw.
 *
 *   2. It fetched our own file over the public internet. The PDF is in our own
 *      Storage bucket; reading it by path with the Admin SDK is faster, needs
 *      no network round trip, and cannot be pointed anywhere else.
 *
 * So this reads by PATH, and the path comes from the document record, which
 * came from the session, which the professional has been proved a participant
 * of. There is no caller-supplied location anywhere in the chain.
 *
 * WHAT THE SEAL SAYS
 *
 * A seal that just says "notarised" is worth very little to someone later
 * trying to establish whether the act was valid. This one records the
 * professional, their role, the jurisdiction, the statute relied on, the
 * document's template, the session id and the timestamp — so the page itself
 * carries the facts that make the act checkable, rather than only a graphic.
 */

import 'server-only';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  ALLOWED_DOCUMENT_TYPES,
  downloadBuffer,
  uniqueFilename,
  uploadBuffer,
} from '@/lib/storage/server';
import { getJurisdiction } from '@/lib/jurisdictions';
import { PROFESSIONAL_LABEL } from '@/lib/sessions';
import { digestDocument, shortDigest } from '@/lib/integrity';

/** Brand navy, matching lib/theme.js. */
const INK = rgb(0x27 / 255, 0x41 / 255, 0x71 / 255);
const MUTED = rgb(0.42, 0.45, 0.5);
const RULE = rgb(0.886, 0.91, 0.94);

export class StampError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * Read a PDF out of our own bucket.
 *
 * By path. Never by URL. See the note at the top of this file.
 */
async function readPdf(storagePath) {
  if (!storagePath || typeof storagePath !== 'string') {
    throw new StampError('no_path', 'The document has no stored file.');
  }

  try {
    return await downloadBuffer(storagePath);
  } catch (error) {
    throw new StampError(
      'missing_file',
      'The document file could not be read from storage. It may have been ' +
        'moved or removed since the request was made.',
    );
  }
}

/**
 * Apply the seal.
 *
 * The seal goes on a page of its own, appended at the end, rather than
 * overlaid on the last page of the instrument. Overlaying risks covering
 * execution clauses, signature blocks or attestation wording — the parts that
 * matter most — and a notarial certificate on its own page is the familiar
 * paper convention anyway.
 *
 * Every page also gets a small footer line so a page separated from the rest
 * can still be traced back to the act.
 */
export async function applySeal({
  storagePath,
  professional,
  session,
  document: record,
  executedAt,
}) {
  const source = await readPdf(storagePath);

  let pdf;
  try {
    pdf = await PDFDocument.load(source);
  } catch {
    throw new StampError(
      'unreadable_pdf',
      'That file could not be opened as a PDF. It may be corrupt or password ' +
        'protected — a protected file cannot be sealed.',
    );
  }

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const place = getJurisdiction(session.jurisdiction);
  const roleLabel = PROFESSIONAL_LABEL[session.professionalRole] ?? 'Authorised person';
  const when = new Date(executedAt);

  /* ---- footer on every page ------------------------------------------- */
  const footer =
    `WiScribbles · executed electronically ${when.toISOString().slice(0, 10)} · ` +
    `session ${session.id}`;

  for (const page of pdf.getPages()) {
    const { width } = page.getSize();
    const size = 7;
    const text = footer.length > 120 ? `${footer.slice(0, 117)}…` : footer;

    page.drawText(text, {
      x: 36,
      y: 18,
      size,
      font: regular,
      color: MUTED,
      maxWidth: width - 72,
    });
  }

  /* ---- the certificate page ------------------------------------------- */
  const [first] = pdf.getPages();
  const size = first ? first.getSize() : { width: 595, height: 842 };
  const page = pdf.addPage([size.width, size.height]);

  const margin = 56;
  let y = size.height - margin;

  const line = (text, { font = regular, fontSize = 10, gap = 16, color = rgb(0.18, 0.21, 0.26) } = {}) => {
    page.drawText(String(text ?? ''), {
      x: margin,
      y,
      size: fontSize,
      font,
      color,
      maxWidth: size.width - margin * 2,
    });
    y -= gap;
  };

  const rule = (gap = 18) => {
    page.drawLine({
      start: { x: margin, y: y + 6 },
      end: { x: size.width - margin, y: y + 6 },
      thickness: 0.75,
      color: RULE,
    });
    y -= gap;
  };

  line(
    session.serviceType === 'commissioning'
      ? 'CERTIFICATE OF COMMISSIONING'
      : 'NOTARIAL CERTIFICATE',
    { font: bold, fontSize: 15, gap: 10, color: INK },
  );
  line('WiScribbles — electronic execution', { fontSize: 9, gap: 20, color: MUTED });
  rule(26);

  const field = (label, value) => {
    page.drawText(label, { x: margin, y, size: 8, font: bold, color: MUTED });
    page.drawText(String(value ?? '—'), {
      x: margin + 150,
      y,
      size: 10,
      font: regular,
      color: rgb(0.18, 0.21, 0.26),
      maxWidth: size.width - margin * 2 - 150,
    });
    y -= 20;
  };

  field('Document', record?.name ?? 'Untitled');
  field('Document type', session.templateName ?? record?.templateName ?? '—');
  field('Executed by', professional.name ?? professional.email ?? professional.uid);
  field('Capacity', roleLabel);
  field('Jurisdiction', place ? place.name : (session.jurisdiction ?? '—'));
  field('Statutory authority', place?.statute ?? '—');
  field('Date and time (UTC)', when.toISOString().replace('T', ' ').slice(0, 19));
  field('Session reference', session.id);
  /* The reference number a third party quotes to verify this document. It is
     the ONLY route a verifier has — they are not an account holder and have no
     document id — so it goes on the certificate in full. */
  field('Verification reference', record?.referenceNumber ?? '—');
  field('Verify at', 'wiscribbles.com/authenticate');

  y -= 6;
  rule(26);

  /* The jurisdiction check, written onto the certificate itself. The brief
     requires the session to display it; recording it on the instrument is what
     makes the act checkable by someone who was not in the room. */
  line('Jurisdiction check', { font: bold, fontSize: 9, gap: 14, color: MUTED });
  line(
    `Document jurisdiction ${session.jurisdiction ?? '—'} matched against the ` +
      `authorised jurisdictions of the executing ${roleLabel.toLowerCase()} ` +
      `at ${session.jurisdictionCheck?.checkedAt ?? 'the time of execution'}.`,
    { fontSize: 9, gap: 14, color: MUTED },
  );
  line('Result: permitted.', { fontSize: 9, gap: 24, color: MUTED });

  /* The integrity digest is deliberately NOT printed here.
   *
   * A document cannot contain its own hash: printing the digest would change
   * the bytes being digested. The digest is therefore computed over the final
   * stored file and served from the verification endpoint, where a holder can
   * compare it against the file in their hands. Saying where to get it beats
   * printing a number that could only ever be wrong. */
  line(
    'The integrity digest for this document is published at the verification ' +
      'address above. Recompute the SHA-256 of this file and compare it there ' +
      'to confirm the document has not been altered since execution.',
    { fontSize: 8.5, gap: 20, color: MUTED },
  );

  rule(24);

  line(
    'This certificate records an act carried out by video conference. The ' +
      'identity of the parties was verified by the executing professional, who ' +
      'remains responsible for that verification.',
    { fontSize: 8.5, gap: 13, color: MUTED },
  );

  /* Jurisdiction-specific statutory statements.
   *
   * Jamaica s.9 is NOT satisfied by the authorised person's signature alone,
   * the way Guyana s.14(3) and Trinidad s.18 are. It requires a statement
   * attesting to identity AND a statement certifying performance of all
   * obligations imposed by other law, attached to or logically associated with
   * the document. So those go on the certificate in terms, not implied by the
   * act of sealing. Driven by `certificateStatements` on the registry entry,
   * so a jurisdiction with its own wording gets its own wording. */
  for (const statement of place?.certificateStatements ?? []) {
    line(statement, { fontSize: 8.5, gap: 13, color: MUTED });
  }
  line(
    'This document has effect only to the extent that the law of the ' +
      'jurisdiction named above gives effect to electronic execution.',
    { fontSize: 8.5, gap: 13, color: MUTED },
  );

  /* ---- seal mark ------------------------------------------------------- */
  const sealSize = 104;
  const sealX = size.width - margin - sealSize;
  const sealY = margin + 40;

  page.drawRectangle({
    x: sealX,
    y: sealY,
    width: sealSize,
    height: sealSize,
    borderColor: INK,
    borderWidth: 1.25,
    color: rgb(1, 1, 1),
  });
  page.drawRectangle({
    x: sealX + 6,
    y: sealY + 6,
    width: sealSize - 12,
    height: sealSize - 12,
    borderColor: INK,
    borderWidth: 0.5,
    color: rgb(1, 1, 1),
  });

  const centred = (text, offsetY, fontSize, font = regular) => {
    const width = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: sealX + (sealSize - width) / 2,
      y: sealY + offsetY,
      size: fontSize,
      font,
      color: INK,
    });
  };

  centred('WISCRIBBLES', sealSize - 26, 7, bold);
  centred(roleLabel.toUpperCase().slice(0, 22), sealSize - 40, 6, bold);
  centred(place?.code ?? '—', sealSize / 2 - 8, 18, bold);
  centred(when.toISOString().slice(0, 10), 26, 6.5);
  centred(String(record?.referenceNumber ?? session.id).slice(0, 14), 15, 5.5, regular);

  /* ---- store ----------------------------------------------------------- */
  const bytes = await pdf.save();
  const documentId = record?.id ?? session.documentId;

  /* Tamper-evidence, per Trinidad s.31(1)(d) and Barbados s.9(3)(a) — the
     signature must be linked to the information such that any subsequent
     change is detectable. Computed over the EXACT bytes about to be stored,
     which is why it happens here and not before the certificate page was
     added. See lib/integrity.js. */
  const integrity = digestDocument(Buffer.from(bytes));

  /* `uploadBuffer` rather than `uploadGeneratedPdf`, which returns a long-lived
     token URL. The executed instrument's PATH is what the document record
     needs; downloads are signed per request so that each one is recorded. An
     unguessable permanent URL would work but would also leak out of audit. */
  const stored = await uploadBuffer({
    buffer: Buffer.from(bytes),
    path: `documents/${documentId}/${uniqueFilename('executed.pdf', 'executed.pdf')}`,
    contentType: 'application/pdf',
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    metadata: {
      sessionId: String(session.id),
      documentId: String(documentId),
      executedBy: String(professional.uid),
      executedAt: new Date(executedAt).toISOString(),
    },
  });

  return {
    path: stored.path,
    bytes: stored.bytes,
    pageCount: pdf.getPageCount(),
    integrity,
  };
}
