/**
 * Shareable signing links — the Social Media tab.
 *
 * Brief: the Attorney and Business dashboards can "generate a signing link to
 * share over social media or messaging" so a counterparty can sign without an
 * account.
 *
 * WHAT A LINK LIKE THIS ACTUALLY IS
 *
 * A bearer credential. Anyone holding the URL can act on the document, and the
 * URL is about to be pasted into WhatsApp, posted on a timeline, or forwarded
 * by someone it was never sent to. That is the whole point of the feature and
 * it cannot be designed away — but it does decide how the token is handled:
 *
 *  1. ONLY A HASH IS STORED. The token is generated, shown to its creator once,
 *     and never persisted in a readable form. A leaked database gives an
 *     attacker a list of SHA-256 digests, not a set of working links. This is
 *     the same reasoning as storing password hashes, and it has the same
 *     consequence: a link that is lost cannot be recovered, only reissued. That
 *     is the correct trade and the UI says so plainly.
 *
 *  2. EVERY LINK EXPIRES. There is no "no expiry" option. A signing link with
 *     no end date is a permanent hole in a document's control, sitting in a
 *     chat history for years.
 *
 *  3. LINKS ARE REVOCABLE AND COUNTED. Revoking takes effect on the next use,
 *     and a use limit lets a link meant for one counterparty behave like one.
 *
 *  4. THE TOKEN IS COMPARED IN CONSTANT TIME, via the hash lookup — the link
 *     is found BY its digest rather than fetched and then compared, so there is
 *     no comparison to time.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const SIGNING_LINKS_COLLECTION = 'signingLinks';

/** 32 bytes, base64url. Not guessable, and short enough to paste. */
const TOKEN_BYTES = 32;

export const MAX_TTL_DAYS = 30;
export const DEFAULT_TTL_DAYS = 7;

export const LINK_STATUS = Object.freeze({
  ACTIVE: 'active',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
  USED_UP: 'used_up',
});

export const LINK_PURPOSE = Object.freeze({
  /** Counterparty signs the document. */
  SIGN: 'sign',
  /** Counterparty reviews only; no signature captured. */
  REVIEW: 'review',
});

export const LINK_PURPOSE_OPTIONS = Object.freeze([
  { value: LINK_PURPOSE.SIGN, label: 'Sign the document' },
  { value: LINK_PURPOSE.REVIEW, label: 'View only, no signature' },
]);

/** Generate a token and its stored digest. The token is returned once. */
export function mintToken() {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

export const hashToken = (token) =>
  createHash('sha256').update(String(token), 'utf8').digest('hex');

/**
 * Constant-time digest comparison.
 *
 * The lookup is by digest, so this is belt-and-braces for any path that ends up
 * comparing two hashes directly rather than querying for one.
 */
export function digestsMatch(a, b) {
  const left = Buffer.from(String(a ?? ''), 'utf8');
  const right = Buffer.from(String(b ?? ''), 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function validateLinkRequest({ documentId, purpose, ttlDays, maxUses, label }) {
  const errors = {};

  if (!documentId || String(documentId).trim().length === 0) {
    errors.documentId = 'Choose which document the link is for.';
  }

  if (!Object.values(LINK_PURPOSE).includes(purpose)) {
    errors.purpose = 'Choose what the recipient may do.';
  }

  const days = Number(ttlDays ?? DEFAULT_TTL_DAYS);
  if (!Number.isFinite(days) || days < 1 || days > MAX_TTL_DAYS) {
    errors.ttlDays = `Choose between 1 and ${MAX_TTL_DAYS} days.`;
  }

  if (maxUses !== null && maxUses !== undefined && maxUses !== '') {
    const uses = Number(maxUses);
    if (!Number.isInteger(uses) || uses < 1 || uses > 100) {
      errors.maxUses = 'Leave blank for no limit, or choose between 1 and 100.';
    }
  }

  if (label && String(label).length > 120) {
    errors.label = 'Keep the label under 120 characters.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** The current state of a stored link, which is not always its stored status. */
export function effectiveStatus(link, now = Date.now()) {
  if (link?.status === LINK_STATUS.REVOKED) return LINK_STATUS.REVOKED;

  const expires = Date.parse(link?.expiresAt ?? '');
  if (Number.isNaN(expires) || expires <= now) return LINK_STATUS.EXPIRED;

  const max = link?.maxUses ?? null;
  if (max !== null && (link?.useCount ?? 0) >= max) return LINK_STATUS.USED_UP;

  return LINK_STATUS.ACTIVE;
}

export const isUsable = (link, now = Date.now()) =>
  effectiveStatus(link, now) === LINK_STATUS.ACTIVE;

/** The shape safe to list back to the creator. Never includes a token. */
export function redactLink(id, data, now = Date.now()) {
  return {
    id,
    label: data?.label ?? null,
    documentId: data?.documentId ?? null,
    documentName: data?.documentName ?? null,
    purpose: data?.purpose ?? null,
    status: effectiveStatus(data, now),
    expiresAt: data?.expiresAt ?? null,
    maxUses: data?.maxUses ?? null,
    useCount: data?.useCount ?? 0,
    lastUsedAt: data?.lastUsedAt ?? null,
    createdAt: data?.createdAt ?? null,
    /* No tokenHash. A digest is not a credential, but publishing one invites
       an offline attack on a 32-byte secret for no benefit whatsoever. */
  };
}

export const expiryFrom = (ttlDays, now = Date.now()) =>
  new Date(now + Number(ttlDays) * 86400000).toISOString();

/** The URL handed to the creator, assembled once and never stored. */
export const buildLinkUrl = ({ origin, locale, token }) =>
  `${String(origin).replace(/\/$/, '')}/${locale}/sign/${token}`;
