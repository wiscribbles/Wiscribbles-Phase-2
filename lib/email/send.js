/**
 * Transactional email.
 *
 * Phase 1 sent mail from the BROWSER via `@emailjs/browser`, with the EmailJS
 * keys hardcoded in `config/emailjs-config.js`. That means anyone can send mail
 * from the WiScribbles account. Verification mail in particular must be sent
 * server-side or the verification is worthless — a client that can send its own
 * verification email can verify any address.
 *
 * Resend is already a dependency. Keys stay server-side.
 */

import 'server-only';
import { Resend } from 'resend';

const FROM = process.env.EMAIL_FROM ?? 'WiScribbles <no-reply@wiscribbles.com>';

let client = null;
function resend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

/**
 * @returns {Promise<{ ok: boolean, id?: string, skipped?: boolean, error?: string }>}
 * Never throws: a failed email must not roll back the action that triggered it.
 * Callers decide what to tell the user.
 */
export async function sendEmail({ to, subject, html, text }) {
  const mailer = resend();

  if (!mailer) {
    // Local development without a key. Log rather than fail, so the signup flow
    // is testable, but never in production — there it is a real misconfiguration.
    if (process.env.NODE_ENV === 'production') {
      console.error('[email] RESEND_API_KEY is not set; mail was not sent', { to, subject });
      return { ok: false, error: 'mailer_not_configured' };
    }
    console.warn(`[email] no RESEND_API_KEY — would have sent "${subject}" to ${to}`);
    if (text) console.warn(`[email] body:\n${text}`);
    return { ok: true, skipped: true };
  }

  try {
    const { data, error } = await mailer.emails.send({ from: FROM, to, subject, html, text });
    if (error) {
      console.error('[email] send failed', { to, subject, error });
      return { ok: false, error: error.message ?? 'send_failed' };
    }
    return { ok: true, id: data?.id };
  } catch (error) {
    console.error('[email] send threw', { to, subject, error });
    return { ok: false, error: 'send_failed' };
  }
}

/* ------------------------------------------------------------------------- */
/* Templates                                                                  */
/* ------------------------------------------------------------------------- */

const shell = (heading, body) => `
<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f6f8;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1b2434;">
  <table role="presentation" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
    <tr><td>
      <p style="margin:0 0 24px;font-size:18px;font-weight:600;color:#274171;">WiScribbles</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${heading}</h1>
      ${body}
      <p style="margin:32px 0 0;font-size:12px;color:#7a869a;">
        West Indian Scribbles LLC — if you did not expect this email you can ignore it.
      </p>
    </td></tr>
  </table>
</body></html>`;

const button = (href, label) => `
  <p style="margin:24px 0;">
    <a href="${href}" style="display:inline-block;background:#274171;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${label}</a>
  </p>
  <p style="margin:0;font-size:13px;color:#7a869a;word-break:break-all;">
    Or paste this into your browser:<br>${href}
  </p>`;

export const verificationEmail = ({ name, link }) => ({
  subject: 'Confirm your WiScribbles email address',
  text:
    `Hi ${name},\n\nConfirm your email address to activate your WiScribbles account:\n` +
    `${link}\n\nThis link expires in 24 hours.`,
  html: shell(
    `Hi ${name}, confirm your email address`,
    `<p style="margin:0;font-size:15px;line-height:1.6;">
       Confirm your address to activate your account. You will not be able to reach
       your dashboard until this is done.
     </p>
     ${button(link, 'Confirm my email')}
     <p style="margin:16px 0 0;font-size:13px;color:#7a869a;">This link expires in 24 hours.</p>`,
  ),
});

export const partnerSubmittedEmail = ({ name, roleLabel }) => ({
  subject: 'Your WiScribbles application is with our team',
  text:
    `Hi ${name},\n\nYour application to join WiScribbles as a ${roleLabel} has been ` +
    `received and is now under review by the Website Manager. We will email you as ` +
    `soon as a decision is made.`,
  html: shell(
    'Your application is under review',
    `<p style="margin:0;font-size:15px;line-height:1.6;">
       Hi ${name}, your application to join WiScribbles as a <strong>${roleLabel}</strong>
       has been received and is with the Website Manager. We will email you as soon as
       a decision is made.
     </p>`,
  ),
});

