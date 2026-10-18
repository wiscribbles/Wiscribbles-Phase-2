// Shared helpers for API routes.

/**
 * SSRF guard for document URLs.
 *
 * Six API routes fetch a URL that arrives in a request body — to stamp it,
 * email it, or stream it back. Without this check, any of them would fetch
 * whatever a caller named, including internal addresses.
 *
 * Phase 1 trusted `*.res.cloudinary.com`, which was an improvement on nothing
 * but still trusted EVERY Cloudinary account, not just ours. Now that all
 * files live in Firebase Storage, the check binds to OUR BUCKET specifically.
 *
 * That distinction matters more than it looks: `storage.googleapis.com` is
 * shared by every project on Google Cloud, so trusting the hostname alone
 * would let an attacker point these routes at any public bucket in the world.
 * Every branch below therefore checks the bucket as well as the host.
 *
 * Three URL shapes reach the same object, and all three are accepted:
 *   https://firebasestorage.googleapis.com/v0/b/BUCKET/o/path?alt=media&token=…
 *   https://storage.googleapis.com/BUCKET/path
 *   https://BUCKET.storage.googleapis.com/path
 */

const FIREBASE_STORAGE_HOST = 'firebasestorage.googleapis.com';
const GCS_HOST = 'storage.googleapis.com';

function bucketName() {
  return process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? null;
}

export function isTrustedDocumentUrl(value) {
  const bucket = bucketName();
  // Fail closed. No configured bucket means nothing is trusted, rather than
  // falling back to trusting the hosts generally.
  if (!bucket) return false;

  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase();

  // https://firebasestorage.googleapis.com/v0/b/BUCKET/o/<encoded path>
  if (host === FIREBASE_STORAGE_HOST) {
    return url.pathname.startsWith(`/v0/b/${bucket}/o/`);
  }

  // https://storage.googleapis.com/BUCKET/<path>
  if (host === GCS_HOST) {
    return url.pathname.startsWith(`/${bucket}/`);
  }

  // https://BUCKET.storage.googleapis.com/<path>
  if (host === `${bucket.toLowerCase()}.${GCS_HOST}`) {
    return true;
  }

  return false;
}

export function sanitizeFilename(name, fallback = 'document.pdf') {
  const cleaned = String(name || '')
    .replace(/[^\w.\- ]+/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 100)
    .trim();
  return cleaned || fallback;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getBaseUrl() {
  const url = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_BASE_URL is not set');
  return url.replace(/\/$/, '');
}
