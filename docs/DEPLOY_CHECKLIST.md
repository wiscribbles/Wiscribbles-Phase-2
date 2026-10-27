# Deploy checklist — Netlify

**Written 25 October 2026 for Thomas to run.** Everything in this file is
preparation; the scheduled run that wrote it deliberately did **not** deploy to
production, and did not publish anything to the production domain.

Work top to bottom. Each step says what to verify before moving on, because the
expensive failures here are the ones you only notice two steps later.

> **Before you start, read the two blockers in
> `claude/scheduled-run-2026-10-25.md`.** Launching Guyana still rests on an
> exclusion schedule nobody has read, and there is a professional-conduct
> question about the fee structure that is capable of being fatal to the
> commercial model. Neither is a deployment problem — the site can go up — but
> going up is not the same as taking money for notarial work, and only you can
> make that call.

---

## 0. What is already done

- `npm run build` reaches **"Compiled successfully"** and all 16 static pages
  generate. It then stops at prerendering `/_not-found` with
  `FirebaseError: auth/invalid-api-key`. **That is the correct and expected
  result in an environment with no Firebase credentials** — the 404 page pulls
  in the client SDK, which refuses to initialise without a real API key. With
  the environment variables in step 2 set, this step passes.
- `npm test` — **199 tests**, all passing, zero dependencies added. Run it
  before every deploy; it is the only automated check this project has.
- `netlify.toml` is committed, with security headers and no secrets.
- **Firestore rules, indexes and Storage rules are DEPLOYED to
  `wiscribbles-ecdea` as of 27 October 2026, from the `phase2-live-test`
  branch** — 24 composite indexes, and the ruleset that protects `signUpAs`,
  `isStaff`, `staffRole`, `credentialExpiresAt` and `credentialExpiredAt`.

  Two things went wrong getting there, both worth knowing because both will
  recur:

  1. **The index deploy failed four times on the same error** —
     `HTTP Error: 400, this index is not necessary, configure using single
     field index controls`. Three entries declared a single field as a
     composite index. Firestore refuses those, and **the refusal aborts the
     whole deploy**, so the twenty-three valid indexes did not get created
     either. The error names one index and the symptom is that none of them
     land. See `docs/FIRESTORE_INDEXES.md`.
  2. **The rules were deployed from the wrong branch, twice.** The working
     clone was on `main`, six commits behind, whose ruleset predates the
     privilege-escalation fix entirely. The deploy reported success each time
     because it *was* succeeding — at publishing the old rules. **Check
     `git log --oneline -1` before any deploy**, and after a rules deploy look
     for the line `released rules firestore.rules to cloud.firestore`; an
     index-only deploy compiles the rules file without releasing it, which
     reads almost identically in the log.

---

## 1. Firebase: rules and indexes, BEFORE the first deploy

Composite indexes **fail** queries rather than slowing them, so a deploy
against a project without them produces a site that loads and then errors on
every list view. Indexes also take a few minutes to build and queries fail
until they are ready, so this is a separate step done first, not during.

```bash
npm run deploy-rules      # firestore:rules, firestore:indexes, storage
```

Confirm you are pointed at the right project first — `firebase use` — because
this command will happily overwrite the rules on whichever project is active.

**`firestore.rules` changed on 25 Oct 2026 and the change is a security fix**:
`signUpAs`, `isStaff` and `staffRole` were added to `protectedFields()`.
Without that, any email-verified user could write `isStaff: true` to their own
user document and enter the admin shell. **Re-run `deploy-rules` even if you
ran it recently** — the old ruleset is live until you do.

**Verify:** Firebase console → Firestore → Indexes. Every index reads
**Enabled**, not Building. Then Rules, and check that `protectedFields()`
contains `isStaff`.

Then, once per project:

```bash
npm run backfill-name-lower   # or the admin Account Name filter silently misses
```

---

## 2. Netlify: environment variables

Site configuration → Environment variables. **No value from this list belongs
in any committed file.**

