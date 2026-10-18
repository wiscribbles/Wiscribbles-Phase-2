/**
 * Personal repository quotas.
 *
 * Brief (18 Oct): "Businesses and attorneys must also have their own personal
 * repository limited in size so it does not get too crowded."
 *
 * WHAT COUNTS AND WHAT DOES NOT
 *
 * Counts: the account's own documents, executed and unexecuted alike.
 *
 * Does not count: the standard forms library. Those are the platform's files,
 * stored once and shared with everyone — charging every account for a copy of
 * a form it merely used would be billing people for storage nobody is using.
 *
 * THE RULE THAT CANNOT BEND
 *
 * **Hitting the cap never deletes an executed document.** An instrument that
 * has been signed or notarised is evidence, and running out of space is not a
 * reason to destroy evidence. When an account is full it archives, upgrades,
 * or waits for unsigned documents to lapse under `lib/retention.js`. The quota
 * blocks NEW uploads; it never reclaims old ones.
 *
 * That is why this file only ever refuses an upload and has no eviction path.
 * There is deliberately no function here that frees space.
 *
 * WHY USAGE IS COMPUTED RATHER THAN COUNTED
 *
 * A running total on the user record would be cheaper, and would drift: a
 * failed upload, a purge, an admin action, any write that forgot to adjust it.
 * A drifting quota either blocks an account that has room or lets one past the
 * cap, and nobody would know which. Summing the documents is a few reads and
 * is always right. If it ever becomes too slow, cache it with a timestamp —
 * but keep the computation as the source of truth.
 */

import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { storageQuotaMbFor } from '@/lib/plans';
import { ROLES, normalizeRole } from '@/lib/roles';

const MB = 1024 * 1024;

/** Documents past this many are not summed; see the note in `usageFor`. */
const MAX_DOCUMENTS_SUMMED = 2000;

export class QuotaError extends Error {
  constructor(code, message, status = 413) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * How much space this account is using.
 *
 * @returns {Promise<{ usedBytes: number, quotaBytes: number, quotaMb: number,
 *                     documentCount: number, percentUsed: number,
 *                     remainingBytes: number, truncated: boolean }>}
 */
export async function usageFor({ uid, planId = null }) {
  const quotaMb = storageQuotaMbFor(planId);
  const quotaBytes = quotaMb * MB;

  const snapshot = await adminDb()
    .collection('documents')
    .where('ownerId', '==', uid)
    .limit(MAX_DOCUMENTS_SUMMED)
    .get();

  let usedBytes = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    /* A purged file occupies nothing. Its record survives — that is the point
       of `filePurged` — but the bytes are gone and must not be charged for. */
    if (!data.storagePath && !data.stampedPath) continue;

    /* Both the uploaded original and the sealed version exist for an executed
       document, and both occupy space. Counting only one would understate
       usage by roughly half on a notarised account. */
    usedBytes += Number(data.sizeBytes ?? 0);
    usedBytes += Number(data.stampedSizeBytes ?? 0);
  }

  return {
    usedBytes,
    quotaBytes,
    quotaMb,
    documentCount: snapshot.size,
    percentUsed: quotaBytes === 0 ? 100 : Math.min(100, Math.round((usedBytes / quotaBytes) * 100)),
    remainingBytes: Math.max(0, quotaBytes - usedBytes),
    /* An account at the ceiling is reported rather than silently under-counted:
       a usage figure that is quietly wrong is worse than one that admits it. */
    truncated: snapshot.size >= MAX_DOCUMENTS_SUMMED,
  };
}

/**
 * Would this upload fit?
 *
 * Call BEFORE accepting bytes. Throws `QuotaError` with something the account
 * holder can act on — how much they have, how much they need, and what to do —
 * rather than a bare 413.
 */
export async function assertRoomFor({ uid, planId = null, role = null, bytes }) {
  const incoming = Number(bytes ?? 0);

  if (!Number.isFinite(incoming) || incoming < 0) {
    throw new QuotaError('bad_size', 'Could not determine the size of that file.', 400);
  }

  /* Notaries and Commissioners of Oaths are not charged for anything and do
     not keep a repository of their own: the documents they handle belong to
     the clients who uploaded them and count against those accounts. Quota-ing
     a professional would charge them for other people's files. */
  const normalized = normalizeRole(role);
  if (normalized === ROLES.NOTARY || normalized === ROLES.COATH || normalized === ROLES.ADMIN) {
    return { allowed: true, exempt: true };
  }

  const usage = await usageFor({ uid, planId });

  if (usage.usedBytes + incoming <= usage.quotaBytes) {
    return { allowed: true, usage };
  }

  const shortfallMb = ((usage.usedBytes + incoming - usage.quotaBytes) / MB).toFixed(1);

  throw new QuotaError(
    'quota_exceeded',
    `Your repository is full. This file needs ${shortfallMb} MB more than you ` +
      `have left of your ${usage.quotaMb} MB. Nothing has been deleted — an ` +
      'executed document is never removed to make room. Archive documents you ' +
      'no longer need, let unsigned ones lapse, or move to a larger plan.',
  );
}

/** For the UI. Bytes are not a unit anybody reads. */
export function describeUsage(usage) {
  if (!usage) return null;

  const format = (bytes) =>
    bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

  return {
    used: format(usage.usedBytes),
    quota: `${usage.quotaMb} MB`,
    remaining: format(usage.remainingBytes),
    percentUsed: usage.percentUsed,
    documentCount: usage.documentCount,
    /* Three bands rather than a number, because "87%" invites a shrug while
       "nearly full" invites an action. */
    tone: usage.percentUsed >= 95 ? 'danger' : usage.percentUsed >= 80 ? 'warning' : 'ok',
    message:
      usage.percentUsed >= 95
        ? 'Your repository is nearly full. New uploads will be refused soon.'
        : usage.percentUsed >= 80
          ? 'Your repository is filling up. Archive what you no longer need.'
          : null,
    truncated: usage.truncated,
  };
}
