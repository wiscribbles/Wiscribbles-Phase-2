/**
 * Authenticated file upload.
 *
 * Phase 1 uploaded straight from the browser to Cloudinary with the cloud name
 * and an UNSIGNED preset in the page source, which meant anyone could upload
 * anything to the account. Uploads now go through here: the caller is
 * authenticated, the size and type are enforced server-side, and the storage
 * path is derived from the session rather than supplied by the client.
 *
 * POST multipart/form-data
 *   file     the file
 *   purpose  one of PURPOSES below
 *   docId    required when purpose is 'document' or 'stamped'
 *
 * → { url, path, bytes, contentType }
 */

import { NextResponse } from 'next/server';
import { authErrorResponse, requireApiUser } from '@/lib/auth/server';
import { QuotaError, assertRoomFor } from '@/lib/quota';
import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  getTokenUrl,
  uniqueFilename,
  uploadBuffer,
} from '@/lib/storage/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * What each purpose may contain and where it lands. The path is built here
 * from the authenticated uid — never from anything the client sends — so a
 * caller cannot write into another user's folder.
 */
const PURPOSES = {
  certificate: {
    types: [...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_IMAGE_TYPES],
    path: ({ uid, filename }) => `users/${uid}/certificates/${filename}`,
  },
  identification: {
    types: [...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_IMAGE_TYPES],
    path: ({ uid, filename }) => `users/${uid}/identification/${filename}`,
  },
  signature: {
    types: ALLOWED_IMAGE_TYPES,
    path: ({ uid, filename }) => `users/${uid}/signatures/${filename}`,
  },
  // Brief: "any documents uploaded by the user must be strictly a pdf document."
  document: {
    types: ALLOWED_DOCUMENT_TYPES,
    requiresDocId: true,
    path: ({ docId, filename }) => `documents/${docId}/${filename}`,
  },
  stamped: {
    types: ALLOWED_DOCUMENT_TYPES,
    requiresDocId: true,
    path: ({ docId, filename }) => `documents/${docId}/stamped/${filename}`,
  },
  support: {
    types: [...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_IMAGE_TYPES],
    path: ({ uid, filename }) => `support/${uid}/${filename}`,
  },
  /**
   * A PDF the user has just modified in the browser — the legacy footer and
   * page-number flow in the dashboard. Lands in the user's own folder because
   * it has no document record yet. Stage 6 moves this work server-side and
   * this purpose goes with it.
   */
  generated: {
    types: ALLOWED_DOCUMENT_TYPES,
    path: ({ uid, filename }) => `users/${uid}/generated/${filename}`,
  },
};

/** docId comes from the client, so it must not be able to escape its folder. */
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

export async function POST(request) {
  try {
    const user = await requireApiUser();

    let form;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const file = form.get('file');
    const purposeKey = String(form.get('purpose') ?? '');
    const docId = form.get('docId') ? String(form.get('docId')) : null;

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'missing_file' }, { status: 400 });
    }

    const purpose = PURPOSES[purposeKey];
    if (!purpose) {
      return NextResponse.json(
        {
          error: 'invalid_purpose',
          message: `purpose must be one of: ${Object.keys(PURPOSES).join(', ')}`,
        },
        { status: 400 },
      );
    }

    if (purpose.requiresDocId && (!docId || !SAFE_ID.test(docId))) {
      return NextResponse.json(
        { error: 'invalid_doc_id', message: 'A valid docId is required for this purpose.' },
        { status: 400 },
      );
    }

    // Check the declared size before reading the body into memory.
    if (typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: 'file_too_large',
          message: `File is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is ${
            MAX_UPLOAD_BYTES / 1024 / 1024
          }MB.`,
        },
        { status: 413 },
      );
    }

    const contentType = file.type || 'application/octet-stream';
    if (!purpose.types.includes(contentType)) {
      return NextResponse.json(
        {
          error: 'unsupported_type',
          message:
            purpose.types.length === 1 && purpose.types[0] === 'application/pdf'
              ? 'Only PDF files are accepted here.'
              : `Accepted types: ${purpose.types.join(', ')}.`,
        },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Re-check against the real length — `file.size` is a client-supplied
    // header and the body is what actually lands in the bucket.
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'file_too_large' }, { status: 413 });
    }

    /* The repository quota.
     *
     * Checked against the REAL byte length, after the body has landed but
     * before anything is written to the bucket — a client-supplied size header
     * would be the obvious thing to lie about, and refusing after the write
     * would mean the bytes were already stored.
     *
     * Professionals are exempt: the documents they handle belong to the
     * clients who uploaded them and count against those accounts. Quota-ing a
     * notary would charge them for other people's files. See lib/quota.js. */
    try {
      await assertRoomFor({
        uid: user.uid,
        planId: user.planId ?? null,
        role: user.role,
        bytes: buffer.byteLength,
      });
    } catch (error) {
      if (error instanceof QuotaError) {
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: error.status },
        );
      }
      throw error;
    }

    const filename = uniqueFilename(file.name, 'upload');
    const path = purpose.path({ uid: user.uid, docId, filename });

    const result = await uploadBuffer({
      buffer,
      path,
      contentType,
      allowedTypes: purpose.types,
      metadata: { uploadedBy: user.uid, purpose: purposeKey },
    });

    return NextResponse.json({
      url: getTokenUrl(result.path, result.token),
      path: result.path,
      bytes: result.bytes,
      contentType: result.contentType,
    });
  } catch (error) {
    if (error?.status) return authErrorResponse(error);
    console.error('[uploads] failed', error);
    return NextResponse.json(
      { error: 'upload_failed', message: error?.message ?? 'Upload failed.' },
      { status: 500 },
    );
  }
}
