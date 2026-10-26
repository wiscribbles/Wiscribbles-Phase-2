/**
 * A Node module hook so the app's modules can be unit-tested by plain Node.
 *
 * The app is ESM with a `@/` alias in a package that is not `"type": "module"`.
 * Next resolves both; Node resolves neither. Rather than add a bundler, a test
 * framework or `"type": "module"` (which would break the three CommonJS config
 * files at the repo root), this hook does the three smallest things that make
 * `node --test` work. See tests/README.md.
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve as resolvePath } from 'node:path';
import { existsSync, statSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolvePath(HERE, '..');

/*
 * Modules that cannot run outside a server request, mapped to stubs.
 *
 * `server-only` throws on import by design outside React Server Components.
 * The other two reach a real Firebase project; their stubs throw IF CALLED, so
 * a test that accidentally depends on I/O fails loudly instead of passing for
 * the wrong reason.
 */
const STUBS = new Map([
  ['server-only', 'tests/stubs/server-only.mjs'],
  ['@/lib/firebase-admin', 'tests/stubs/firebase-admin.mjs'],
  ['@/lib/storage/server', 'tests/stubs/storage-server.mjs'],
  /* Records claim writes instead of making them. Without this the suspension
     lapse and the certificate expiry are untestable, because both write
     custom claims through `adminAuth()`, which the firebase-admin stub
     refuses. See tests/stubs/auth-claims.mjs. */
  ['@/lib/auth/claims', 'tests/stubs/auth-claims.mjs'],
]);

export async function resolve(specifier, context, nextResolve) {
  const stub = STUBS.get(specifier);
  if (stub) {
    return { url: pathToFileURL(resolvePath(ROOT, stub)).href, shortCircuit: true };
  }

  if (specifier.startsWith('@/')) {
    const target = resolvePath(ROOT, specifier.slice(2));
    /* The alias is extensionless in source, as `jsconfig.json` allows, so the
       extension has to be probed. `pathToFileURL` does NOT throw on a missing
       path — it just builds a URL — so existence must be checked explicitly.
       Getting that wrong resolves every alias to its extensionless form and
       every import fails with ENOENT. */
    for (const candidate of [`${target}.js`, `${target}.jsx`, `${target}/index.js`, target]) {
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        return {
          url: pathToFileURL(candidate).href,
          format: 'module',
          shortCircuit: true,
        };
      }
    }

    throw new Error(
      `tests/loader.mjs could not resolve "${specifier}" under ${ROOT}. ` +
        'Tried .js, .jsx, /index.js and the bare path.',
    );
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  /* Project `.js` files are ESM despite the package having no "type" field.
     node_modules is left entirely alone. */
  if (url.endsWith('.js') && !url.includes('/node_modules/')) {
    return nextLoad(url, { ...context, format: 'module' });
  }
  return nextLoad(url, context);
}
