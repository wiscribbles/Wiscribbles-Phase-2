'use client';

/**
 * Browser-side uploads.
 *
 * Posts to /api/uploads, which authenticates the caller, enforces the size and
 * type limits and derives the storage path from the session. No credentials of
 * any kind live in this file, which is the point: Phase 1 shipped a Cloudinary
 * cloud name and an unsigned upload preset to every visitor.
 */

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / 1024 / 1024;

export const UPLOAD_PURPOSE = Object.freeze({
  CERTIFICATE: 'certificate',
  IDENTIFICATION: 'identification',
  SIGNATURE: 'signature',
  DOCUMENT: 'document',
  STAMPED: 'stamped',
  SUPPORT: 'support',
});

export class UploadError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'UploadError';
    this.code = code;
  }
}

/**
 * Upload a file.
 *
 * @param {File} file
 * @param {object} options
 * @param {string} options.purpose   one of UPLOAD_PURPOSE
 * @param {string} [options.docId]   required for 'document' and 'stamped'
 * @returns {Promise<{ url: string, path: string, bytes: number, contentType: string }>}
 */
export async function uploadFile(file, { purpose, docId = null } = {}) {
  if (!file) throw new UploadError('No file selected.', 'missing_file');

  // Checked here as well as on the server, purely so the user finds out before
  // spending time uploading. The server check is the one that counts.
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(
      `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is ${MAX_UPLOAD_MB}MB.`,
      'file_too_large',
    );
  }

  const form = new FormData();
  form.append('file', file);
  form.append('purpose', purpose);
  if (docId) form.append('docId', docId);

  let response;
  try {
    response = await fetch('/api/uploads', { method: 'POST', body: form });
  } catch {
    throw new UploadError('Could not reach the server. Check your connection.', 'network');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new UploadError(
      data.message ?? 'The upload failed. Please try again.',
      data.error ?? 'upload_failed',
    );
  }

  return data;
}

/** Convenience for the PDF-only paths the brief requires. */
export async function uploadPdf(file, options) {
  if (file && file.type !== 'application/pdf') {
    throw new UploadError('Only PDF files are accepted here.', 'unsupported_type');
  }
  return uploadFile(file, options);
}
