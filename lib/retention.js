/**
 * Signing windows and storage reclamation.
 *
 * Brief (18 Oct): "let the document creator be able to assign a time frame
 * whereby the user had to sign so that too much space is not used up on the
 * storage."
 *
 * THE PROBLEM THIS SOLVES
 *
 * A document uploaded for signature that nobody ever signs sits in Storage for
 * ever. Multiply by every abandoned request — someone uploads a contract, the
 * other side goes quiet, the document is never executed and never deleted —
 * and Storage fills with files nobody will ever open. The creator sets a window
 * when they upload; past it, the bytes go.
 *
 * THE RULE THAT MATTERS MORE THAN ANY OF THIS
 *
 * **An executed document is never purged. Not ever.** A signed or notarised
 * instrument is evidence, relied on by parties who are not the account holder
 * and possibly by a court years later. Storage pressure is not a reason to
 * destroy it, and `assertPurgeable` exists so that nobody — including a future
 * contributor writing a well-meaning cleanup job — can purge one by accident.
 * It throws rather than returning false, because a cleanup loop that silently
 * skips is a cleanup loop whose author believes it worked.
 *
 * WHAT IS PURGED AND WHAT SURVIVES
 *
 * The FILE goes. The RECORD stays: who uploaded it, when, what it was, which
 * parties were invited, who signed before it lapsed, and that it expired. So a
 * client asking "what happened to the contract I uploaded in March" gets an
 * answer, and the audit trail is not punched full of holes. Reclaiming the
 * bytes is the point; erasing the history would be a different and worse
 * decision.
 *
 * LAZY, PLUS A SWEEP
 *
 * Expiry is noticed when the document is next read, like the suspension lapse
 * in `lib/admin/sanctions.js` — a document nobody is looking at does no harm.
 * But unlike a suspension, storage does accumulate whether anyone looks or
 * not, so there is also `sweepExpired` for `npm run sweep-expired`, which is
 * what actually frees the space.
 */

import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { deleteObject } from '@/lib/storage/server';

export const DOCUMENTS_COLLECTION = 'documents';

/** What the creator may choose. */
export const SIGNING_WINDOW_OPTIONS = Object.freeze([
  { days: 3, label: '3 days' },
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days', recommended: true },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days — the longest we hold an unsigned document' },
]);

export const DEFAULT_SIGNING_WINDOW_DAYS = 14;
export const MAX_SIGNING_WINDOW_DAYS = 90;

/**
 * How long after the deadline the file is actually removed.
 *
 * Not zero, deliberately. A document that vanishes at 00:00 on the deadline
 * gives someone signing at 23:59 a broken link and no explanation. The grace
 * period means the document reads as "expired" immediately — so nobody wastes
 * time on it — while the bytes survive long enough for the creator to notice
 * and extend.
 */
export const PURGE_GRACE_DAYS = 7;

/** Statuses whose files may be reclaimed. Nothing executed appears here. */
export const PURGEABLE_STATUSES = Object.freeze([
  'draft',
  'awaiting_signature',
  'expired',
  'declined',
]);

/** Statuses that are evidence. Permanent, whatever the storage position. */
export const PERMANENT_STATUSES = Object.freeze([
  'signed',
  'notarised',
  'revoked',
  'awaiting_in_person_witnessing',
  'awaiting_notarisation',
]);

