/**
 * Document integrity — tamper-evidence for an executed instrument.
 *
 * WHY THIS EXISTS INSTEAD OF SESSION RECORDING
 *
 * The question asked was whether the Acts require the session to be recorded.
 * They do not — see `RECORDING_REQUIRED_BY_STATUTE` in `lib/jurisdictions.js`
 * for the reasoning. But reading them for that answer turned up something they
 * DO require that the platform was not doing:
 *
 *   Trinidad s.31(1)(d) — an electronic signature is reliable only if it is
 *   "linked to the information to which it relates in such a manner that any
 *   subsequent change in the information is detectable".
 *
 *   And s.31(2) gives that a real payoff: a record signed with a signature
 *   meeting the s.31 criteria "is deemed to be unaltered since the time of its
 *   signing". A statutory presumption, in exchange for tamper-evidence.
 *
 *   Barbados s.9(3)(a) — the test for integrity is whether the information
 *   "has remained complete and unaltered". Barbados s.11(2)(b) makes "the
 *   reliability of the manner in which the integrity of the information was
 *   maintained" an express factor in evidential weight.
 *
 * Phase 2 sealed documents and stored them. Nothing let anyone demonstrate,
 * later, that the bytes had not changed. A hash does: the digest is computed
 * over the sealed PDF at the moment of execution, stored on the document
 * record, and printed on the certificate page. Anyone holding the file can
 * recompute it and compare.
 *
 * WHAT A HASH DOES AND DOES NOT PROVE
 *
 * It proves the file is byte-identical to the one sealed. That is exactly what
 * "complete and unaltered" asks for.
 *
 * It does NOT prove the platform did not alter the file and recompute the
 * digest — the platform holds both. Defending against the platform itself
 * needs a signature over the digest with a key the platform cannot
 * unilaterally use, or a timestamp from a third party. That is a real
 * limitation and it is written down here rather than glossed over, because a
 * hash presented as more than it is would be worse than no hash at all. For
 * the integrity question the Acts actually pose — has this document changed
 * since it was executed — the digest is sufficient and verifiable by anybody.
 */

import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';

/** SHA-256, hex. Named in the record so a future change stays checkable. */
export const DIGEST_ALGORITHM = 'sha256';

/**
 * Digest a sealed document.
 *
 * @param {Buffer} buffer the exact bytes stored
 * @returns {{ algorithm: string, digest: string, bytes: number }}
 */
export function digestDocument(buffer) {
  const normalized = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  if (normalized.byteLength === 0) {
    throw new Error('Refusing to digest an empty document.');
  }

  return {
    algorithm: DIGEST_ALGORITHM,
    digest: createHash(DIGEST_ALGORITHM).update(normalized).digest('hex'),
    bytes: normalized.byteLength,
  };
}

/**
 * The short form printed on the certificate page.
 *
 * A 64-character hex string is not something a person checks by eye off a
 * printed page. The first and last six, grouped, is comparable at a glance —
 * enough to spot a substituted document, with the full digest available from
 * the verification endpoint for anyone doing it properly.
 */
export const shortDigest = (digest) =>
  !digest || digest.length < 16
    ? null
    : `${digest.slice(0, 6).toUpperCase()}…${digest.slice(-6).toUpperCase()}`;

/** Constant-time comparison, so a verifier cannot time its way to a digest. */
export function digestsMatch(a, b) {
  const left = Buffer.from(String(a ?? ''), 'utf8');
  const right = Buffer.from(String(b ?? ''), 'utf8');
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Check a file against a stored digest.
 *
 * @returns {{ intact: boolean, reason: string|null }}
 */
export function verifyIntegrity({ buffer, stored }) {
  if (!stored?.digest) {
    /* Documents executed before integrity digests were introduced have none.
       Reported as unknown rather than failed — an older instrument is not
       suspect, it simply predates the check, and calling it tampered would be
       a false accusation about a valid document. */
    return {
      intact: null,
      reason:
        'This document was executed before integrity digests were recorded, ' +
        'so its contents cannot be checked this way. That is not a sign of ' +
        'alteration.',
    };
  }

  const computed = digestDocument(buffer);

  if (computed.algorithm !== stored.algorithm) {
    return {
      intact: null,
      reason:
        `Stored digest uses ${stored.algorithm}; this check computes ` +
        `${computed.algorithm}. The two are not comparable.`,
    };
  }

  if (!digestsMatch(computed.digest, stored.digest)) {
    return {
      intact: false,
      reason:
        'The document does not match the digest recorded when it was ' +
        'executed. It has been altered since, or it is not the same file.',
    };
  }

  return { intact: true, reason: null };
}
