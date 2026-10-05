import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/serverAuth';
import { isTrustedDocumentUrl, sanitizeFilename } from '@/lib/apiUtils';

export const runtime = 'nodejs';
export const maxDuration = 30;

async function proxyDocument(documentUrl, rawFileName) {
  if (!documentUrl) {
    return NextResponse.json({ error: 'Document URL is required' }, { status: 400 });
  }
  if (!isTrustedDocumentUrl(documentUrl)) {
    return NextResponse.json({ error: 'Invalid document source' }, { status: 403 });
  }

  const response = await fetch(documentUrl, { redirect: 'error' });
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: response.status });
  }

  const contentType = response.headers.get('content-type') || 'application/pdf';
  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${sanitizeFilename(rawFileName)}"`,
      'Content-Length': body.byteLength.toString(),
      'Cache-Control': 'private, no-store',
    },
  });
}

export async function GET(request) {
  const { error: authError } = await requireUser(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    return await proxyDocument(searchParams.get('url'), searchParams.get('filename'));
  } catch (error) {
    console.error('Error in download-document API:', error);
    return NextResponse.json({ error: 'Failed to process document download' }, { status: 500 });
  }
}

export async function POST(request) {
  const { error: authError } = await requireUser(request);
  if (authError) return authError;
  try {
    const { documentUrl, fileName } = await request.json();
    return await proxyDocument(documentUrl, fileName);
  } catch (error) {
    console.error('Error in download-document API:', error);
    return NextResponse.json({ error: 'Failed to process document download' }, { status: 500 });
  }
}
