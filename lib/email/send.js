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
