/**
 * Didit adapter.
 *
 * Built against docs.didit.me as of 18 October 2026. Verify against a sandbox
 * session before launch — endpoint paths and signature schemes change.
 *
 *   Create:  POST https://verification.didit.me/v3/session/
 *            x-api-key header; returns { verification_url, session_token }
 *   Result:  signed webhook, HMAC-SHA256
 *
 * THREE THINGS THIS GETS RIGHT ON PURPOSE, because each is a way to end up
 * with an endpoint that lets anyone mark themselves verified:
 *
 *   1. Signature over the RAW BODY. Didit's X-Signature is computed over the
 *      exact bytes sent. Parsing the JSON and re-encoding it changes key order
 *      and whitespace, and the signature then never matches — so the raw body
 *      is read first and parsed only after the signature checks out.
 *   2. Timestamp window. Didit requires rejecting anything more than 300
 *      seconds adrift, which is what stops a captured webhook being replayed
 *      tomorrow.
 *   3. Constant-time comparison, so the signature cannot be guessed a byte at
 *      a time by timing the response.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { KycError, KYC_ERROR, KYC_STATUS, KycProvider } from './provider';

const BASE_URL = process.env.DIDIT_BASE_URL ?? 'https://verification.didit.me';

/** Didit's session statuses are case-sensitive strings, not enums. */
const STATUS_MAP = Object.freeze({
  'Not Started': KYC_STATUS.NOT_STARTED,
  'In Progress': KYC_STATUS.PENDING,
  'Awaiting User': KYC_STATUS.PENDING,
  Resubmitted: KYC_STATUS.PENDING,
  'In Review': KYC_STATUS.IN_REVIEW,
  Approved: KYC_STATUS.APPROVED,
  Declined: KYC_STATUS.DECLINED,
  Abandoned: KYC_STATUS.EXPIRED,
  Expired: KYC_STATUS.EXPIRED,
  // Note the single capital K — Didit's spelling, not a typo.
  'Kyc Expired': KYC_STATUS.EXPIRED,
});

/** Didit rejects webhooks more than this far from now. */
const TIMESTAMP_TOLERANCE_SECONDS = 300;

export class DiditProvider extends KycProvider {
  constructor({
    apiKey = process.env.DIDIT_API_KEY,
    webhookSecret = process.env.DIDIT_WEBHOOK_SECRET,
    workflowId = process.env.DIDIT_WORKFLOW_ID,
  } = {}) {
    super();
    this.apiKey = apiKey;
    this.webhookSecret = webhookSecret;
    this.workflowId = workflowId;
  }

  get id() {
    return 'didit';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.workflowId);
  }

  /**
   * @param {object} options
   * @param {string} options.reference  our id — echoed back as vendor_data
   * @param {string} options.userId
   * @param {string} options.email
   * @param {string} [options.fullName]
   * @param {string} options.returnUrl
   */
  async createSession({ reference, userId, email, fullName = null, returnUrl }) {
    if (!this.isConfigured()) {
      throw new KycError(
        KYC_ERROR.NOT_CONFIGURED,
        'Didit is not configured. Set DIDIT_API_KEY and DIDIT_WORKFLOW_ID.',
        { provider: this.id },
      );
    }

    const payload = {
      workflow_id: this.workflowId,
      // vendor_data comes back on every webhook, so it is how we tie a result
      // to the account that started it without trusting anything else.
      vendor_data: reference,
      vendor_user_id: userId,
      callback: returnUrl,
      metadata: { email, ...(fullName ? { full_name: fullName } : {}) },
    };

    let response;
    try {
      response = await fetch(`${BASE_URL}/v3/session/`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (cause) {
      throw new KycError(KYC_ERROR.NETWORK, 'Could not reach Didit.', {
        provider: this.id,
        cause,
      });
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok || !body.verification_url) {
      throw new KycError(
        KYC_ERROR.PROVIDER_REJECTED,
        body.message ?? body.detail ?? `Didit rejected the request (HTTP ${response.status}).`,
        { provider: this.id },
      );
    }

    return {
      url: body.verification_url,
      reference,
      providerRef: body.session_id ?? body.session_token ?? null,
      provider: this.id,
    };
  }

  /**
   * @param {object} input
   * @param {string|Buffer} input.rawBody  the EXACT bytes received
   * @param {Headers|object} input.headers
   */
  async verifyWebhook({ rawBody, headers }) {
    if (!this.webhookSecret) {
      throw new KycError(
        KYC_ERROR.NOT_CONFIGURED,
        'DIDIT_WEBHOOK_SECRET is not set; webhooks cannot be verified. ' +
          'An unverified identity webhook must never be acted on.',
        { provider: this.id },
      );
    }

    const header = (name) =>
      typeof headers?.get === 'function' ? headers.get(name) : (headers?.[name] ?? null);

    const signature = header('x-signature');
    const timestamp = header('x-timestamp');

    const fail = (reason) => ({
      verified: false,
      status: KYC_STATUS.PENDING,
      reference: null,
      declineReason: reason,
    });

    if (!signature || !timestamp) {
      return fail('Missing signature or timestamp header');
    }

    // Replay window. Without this, a webhook captured once can be replayed
    // indefinitely — the signature stays valid forever.
    const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
    if (!Number.isFinite(age) || age > TIMESTAMP_TOLERANCE_SECONDS) {
      return fail('Timestamp outside the accepted window');
    }

    const expected = createHmac('sha256', this.webhookSecret)
      .update(Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8'))
      .digest('hex');

    if (!constantTimeEquals(expected, signature)) {
      return fail('Signature did not verify');
    }

    // Only now is the body trustworthy enough to parse.
    let event;
    try {
      event = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody);
    } catch {
      return fail('Body is not valid JSON');
    }

    return {
      verified: true,
      status: STATUS_MAP[event.status] ?? KYC_STATUS.PENDING,
      reference: event.vendor_data ?? null,
      providerRef: event.session_id ?? null,
      // event_id is stable across retries and fan-out, so the caller can make
      // processing idempotent. Didit does retry.
      eventId: event.event_id ?? null,
      declineReason: event.decision?.reason ?? null,
      raw: event,
    };
  }

  /** Ask Didit directly, to reconcile a webhook that never arrived. */
  async fetchStatus(sessionId) {
    if (!this.isConfigured()) {
      throw new KycError(KYC_ERROR.NOT_CONFIGURED, 'Didit is not configured.', {
        provider: this.id,
      });
    }

    let response;
    try {
      response = await fetch(`${BASE_URL}/v3/session/${encodeURIComponent(sessionId)}/decision/`, {
        headers: { 'x-api-key': this.apiKey, Accept: 'application/json' },
      });
    } catch (cause) {
      throw new KycError(KYC_ERROR.NETWORK, 'Could not reach Didit.', {
        provider: this.id,
        cause,
      });
    }

    if (!response.ok) {
      throw new KycError(
        KYC_ERROR.PROVIDER_REJECTED,
        `Didit returned HTTP ${response.status} for that session.`,
        { provider: this.id },
      );
    }

    const body = await response.json().catch(() => ({}));

    return {
      status: STATUS_MAP[body.status] ?? KYC_STATUS.PENDING,
      providerRef: sessionId,
      declineReason: body.decision?.reason ?? null,
      raw: body,
    };
  }
}

/** Hash both sides first so unequal lengths cannot throw. */
function constantTimeEquals(a, b) {
  const bufA = createHmac('sha256', 'cmp').update(String(a)).digest();
  const bufB = createHmac('sha256', 'cmp').update(String(b)).digest();
  return timingSafeEqual(bufA, bufB);
}

export default DiditProvider;
