/**
 * Minimal .env loader for the standalone scripts in this folder.
 *
 * Next.js loads .env files itself, but `node scripts/foo.mjs` does not, and
 * adding a dependency for twenty lines is not worth it.
 *
 * Precedence, first found wins: .env.local, .env, .env.production
 * Existing process.env values are never overwritten, so
 * `FOO=bar node scripts/foo.mjs` still works.
 */

import fs from 'node:fs';
import path from 'node:path';

const CANDIDATES = ['.env.local', '.env', '.env.production'];

export function loadEnv(cwd = process.cwd()) {
  const loaded = [];

  for (const name of CANDIDATES) {
    const file = path.join(cwd, name);
    if (!fs.existsSync(file)) continue;

    const text = fs.readFileSync(file, 'utf8');
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const eq = line.indexOf('=');
      if (eq === -1) continue;

      const key = line.slice(0, eq).trim();
      if (!key || key in process.env) continue;

      let value = line.slice(eq + 1).trim();

      // Strip one layer of matching quotes, which is how multi-line values
      // and anything containing spaces are written in a .env file.
      if (
        (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
        (value.startsWith("'") && value.endsWith("'") && value.length > 1)
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
    loaded.push(name);
  }

  return loaded;
}

/* Small console helpers so the scripts read clearly in a terminal. */
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, text) => (useColor ? `\u001b[${code}m${text}\u001b[0m` : text);

export const ok = (text) => console.log(`  ${paint('32', '✓')} ${text}`);
export const bad = (text) => console.log(`  ${paint('31', '✗')} ${text}`);
export const warn = (text) => console.log(`  ${paint('33', '!')} ${text}`);
export const info = (text) => console.log(`    ${paint('90', text)}`);
export const heading = (text) => console.log(`\n${paint('1', text)}`);