Set the scope deliberately. Anything marked **secret** must not be exposed to
the build-time client bundle, and Netlify's "Contains secret values" marking
should be used so the value is write-only afterwards.

### Site

| Variable | Secret | Notes |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | no | Absolute origin, **no trailing slash**. Email verification links, signing links and the integrity record are built from this. Must match the host you actually serve, including the www/apex choice. |
| `NEXT_PUBLIC_SITE_URL` | no | Same value. |

### Firebase — client SDK

Safe to expose: these identify the project, they do not authorise anything.
Access is governed by `firestore.rules`. From Firebase console → Project
settings → General → **Your apps → SDK setup**. These are **not** in the Admin
SDK JSON — they come from a registered **Web app**, which is a separate thing
you create. If `apiKey`, `messagingSenderId` or `appId` are nowhere to be
found, no Web app has been registered yet.

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` — **copy exactly.** Newer projects end
  `.firebasestorage.app`, older ones `.appspot.com`, and it cannot be guessed
  from the project ID.
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### Firebase — Admin SDK · **SECRET**

Full admin access, bypasses every security rule. Treat it like a root
password, and never give it a `NEXT_PUBLIC_` prefix.

Set **one** of these two shapes; `lib/firebase-admin.js` reads either:

- **(A, preferred)** `FIREBASE_SERVICE_ACCOUNT` — the whole downloaded JSON on
  one line. No newline escaping to get wrong.
- **(B)** `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`,
  `FIREBASE_ADMIN_PRIVATE_KEY` — for secret managers that dislike large blobs.
  Keep the literal `\n` sequences in the private key exactly as the JSON has
  them, in double quotes.

**Copy the values in, then delete the downloaded file from your machine.**

### Email — Resend

| Variable | Secret |
|---|---|
| `RESEND_API_KEY` | **yes** |
| `EMAIL_FROM` | no — must be a verified domain |

Without `RESEND_API_KEY` production **refuses to send and logs an error**. It
does not fail loudly in the UI, so a missing key looks like "emails are not
arriving" rather than like a misconfiguration.

### ZegoCloud — video sessions

| Variable | Secret |
|---|---|
| `ZEGOCLOUD_APP_ID` | no |
| `ZEGOCLOUD_SERVER_SECRET` | **yes** |

**The secret must never carry a `NEXT_PUBLIC_` prefix.** Phase 1 exposed it as
`NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET`, shipping it to every browser and letting
anyone mint a token for any room — including a live session with a stranger's
ID documents on screen. `lib/video/zego.js` now refuses to run at all if the
`NEXT_PUBLIC_` form is set, so if video fails with a configuration error, check
for a stale variable of that name.

### Identity verification — Didit

| Variable | Secret |
|---|---|
| `KYC_PROVIDER` | no — set to `didit` |
| `DIDIT_API_KEY` | **yes** |
| `DIDIT_WEBHOOK_SECRET` | **yes** |
| `DIDIT_WORKFLOW_ID` | no — from Didit Console → Workflows; required to start a session |

### Payments — Stripe only. WiPay is off.

As of 26 October 2026 **Stripe is the only payment provider**. The switch is
`WIPAY_ENABLED = false` in `lib/payments/index.js`, not the absence of
credentials — the routing checks the flag, so filling in the WiPay variables
does not re-enable it.

Set: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (no),
`STRIPE_SECRET_KEY` (**secret**), `STRIPE_WEBHOOK_SECRET` (**secret**).

**Leave every `WIPAY_*` variable unset.** Setting `WIPAY_API_KEY` while WiPay
is disabled achieves nothing except putting a live credential somewhere it is
not needed — and WiPay's payment-request endpoint is unauthenticated, so that
key is the only thing preventing a forged "payment succeeded" callback.

### Do NOT set these

| Variable | Why |
|---|---|
| `NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET` | `videoConfig()` **throws** if it is set, deliberately. A `NEXT_PUBLIC_` prefix publishes the server secret to every browser that loads the app, and the app would still work — so nothing else would ever reveal the mistake. Use `ZEGOCLOUD_SERVER_SECRET`. |
| `FIREBASE_SERVICE_ACCOUNT`, `GOOGLE_APPLICATION_CREDENTIALS` | Alternative ways to supply Admin credentials. Set the three `FIREBASE_ADMIN_*` variables instead, and only those — supplying two mechanisms makes it unclear which one is actually in use. |
| any `WIPAY_*` | See above. |

### `FIREBASE_ADMIN_PRIVATE_KEY` — the one that always breaks

It is a multi-line PEM. Paste it into Netlify complete, including the
`-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines. If the
build fails with a JWT or "invalid PEM" error, the newlines were flattened:
`lib/firebase-admin.js` normalises `\n` escapes, so the fix is to paste the key
with literal `\n` sequences rather than real line breaks, not to re-issue the
key.