export class RetentionError extends Error {
  constructor(code, message, status = 409) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/* ------------------------------------------------------------------------- */
/* The window                                                                */
/* ------------------------------------------------------------------------- */

export function validateSigningWindow(days) {
  const value = Number(days ?? DEFAULT_SIGNING_WINDOW_DAYS);

  if (!Number.isInteger(value) || value < 1 || value > MAX_SIGNING_WINDOW_DAYS) {
    return {
      valid: false,
      error:
        `Choose a signing window between 1 and ${MAX_SIGNING_WINDOW_DAYS} days. ` +
        'After it passes, an unsigned document is removed to free storage.',
    };
  }

  return { valid: true, days: value };
}

export const deadlineFrom = (days, now = Date.now()) =>
  new Date(now + Number(days) * 86400000).toISOString();

/** Has the window closed? */
export function windowHasClosed(document, now = Date.now()) {
  if (!document?.signingDeadline) return false;
  if (PERMANENT_STATUSES.includes(document.status)) return false;

  const deadline = Date.parse(document.signingDeadline);
  if (Number.isNaN(deadline)) return false;

  return deadline <= now;
}

/** Is the file past the grace period and genuinely removable? */
export function readyToPurge(document, now = Date.now()) {
  if (!windowHasClosed(document, now)) return false;

  const deadline = Date.parse(document.signingDeadline);
  return now > deadline + PURGE_GRACE_DAYS * 86400000;
}

/** For the UI: how a window reads right now. */
export function describeWindow(document, now = Date.now()) {
  if (!document?.signingDeadline) return null;
  if (PERMANENT_STATUSES.includes(document.status)) {
    return { closed: false, permanent: true, label: 'Executed — kept permanently' };
  }

  const deadline = Date.parse(document.signingDeadline);
  if (Number.isNaN(deadline)) return null;

  if (deadline <= now) {
    const purgeAt = deadline + PURGE_GRACE_DAYS * 86400000;
    const daysLeft = Math.ceil((purgeAt - now) / 86400000);

    return {
      closed: true,
      permanent: false,
      label:
        daysLeft > 0
          ? `Signing window closed — the file is removed in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
          : 'Signing window closed — the file has been removed',
      canExtend: daysLeft > 0,
    };
  }

  const daysLeft = Math.ceil((deadline - now) / 86400000);
  return {
    closed: false,
    permanent: false,
    label: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left to sign`,
    deadline: document.signingDeadline,
  };
}

/* ------------------------------------------------------------------------- */
/* Purging                                                                   */
/* ------------------------------------------------------------------------- */

/**
 * The guard. Throws rather than returning false.
 *
 * A cleanup job that silently skips a document it should not touch looks
 * identical to one that worked. This one makes the attempt loud.
 */
export function assertPurgeable(document) {
  if (PERMANENT_STATUSES.includes(document?.status)) {
    throw new RetentionError(
      'permanent_document',
      `Refusing to purge a document with status "${document.status}". An ` +
        'executed instrument is evidence relied on by parties other than the ' +
        'account holder, possibly years later. Storage pressure is never a ' +
        'reason to destroy one.',
    );
  }

  if (document?.stampedPath) {
    /* Belt and braces: a stamped file means a seal was applied, whatever the
       status field happens to say. */
    throw new RetentionError(
      'sealed_document',
      'Refusing to purge a document that carries a seal, regardless of its ' +
        'recorded status.',
    );
  }

  if (!PURGEABLE_STATUSES.includes(document?.status)) {
    throw new RetentionError(
      'unknown_status',
      `Refusing to purge a document with the unrecognised status ` +
        `"${document?.status}". Add it to PURGEABLE_STATUSES or ` +
        'PERMANENT_STATUSES deliberately rather than by default.',
    );
  }

  return true;
}

/**
 * Remove the file, keep the record.
 *
 * @returns {Promise<{ purged: boolean, freedBytes: number }>}
 */
export async function purgeDocumentFile({ documentId, reason = 'signing_window_expired' }) {
  const ref = adminDb().collection(DOCUMENTS_COLLECTION).doc(String(documentId));
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new RetentionError('not_found', 'No such document.', 404);
  }

  const document = { id: documentId, ...snapshot.data() };
  assertPurgeable(document);

  if (!document.storagePath) {
    // Already gone, or never had a file. Nothing to do and not an error.
    return { purged: false, freedBytes: 0 };
  }

  const freedBytes = Number(document.sizeBytes ?? 0);
  const now = new Date().toISOString();

  await deleteObject(document.storagePath);

  await ref.set(
    {
      status: 'expired',
      storagePath: null,
      /* Kept so the record says what was removed and how big it was, which is
         what makes a storage report possible after the fact. */
      filePurged: {
        at: now,
        reason,
        previousPath: document.storagePath,
        bytes: freedBytes,
      },
      updatedAt: now,
    },
    { merge: true },
  );

  await adminDb()
    .collection('auditLog')
    .add({
      type: 'document_file_purged',
      documentId: String(documentId),
      reason,
      bytes: freedBytes,
      actorUid: null,
      actorEmail: 'system',
      at: now,
    })
    .catch((error) => console.error('[retention] audit write failed', error));

  return { purged: true, freedBytes };
}

/**
 * Mark a lapsed document expired without touching the file yet.
 *
 * Runs during the grace period. The document stops inviting effort
 * immediately; the bytes survive long enough for the creator to extend.
 */
export async function markExpired({ documentId }) {
  const ref = adminDb().collection(DOCUMENTS_COLLECTION).doc(String(documentId));
  const now = new Date().toISOString();

  await ref.set({ status: 'expired', expiredAt: now, updatedAt: now }, { merge: true });
  return { expired: true };
}

/** Extend a window that has not yet been purged. */
export async function extendWindow({ documentId, days, actor }) {
  const { valid, days: value, error } = validateSigningWindow(days);
  if (!valid) throw new RetentionError('bad_window', error, 422);

  const ref = adminDb().collection(DOCUMENTS_COLLECTION).doc(String(documentId));
  const snapshot = await ref.get();

  if (!snapshot.exists) throw new RetentionError('not_found', 'No such document.', 404);

  const document = snapshot.data();

  if (document.ownerId !== actor.uid) {
    throw new RetentionError('not_owner', 'No such document.', 404);
  }

  if (!document.storagePath) {
    throw new RetentionError(
      'already_purged',
      'That document’s file has already been removed, so there is nothing ' +
        'left to sign. Upload it again to start over.',
    );
  }

  const now = new Date().toISOString();

  await ref.set(
    {
      signingDeadline: deadlineFrom(value),
      signingWindowDays: value,
      /* Back to awaiting signature: an expired document being extended is
         being revived, and leaving it "expired" would keep it out of the
         signing flow it has just been returned to. */
      status: 'awaiting_signature',
      expiredAt: null,
      windowExtendedAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  return { extended: true, deadline: deadlineFrom(value), days: value };
}

/* ------------------------------------------------------------------------- */
/* The sweep                                                                 */
/* ------------------------------------------------------------------------- */

/**
 * Find lapsed documents and deal with them.
 *
 * Two phases per document: past the deadline → mark expired; past the deadline
 * plus the grace period → remove the file.
 *
 * @param {object}  options
 * @param {boolean} options.dryRun  report without changing anything
 */
export async function sweepExpired({ dryRun = false, limit = 500 } = {}) {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  /* Only documents with a deadline in the past, and only ones that could ever
     be purgeable. An executed document is never a candidate, so it is not even
     fetched. */
  const snapshot = await adminDb()
    .collection(DOCUMENTS_COLLECTION)
    .where('signingDeadline', '<=', nowIso)
    .limit(limit)
    .get();

  const report = { examined: 0, marked: [], purged: [], skipped: [], freedBytes: 0 };

  for (const doc of snapshot.docs) {
    const document = { id: doc.id, ...doc.data() };
    report.examined += 1;

    if (PERMANENT_STATUSES.includes(document.status) || document.stampedPath) {
      report.skipped.push({ id: doc.id, reason: `executed (${document.status})` });
      continue;
    }

    if (readyToPurge(document, now)) {
      if (dryRun) {
        report.purged.push({ id: doc.id, bytes: Number(document.sizeBytes ?? 0), dryRun: true });
        report.freedBytes += Number(document.sizeBytes ?? 0);
        continue;
      }

      try {
        const { purged, freedBytes } = await purgeDocumentFile({ documentId: doc.id });
        if (purged) {
          report.purged.push({ id: doc.id, bytes: freedBytes });
          report.freedBytes += freedBytes;
        } else {
          report.skipped.push({ id: doc.id, reason: 'no file' });
        }
      } catch (error) {
        report.skipped.push({ id: doc.id, reason: error.message });
      }
      continue;
    }

    if (document.status !== 'expired') {
      if (!dryRun) await markExpired({ documentId: doc.id });
      report.marked.push({ id: doc.id });
    }
  }

  return report;
}
