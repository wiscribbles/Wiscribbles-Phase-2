# Tests

**These are the first tests in this repository.** Before 25 October 2026 there
were none at all, and that was recorded as the largest outstanding risk in the
project: every place where a subtly wrong answer does real damage was verified
only by someone's reading of it.

So this suite is deliberately not broad. It covers the seven modules where a
wrong answer has a consequence outside the software — a refusal that should
have happened and did not, two notaries on one client, a client charged for
something the platform cannot supply, an instrument executed out of turn, a
two-factor lookup that has quietly become one-factor, or evidence destroyed.
Getters and formatters are not covered and should not be; a hundred tests over
trivia would make the suite slower to run and no more informative.

## Running them

```bash
npm test
```

No test framework is installed and none is needed. These use `node:test` and
`node:assert`, both built into Node, so the suite adds **zero dependencies** to
a project whose dependency list is already long.

## Why there is a loader

The app is ESM (`import`/`export`) with a `@/` path alias, inside a package
that has no `"type": "module"`. Next.js resolves both itself; plain Node
resolves neither. `tests/loader.mjs` is a ~60-line Node module hook that does
three things and nothing else:

1. maps `@/x` to the repository root, matching `jsconfig.json`;
2. forces project `.js` files to load as ES modules;
3. redirects three modules that cannot run outside a server request to stubs in
   `tests/stubs/` — `server-only`, `@/lib/firebase-admin` and
   `@/lib/storage/server`.

The stubs for the last two **throw if anything actually calls them**. That is
the point: a unit test that silently reached a real database would be worse
than no test, and these are pure-logic tests that should never need one. If a
test fails with "a test called adminDb()", the test is wrong, not the stub.

`"type": "module"` was deliberately NOT added to `package.json`, because
`next.config.js`, `postcss.config.js` and `tailwind.config.js` are CommonJS and
would break.
