# What to do before Stage 2

Ordered. Steps 1–6 get you a running application. Steps 7–9 are the decisions
that actually gate Stage 2 — they matter more than the setup does.

Roughly 40 minutes for 1–6, plus whatever steps 7–9 take to answer.

---

## Part A — Get it running (you)

### 1. Put the Admin key into `.env.local`

You have the key file. Do not put it in the repo — `.gitignore` blocks it, but
the point is that it belongs in the environment.

```bash
cp .env.example .env.local
```

Open the downloaded service-account JSON, copy **the entire file onto one
line**, and set it as `FIREBASE_SERVICE_ACCOUNT` in `.env.local`:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...", ... }
```

One line, no wrapping. Most editors will soft-wrap the display — that is fine,
it is real line breaks that break it. Then **delete the downloaded file.**

> Prefer three separate variables instead? Use `FIREBASE_ADMIN_PROJECT_ID`,
> `FIREBASE_ADMIN_CLIENT_EMAIL` and `FIREBASE_ADMIN_PRIVATE_KEY`, keeping the
> literal `\n` sequences in the key and wrapping it in double quotes. Either
> shape works; use one, not both.

### 2. Add the web app config

In the Firebase console: Project settings → General → Your apps. If no Web app
is registered, add one (the `</>` icon, no Hosting). Copy the `firebaseConfig`
values into the matching `NEXT_PUBLIC_FIREBASE_*` lines.

Set `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_SITE_URL` to `http://localhost:3000`
for now.

### 3. Turn on the Firebase services

- **Authentication** → Sign-in method → enable **Email/Password**. Nothing else:
  no email-link, no Google, no Facebook, no Phone.
- **Firestore Database** → Create database → **production mode**, location
  **`us-east1`**. The location is permanent.
- **Storage** → Get started → production mode.

### 4. Check it

```bash
npm install
npm run check-setup
```

This verifies every variable, catches a mangled private key, catches client and
admin credentials pointing at different projects, catches a secret accidentally
given a `NEXT_PUBLIC_` prefix — and then actually connects, listing users and
touching Firestore and Storage. A variable being present proves nothing.

Fix anything marked ✗ and run it again until it says **Ready**.

### 5. Deploy the security rules

```bash
npm install -g firebase-tools    # if you don't have it
firebase login
firebase use --add               # pick the new project
firebase deploy --only firestore:rules
```

`firestore.rules` is default-deny. Until this runs, production mode is blocking
everything, which is the safe failure but will look like the app is broken.

### 6. Build and create your Website Manager account

```bash
npm run build
npm run dev
```

The build should reach `✓ Compiled successfully`. If this is the first time
`npm run build` has worked for you, that is expected — it was broken on `main`
since v1.0 for missing icon fonts, fixed in this branch.

Then:

1. Go to `http://localhost:3000/en/auth/signup`
2. Sign up with your own email. Pick any role — it gets overwritten in a moment.
3. Confirm the email. Without `RESEND_API_KEY` set, the link is **printed in
   your terminal** instead of emailed — copy it from there.
4. Make yourself the Website Manager:

```bash
npm run grant-admin -- you@example.com
```

`admin` is deliberately not a choice at sign-up, so there is no way to self-
promote through the UI. The first Website Manager has to be made with the
service-account key, which is the intended bootstrap: holding the key is the
authority. Sign out and back in afterwards — the role lives in the auth token,
so the old session still carries the old one.

---

## Part B — The decisions that actually gate Stage 2

Part A gets the app running. **These are what hold up the build.**

### 7. Confirm Stripe can pay out to Guyana — blocking, and the big one

Stripe does not list Guyana as a supported country for payouts. If a Guyanese
notary cannot be onboarded to Stripe Connect, then **revenue distribution does
not work** — and revenue distribution is the entire notary side of the business.

What to establish, in writing, from Stripe support:

- Can an individual or business **in Guyana** be onboarded as a Connect account
  and receive payouts to a Guyanese bank account?
- If not, can they be paid as a **cross-border recipient** from a platform
  account registered elsewhere?
- Same question for Trinidad, Jamaica and Barbados, since notaries in those
  jurisdictions come later.

If the answer is no, WiPay replaces Stripe for payouts and I build that half
differently. **Please do not let me build a fortnight of Connect onboarding
before this is answered.**

Collecting *from* attorneys and businesses is far less exposed — much of that
revenue is diaspora-facing — so the subscription half is likely fine either way.

### 8. Confirm the subscription tiers

Attorneys and Businesses pay a platform fee, and I need the actual products to
create in Stripe. The 3 Sept plan has:

| Tier | Monthly |
|---|---|
| Solo | GYD 9,000 |
| Chambers | GYD 28,000 |
| Enterprise | GYD 75,000 |

Confirm these are current, and confirm one thing from that same plan that is a
product rule rather than a price: **subscriptions include e-signature envelopes
only and never notarial seals**, because half of every seal fee leaves the
business. If that still holds I will enforce it in the plan definitions rather
than leaving it to be remembered.

Also: are these billed in GYD or USD? It changes the Stripe configuration.

### 9. Open two accounts (test mode is enough)

- **Stripe** — test keys. Needed to build and verify the billing and payout
  flows. Do not create live products yet; step 7 may change the plan.
- **Didit** — identity verification. The 3 Sept decision was Didit over Persona
  on cost (US$0.33/check, 500 free/month, no minimum, against Persona's
  US$250/month floor on a 12-month contract). I am building a
  provider-agnostic adapter either way, so Persona remains swappable.

And one decision I need rather than an account:

- **Where professional certificates go — SETTLED.** Firebase Storage, decided 18 Oct 2026. Cloudinary has been removed entirely. No extra vendor, no extra keys, and uploads now run through an authenticated server route instead of an unsigned preset exposed in the browser.

---

## What I can start without any of this

The Account tab — jurisdictions, the KYC adapter interface, certificate upload
and validation, the status tracker and the resubmission loop — does not depend
on anything above, and I am starting there.

What waits on you is the **Financials and Invoice tabs**, because step 7 decides
whether they are built on Stripe Connect or WiPay, and step 8 decides what the
subscription products are.