export const moreInfoRequestedEmail = ({ name, feedback, link }) => ({
  subject: 'More information needed for your WiScribbles application',
  text:
    `Hi ${name},\n\nThe Website Manager needs more information before your ` +
    `application can proceed:\n\n${feedback}\n\nUpdate your application: ${link}`,
  html: shell(
    'We need a little more information',
    `<p style="margin:0;font-size:15px;line-height:1.6;">
       Hi ${name}, the Website Manager has reviewed your application and needs more
       information before it can proceed:
     </p>
     <blockquote style="margin:16px 0;padding:12px 16px;background:#f4f6f8;border-left:3px solid #274171;font-size:15px;line-height:1.6;">
       ${feedback}
     </blockquote>
     ${button(link, 'Update my application')}`,
  ),
});

export const approvalEmail = ({ name, roleLabel, link }) => ({
  subject: 'Your WiScribbles account has been approved',
  text:
    `Hi ${name},\n\nYour ${roleLabel} account has been approved. You now have full ` +
    `access to your dashboard: ${link}`,
  html: shell(
    'You are approved',
    `<p style="margin:0;font-size:15px;line-height:1.6;">
       Hi ${name}, your <strong>${roleLabel}</strong> account has been approved by the
       Website Manager. Your full dashboard is now open.
     </p>
     ${button(link, 'Open my dashboard')}`,
  ),
});

/* ------------------------------------------------------------------------- */
/* Revocation                                                                 */
/*                                                                            */
/* These four exist because the justification for letting the Website Manager */
/* decide a revocation — rather than the party who asked and paid — is that    */
/* the OTHER parties get to object. A party cannot object to something nobody  */
/* told them about, so until these sent, that justification was hollow.        */
/* ------------------------------------------------------------------------- */

/**
 * To every party who is NOT the requester.
 *
 * The one that matters most. It names the document, says who asked and on what
 * ground, and makes clear that the recipient can say why it should not happen.
 * It does not editorialise about the merits — WiScribbles has not decided yet.
 */
export const revocationRequestedEmail = ({
  name,
  documentName,
  requestedBy,
  ground,
  reason,
  link,
}) => ({
  subject: `Revocation requested: ${documentName}`,
  text:
    `Hi ${name},\n\n` +
    `${requestedBy} has asked WiScribbles to revoke a document you are a party ` +
    `to: "${documentName}".\n\n` +
    `Ground given: ${ground}\n` +
    `Their reason: ${reason}\n\n` +
    `Revoking a document withdraws it — anyone who checks it afterwards is told ` +
    `it has been revoked and should not be relied on. Because you are a party, ` +
    `you can tell us why it should not be revoked before we decide.\n\n` +
    `${link}\n\n` +
    `No decision has been made yet.`,
  html: shell(
    `Someone has asked to revoke "${documentName}"`,
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
       Hi ${name}, <strong>${requestedBy}</strong> has asked WiScribbles to revoke
       a document you are a party to.
     </p>
     <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;">
       <tr><td style="padding:8px 0;color:#7a869a;width:40%;">Document</td><td style="padding:8px 0;">${documentName}</td></tr>
       <tr><td style="padding:8px 0;color:#7a869a;">Ground</td><td style="padding:8px 0;">${ground}</td></tr>
       <tr><td style="padding:8px 0;color:#7a869a;vertical-align:top;">Their reason</td><td style="padding:8px 0;">${reason}</td></tr>
     </table>
     <p style="margin:0;font-size:15px;line-height:1.6;">
       Revoking a document withdraws it: anyone who checks it afterwards is told it
       has been revoked and should not be relied on. Because you are a party, you can
       tell us why it should not be revoked before we decide.
     </p>
     ${button(link, 'View the request')}
     <p style="margin:16px 0 0;font-size:13px;color:#7a869a;">
       No decision has been made yet. We will email you either way.
     </p>`,
  ),
});

/** To the person who asked, confirming it landed. */
export const revocationAcknowledgedEmail = ({ name, documentName, link }) => ({
  subject: `We have your revocation request: ${documentName}`,
  text:
    `Hi ${name},\n\nWe have your request to revoke "${documentName}".\n\n` +
    `Every other party to the document has been told, and may tell us why it ` +
    `should not be revoked. The Website Manager will then decide and we will ` +
    `email you the outcome either way.\n\n` +
    `The fee covers the review, not the result — it is not refunded if the ` +
    `request is refused.\n\n${link}`,
  html: shell(
    'We have your revocation request',
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
       Hi ${name}, we have your request to revoke <strong>${documentName}</strong>.
     </p>
     <p style="margin:0;font-size:15px;line-height:1.6;">
       Every other party to the document has been told, and may tell us why it
       should not be revoked. The Website Manager will then decide, and we will
       email you the outcome either way.
     </p>
     ${button(link, 'Track this request')}
     <p style="margin:16px 0 0;font-size:13px;color:#7a869a;">
       The fee covers the review rather than the result, so it is not refunded if
       the request is refused.
     </p>`,
  ),
});