**Verify step 2:** Netlify → Deploys → trigger a deploy → the build log shows
`✓ Compiled successfully` **and** gets past `/_not-found` without the
`auth/invalid-api-key` error. If that error is still there, a
`NEXT_PUBLIC_FIREBASE_*` variable is missing or misspelled.

---

## 3. Deploy to a preview first, not to production

**A Netlify project already exists**, found by inspection during the 25 Oct
run — `wiscribbles`, team `6abba4e9077f8cb9e966f97a`, serving
`wiscribbles.netlify.app`. It is on the dev-team plan, has **no custom domain
attached**, and requires SSO team login for all deploys. Nothing about it was
changed: the run inspected it read-only and did not deploy, did not set an
environment variable and did not touch the domain, because triggering
production is yours.

So step 3 is: confirm the repository is connected to that project (Site
configuration → Build & deploy → Continuous deployment), then deploy `main` as
a **branch deploy**, or open a deploy preview. Do not attach a production
domain yet.

Note that the existing site URL is `http://wiscribbles.netlify.app` — if that
is what you intend to serve from for now, `NEXT_PUBLIC_BASE_URL` must be the
**https** form of it, not the http one, or verification links will be built on
a scheme that redirects.

**Point the preview at a separate Firebase project.** A preview sharing the
production project writes test documents into the real `documents` collection —
and executed documents are never deleted, by design, so that mess is
permanent. If you do not have a second project, use the preview only for pages
that do not write.

Give the preview context its own `NEXT_PUBLIC_BASE_URL` (its own URL), or it
will mint verification and signing links pointing at production.

### Smoke-test the preview, in this order

Create a document template first — `/en/admin/templates` — because every
document binds to one and the client flow cannot be used until one exists. An
affidavit or statutory declaration for Guyana, notarised, gives you something
to test against.

1. **Sign up** → the verification email arrives → the dashboard is unreachable
   until you click it.
2. **`/en/dashboard`** dispatches by role.
3. **`/en/admin/partners`** — and separately, confirm a *non-admin* account is
   redirected away from `/en/admin`. That is the 25 Oct security fix; it is a
   server-side redirect now, so it should happen without the admin shell
   flashing first.
4. **`/en/request`** — the client flow. Choose Guyana + notarisation. Confirm
   an excluded type (a will, a power of attorney) is refused **with the statute
   named** and offers Prepare & Register.
5. **Confirm there is no Witness option** in the party list, and that the
   "does this document need a witness?" panel links to `/en/prepare-register`.
   That panel is the 19 Oct decision; a Witness dropdown reappearing means an
   older build.
6. **`/en/authenticate`** — verify a document by reference and date. Then try
   the right reference with the **wrong** date and confirm the response is
   identical to a made-up reference. (This is covered by a test, but it is the
   one public unauthenticated endpoint, so it is worth seeing.)
7. **A video session** end to end. This is the one genuinely unproven piece:
   the ZEGOCLOUD `token04` generator was transcribed from ZEGO's published spec
   and **has never run against a live project**. If the call fails with a token
   error, do not debug the implementation — swap `generateToken04` in
   `lib/video/zego.js` for the official `zego-server-assistant` package. The
   file's surface is deliberately small so the swap is contained.
