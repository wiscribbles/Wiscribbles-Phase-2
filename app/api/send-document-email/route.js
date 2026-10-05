import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireUser } from '@/lib/serverAuth';
import { escapeHtml, isTrustedDocumentUrl } from '@/lib/apiUtils';

export const runtime = 'nodejs';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const { error: authError } = await requireUser(request);
  if (authError) return authError;

  try {
    const {
      email,
      documentUrl,
      referenceNumber,
      userName = 'User',
      documentTypeName = 'Document',
    } = await request.json();

    if (!email || !documentUrl) {
      return NextResponse.json({ success: false, error: 'Email and document URL are required' }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 });
    }
    if (!isTrustedDocumentUrl(documentUrl)) {
      return NextResponse.json({ success: false, error: 'Invalid document source' }, { status: 403 });
    }
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      return NextResponse.json({ success: false, error: 'Email service is not configured' }, { status: 503 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Your ${documentTypeName} is ready`,
      html: `
        <p>Dear ${escapeHtml(userName)},</p>
        <p>Your ${escapeHtml(documentTypeName)} is ready.</p>
        <p><a href="${escapeHtml(documentUrl)}">Download your document</a></p>
        ${referenceNumber ? `<p>Reference number: <strong>${escapeHtml(referenceNumber)}</strong></p>` : ''}
      `,
    });
    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Email sent' });
  } catch (error) {
    console.error('Error in send-document-email API:', error);
    return NextResponse.json({ success: false, error: 'Failed to process email request' }, { status: 500 });
  }
}
