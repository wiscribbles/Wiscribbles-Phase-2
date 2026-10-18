/**
 * Firebase Storage — server side. The single upload path for the platform.
 *
 * Replaces the Cloudinary calls that Phase 1 scattered across eight files,
 * each with the cloud name `dgyv432jt` and an UNSIGNED upload preset hardcoded
 * into it — including in client-side code, which meant anyone reading the page
 * source could upload anything to the account at WiScribbles' expense.
 *
 * Two kinds of URL, and the difference matters:
 *
 *   `getSignedUrl`   — expires. Use for anything a signed-in user is looking
 *                      at right now: a certificate in the admin review queue,
 *                      a document in a session.
 *   `getTokenUrl`    — a long-lived unguessable URL. Use only where a link has
 *                      to survive in someone's inbox, such as a completed
 *                      document emailed to a signer. Anyone holding the link
 *                      can read the file, so it is the weaker of the two and
 *                      is not the default.
 */

import 'server-only';
import { randomUUID } from 'node:crypto';
import { adminStorage } from '@/lib/firebase-admin';

/** Brief requirement: "Max File Size: Must adhere to the system limit (e.g. 25MB)". */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_DOCUMENT_TYPES = Object.freeze(['application/pdf']);
export const ALLOWED_IMAGE_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]);

/** Logical areas, so paths are consistent and the Storage rules can match them. */
export const STORAGE_PATHS = Object.freeze({
  certificate: (uid, filename) => `users/${uid}/certificates/${filename}`,
  identification: (uid, filename) => `users/${uid}/identification/${filename}`,
  signature: (uid, filename) => `users/${uid}/signatures/${filename}`,
  document: (documentId, filename) => `documents/${documentId}/${filename}`,
  stamped: (documentId, filename) => `documents/${documentId}/stamped/${filename}`,
});

const bucket = () => adminStorage().bucket();

/**
 * Make a filename safe for a storage path.
 * Strips directory traversal and anything that would need escaping.
 */
export function safeFilename(name, fallback = 'file') {
  const cleaned = String(name ?? '')
    .replace(/[\\/]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/^[._-]+/, '')
    .slice(0, 100)
    .trim();
  return cleaned || fallback;
}

/** A filename that cannot collide with another upload in the same folder. */
export const uniqueFilename = (name, fallback) =>
  `${Date.now()}-${randomUUID().slice(0, 8)}-${safeFilename(name, fallback)}`;

/**
 * Upload a buffer.
 *
 * @param {object} options
 * @param {Buffer} options.buffer
 * @param {string} options.path          full object path within the bucket
 * @param {string} options.contentType
 * @param {string[]} [options.allowedTypes]
 * @param {object} [options.metadata]    arbitrary metadata to attach
 * @returns {Promise<{ path: string, bytes: number, contentType: string, token: string }>}
 */
export async function uploadBuffer({
  buffer,
  path,
  contentType,
  allowedTypes = null,
  metadata = {},
}) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('uploadBuffer requires a Buffer.');
  }
  if (buffer.byteLength === 0) {
    throw new Error('Refusing to upload an empty file.');
  }
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(
      `File is ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB. ` +
        `The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`,
    );
  }
  if (allowedTypes && !allowedTypes.includes(contentType)) {
    throw new Error(`Content type "${contentType}" is not allowed here.`);
  }

  // The download token is what makes a token URL unguessable. Generated here
  // so the caller never has to think about it.
  const token = randomUUID();

  await bucket()
    .file(path)
    .save(buffer, {
      contentType,
      resumable: false,
      metadata: {
        contentType,
        metadata: { ...metadata, firebaseStorageDownloadTokens: token },
      },
    });

  return { path, bytes: buffer.byteLength, contentType, token };
}

/**
 * A URL that expires. Prefer this.
 * @param {string} path
 * @param {number} [expiresInMs] default 15 minutes
 */
export async function getSignedUrl(path, expiresInMs = 15 * 60 * 1000) {
  const [url] = await bucket()
    .file(path)
    .getSignedUrl({ action: 'read', expires: Date.now() + expiresInMs });
  return url;
}

/**
 * A long-lived unguessable URL, for links that must survive in an inbox.
 * Anyone holding it can read the file — use deliberately.
 */
export function getTokenUrl(path, token) {
  const name = bucket().name;
  return (
    `https://firebasestorage.googleapis.com/v0/b/${name}/o/` +
    `${encodeURIComponent(path)}?alt=media&token=${token}`
  );
}

/**
 * Upload a generated PDF and return a URL that can be stored, emailed and
 * fetched back by another route.
 *
 * This is the direct replacement for the per-route `uploadToCloudinary`
 * helpers, each of which carried its own copy of the cloud name and preset.
 *
 * Returns a TOKEN url rather than a signed one because these URLs are
 * persisted on documents and emailed to signers, and a signed URL would be
 * dead within the hour. `isTrustedDocumentUrl` in lib/apiUtils.js recognises
 * the shape and binds it to our bucket.
 *
 * @param {object} options
 * @param {Buffer|Uint8Array|ArrayBuffer} options.buffer
 * @param {string} options.folder    logical folder, e.g. 'stamped-documents'
 * @param {string} [options.filename]
 * @param {object} [options.metadata]
 * @returns {Promise<string>} the download URL
 */
export async function uploadGeneratedPdf({
  buffer,
  folder,
  filename = 'document.pdf',
  metadata = {},
}) {
  const normalized = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const path = `${folder}/${uniqueFilename(filename, 'document.pdf')}`;

  const result = await uploadBuffer({
    buffer: normalized,
    path,
    contentType: 'application/pdf',
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    metadata,
  });

  return getTokenUrl(result.path, result.token);
}

/** Read an object back, for stamping or re-processing. */
export async function downloadBuffer(path) {
  const [buffer] = await bucket().file(path).download();
  return buffer;
}

/**
 * Confirm an object a CLIENT uploaded really is what it claims.
 *
 * Storage rules enforce size and type at upload time, but a client could still
 * upload a valid file to one path and then tell the server about a different
 * one. Anything that records a path against a user must verify it here first.
 *
 * @returns {Promise<{ exists: boolean, bytes?: number, contentType?: string, error?: string }>}
 */
export async function verifyUploadedObject(path, { allowedTypes = null } = {}) {
  const file = bucket().file(path);

  const [exists] = await file.exists();
  if (!exists) return { exists: false, error: 'No file at that path.' };

  const [meta] = await file.getMetadata();
  const bytes = Number(meta.size);
  const contentType = meta.contentType;

  if (bytes > MAX_UPLOAD_BYTES) {
    return { exists: true, bytes, contentType, error: 'File exceeds the size limit.' };
  }
  if (allowedTypes && !allowedTypes.includes(contentType)) {
    return {
      exists: true,
      bytes,
      contentType,
      error: `Content type "${contentType}" is not allowed here.`,
    };
  }

  return { exists: true, bytes, contentType };
}

export async function deleteObject(path) {
  await bucket()
    .file(path)
    .delete({ ignoreNotFound: true });
}

/**
 * The bucket this deployment writes to. Used by the SSRF guard in
 * lib/apiUtils.js to bind trusted URLs to OUR bucket specifically rather than
 * to Google's storage hosts in general — those are shared by every project on
 * Google Cloud, so trusting the hostname alone would trust the world.
 */
export const storageBucketName = () =>
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? null;