/**
 * Granted — to every party.
 *
 * The most consequential email the platform sends. Somebody may be relying on
 * this document right now, so it leads with the fact and the reason, and does
 * not bury either behind a link.
 */
export const revocationGrantedEmail = ({
  name,
  documentName,
  reference,
  reason,
  link,
}) => ({
  subject: `REVOKED: ${documentName}`,
  text:
    `Hi ${name},\n\n` +
    `"${documentName}" has been REVOKED by WiScribbles and should no longer be ` +
    `relied on.\n\n` +
    (reference ? `Reference: ${reference}\n` : '') +
    `Reason: ${reason}\n\n` +
    `Anyone who verifies this document from now on will be told that it has been ` +
    `revoked. If you have sent copies to anyone, or if anyone is acting on it, ` +
    `they need to know.\n\n` +
    `A revocation cannot be undone. If the document needs to be replaced, a new ` +
    `one has to be executed.\n\n${link}`,
  html: shell(
    `"${documentName}" has been revoked`,
    `<p style="margin:0 0 16px;padding:12px 16px;background:#fdecea;border-left:4px solid #b3261e;font-size:15px;line-height:1.6;color:#b3261e;">
       <strong>This document has been revoked and should no longer be relied on.</strong>
     </p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hi ${name},</p>
     <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;">
       ${reference ? `<tr><td style="padding:8px 0;color:#7a869a;width:40%;">Reference</td><td style="padding:8px 0;">${reference}</td></tr>` : ''}
       <tr><td style="padding:8px 0;color:#7a869a;vertical-align:top;">Reason</td><td style="padding:8px 0;">${reason}</td></tr>
     </table>
     <p style="margin:0;font-size:15px;line-height:1.6;">
       Anyone who verifies this document from now on is told it has been revoked.
       If you have sent copies to anyone, or anyone is acting on it, they need to
       know. A revocation cannot be undone — if the document needs replacing, a
       new one has to be executed.
     </p>
     ${button(link, 'Verify this document')}`,
  ),
});

/** Refused — to the person who asked. They paid; they get the reasoning. */
export const revocationRefusedEmail = ({ name, documentName, reason, link }) => ({
  subject: `Revocation refused: ${documentName}`,
  text:
    `Hi ${name},\n\nWe have refused your request to revoke "${documentName}". ` +
    `The document stands and remains valid.\n\nReason: ${reason}\n\n` +
    `If circumstances change, or there is something we did not know, you can ` +
    `raise it again or contact support.\n\n${link}`,
  html: shell(
    `Your request to revoke "${documentName}" was refused`,
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
       Hi ${name}, we have refused your request to revoke
       <strong>${documentName}</strong>. The document stands and remains valid.
     </p>
     <p style="margin:0 0 16px;padding:12px 16px;background:#f7fafc;border-left:4px solid #718096;font-size:14px;line-height:1.6;">
       <strong>Reason given:</strong><br>${reason}
     </p>
     <p style="margin:0;font-size:15px;line-height:1.6;">
       If circumstances change, or there is something we did not know about, you
       can raise it again or contact support.
     </p>
     ${button(link, 'Contact support')}`,
  ),
});
