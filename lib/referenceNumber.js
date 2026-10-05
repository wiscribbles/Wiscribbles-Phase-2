import { randomBytes } from 'crypto';

// Unguessable, collision-resistant reference number, e.g. WS-K3M9X2QZ7A4P
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateReferenceNumber() {
  const bytes = randomBytes(12);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `WS-${out}`;
}
