// Shared helpers for API routes.

const CLOUDINARY_HOST = /(^|\.)res\.cloudinary\.com$/;

// Exact host match - 'cloudinary.com.evil.com' must NOT pass.
export function isTrustedDocumentUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && CLOUDINARY_HOST.test(url.hostname);
  } catch {
    return false;
  }
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
  const url = process.env.NEXT_PUBLIC_BASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_BASE_URL is not set');
  return url.replace(/\/$/, '');
}