8. **The homepage navbar "Standard" link and the document tiles** now go to
   `/request`, not the Phase 1 `form-step1` flow. Confirm that, because it was
   changed on 25 Oct and it is the fix that puts the compliance engine back in
   the path of the advertised entry point.

---

## 4. Production — your call, your click

Only after step 3 passes:

1. Attach the custom domain. Netlify → Domain management.
2. Set the production `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_SITE_URL` to that
   exact origin, including the www/apex choice, and set the matching redirect
   in `netlify.toml` (it is commented out, waiting for the decision).
3. Add that origin to Firebase console → Authentication → Settings →
   **Authorized domains**, or sign-in will fail with `auth/unauthorized-domain`
   on the live site only.
4. Only once HTTPS is serving: the `Strict-Transport-Security` header in
   `netlify.toml` is two years and preload-eligible. It is a commitment, not a
   setting — do not enable it on a domain you may need to serve over HTTP.
5. Deploy.

**Verify:** sign in on the live domain, create one real document end to end,
and verify it through `/authenticate`.

---

## 5. Rollback

Netlify keeps every deploy, so the application rollback is immediate and
reliable. The data is the part that does not roll back.

**To roll back the site:** Netlify → Deploys → select the last known-good
deploy → **Publish deploy**. It is atomic and takes seconds. Pin that deploy's
ID in your notes before deploying anything risky, so you are not reading a
list under pressure.

**What does NOT roll back, and what to do about each:**

- **`firestore.rules` and indexes.** `deploy-rules` overwrites; Firebase keeps
  no version history you can one-click restore. The rules are in git, so the
  recovery is `git checkout <good-commit> -- firestore.rules storage.rules`
  then `npm run deploy-rules`. Rolling the *site* back without rolling the
  *rules* back can leave a ruleset that the older code does not satisfy, which
  looks like random permission-denied errors.
- **Firestore data.** Nothing written is undone by a site rollback. In
  particular **executed documents are never deleted** — `assertPurgeable` in
  `lib/retention.js` throws on every permanent status and on anything carrying
  a seal, deliberately, because a notarised instrument is evidence parties
  other than the account holder may need years later. If a bad deploy creates
  bad executed documents, the remedy is the admin **revocation** flow, which
  writes a party-readable record and cannot be undone. It is not deletion and
  it should not be.
- **Custom claims.** Role and status live in Firebase Auth custom claims. A
  rollback does not revert them; `lib/admin/partners.js` logs claims drift
  loudly if a claim write fails after the Firestore write, so check the logs
  before assuming an approval worked.
- **Emails already sent.** Obviously, but worth saying: a verification or
  revocation email cannot be recalled.

**If you need to stop everything quickly** without rolling back: Netlify →
Site configuration → **Stop builds**, and set the site to a holding page via
Domain management. That is faster and less surprising than redeploying an old
build you have not smoke-tested.

---

## 6. Things to check that are not deployment

These came out of the 25 Oct run and are not in the deploy path, but they
affect whether the live site should be advertised:

- The marketing content still advertises documents the compliance engine
  refuses, and the live site's testimonials and FAQ were placeholder text
  attributed to invented people as of 19 Oct. Invented testimonials presented
  as genuine are a consumer-protection problem, not a polish item.
- The live privacy policy claims documents "and recordings" are retained.
  Nothing records anything, and no Act in any of the four jurisdictions
  requires it. The claim needs withdrawing, not implementing.
- The privacy policy promises deletion on request; the architecture refuses it
  for executed instruments, correctly. The policy needs the carve-out.
- Two routes, `/[locale]/notary-dashboard` and `/[locale]/notary/dashboard`,
  are entirely commented out and will error if anyone reaches them. They are
  still registered in the route manifest and `/notary-dashboard` is still
  listed in `middleware.js`. Harmless but untidy; decide whether to delete.
