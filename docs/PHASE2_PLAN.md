# WiScribbles Phase 2 — Gap Analysis & Build Plan

Source: *WiScribble Platform Project Brief: Phase 2 Enhancements* (TG Edit)
Baseline: `wiscribbles/WiScribble` @ `c126d44` (branch `fix/security-and-deploy-hardening`,
which was never merged to `main` — see note below)
Repository: `wiscribbles/Wiscribbles-Phase-2`, branch `main`
Date: 18 October 2026

> **Baseline note.** This plan was first written against `main` @ `dbde6d0`. An
> unmerged branch, `fix/security-and-deploy-hardening` (5 Oct 2026), was found
> afterwards and Phase 2 was rebased onto it. It had already removed the
> committed Admin key, moved API routes to the Admin SDK, moved the ZegoCloud
> secret server-side at `/api/zego-token`, fixed an SSRF host check and a
> filename header injection, moved Stripe pricing server-side, and deleted the
> debug/test routes. Several "absent" rows below were satisfied by it. **It is
> still unmerged on `WiScribble`, so none of those fixes are in production.**

---

## Decisions taken (confirmed with Thomas, 18 Oct 2026)

| Question | Decision |
|---|---|
| Identity verification | **Provider-agnostic KYC adapter, Didit wired first.** The brief named Persona; the 3 Sept launch brief costed Persona at GYD 52,250/mo against a GYD 600,000 capital base and ruled it out. Adapter keeps Persona swappable. |
| Public sign-up fields | **Full name, email, password + role selector.** No phone, no social login. |
| Real Estate Agent role | **Dropped.** Existing accounts migrate to Business. |
| Payment gateway | **Stripe + Stripe Connect.** Conditional on Stripe supporting payouts to Guyanese bank accounts — see Open Risks. |

---

## Baseline assessment

The existing app is Next.js 14 (App Router), React 18, Firebase (Auth + Firestore + Storage),
Supabase (realtime), ZegoCloud, Stripe (dependency, largely unwired), pdf-lib / pdfjs-dist /
pdfkit, Zustand, next-intl. 282 JS/JSX files.

Several Phase 2 dependencies are **already installed but unused or half-used** — `pdf-lib`,
`pdfjs-dist`, `stripe`, `@zegocloud/zego-uikit-prebuilt`. That is good news for the plugin
work: it is wiring, not procurement.

The weak points are structural rather than cosmetic:

- **No server-side authorisation.** `middleware.js` runs `next-intl` only. Every guard
  (`AdminGuard.jsx`, `AdminRoute.js`, `AuthRoute.js`, `ProtectedRoute.js`, `ProtectedRoute.jsx`)
  is client-side, which means route protection is advisory. There are five overlapping guard
  components with no single source of truth.
- **No COaths role.** `getRoleFromSignUp` maps to `notary | attorney | business |
  real_estate_agent | user`. Commissioner of Oaths does not exist anywhere in the codebase.
- **Status model is a stub.** `determineInitialStatus` returns `pending_review` for Notary and
  Attorney and `active` for everyone else. Nothing enforces it; `admin_feedback` and the
  resubmission loop described in the brief have no implementation.
- **Dashboards are template leftovers.** `dashboard/`, `notary-dashboard/`, `notary/dashboard/`,
  `secondary-dashboard/` plus `calender/ document/ member/ profile/ settings` are four parallel
  partial dashboards. `constants/menu-items.js` is still the purchased theme's menu (Calendar,
  Chat, Ecommerce). None of the tab structures in the brief exist.
- **Document workflow is form-field based.** `form-step1..5` + `config/documentTypes.js`
  (30KB registry) + `DynamicFormRenderer` collect typed input and generate a PDF. The brief
  replaces this wholesale with PDF upload + stamping.
- **Security.** See the separate security note — committed Firebase Admin key, raw card data
  in Firestore, ZegoCloud server secret exposed client-side.

---

## Requirement-by-requirement gap table

Legend: **Present** = works as specified · **Partial** = exists, needs rework · **Absent** = build from zero

### 1. Sign-up revision

| Requirement | State | Work |
|---|---|---|
| Public endpoint collects name, email, password only | **Done** | `SignUpForm2.jsx` deleted — it was writing raw card numbers to Firestore. `components/auth/SignUpForm.jsx` collects name, email, password, role. |
| Dashboard access only after email verification | **Done** | `requireVerifiedUser` in `lib/auth/server.js`, enforced server-side on every dashboard route. |
| Admin panel controls correspond to role at sign-up | **Done** | Role lives in auth custom claims, read by the middleware, the server guards and `firestore.rules`. |

### 2. Administrative dashboards

| Requirement | State | Work |
|---|---|---|
| Notary pre-approval: restrict to Account + Financials | **Done** | `TAB_MATRIX` in `lib/roles.js`; the nav and the per-tab guard read the same function. |
| Redirect `pending_review` → `/onboarding/verification` | **Done** | `requirePartner`, plus the `/dashboard` dispatcher, which sends them there before the flicker. |
| Jurisdiction(s) of practice capture | **Done** | Multi-select on the Account tab, validated against `lib/jurisdictions`, frozen on approval. |
| KYC trigger from Account tab | **Done** | `lib/kyc/*` adapter with Didit wired; `/api/kyc/start` + HMAC-verified webhook. |
| Certificate upload, 25MB cap | **Done** | Cloudinary removed entirely. `/api/uploads` authenticates the caller, enforces the 25MB cap and the permitted content types, and derives the storage path from the session rather than from the request. `storage.rules` enforces the same limits on any direct client write. |
| Bank capture + tokenization (Financials) | **Parked** | Deliberately not collecting bank details until the Stripe-vs-WiPay payout question is settled, so nobody enters them twice into two providers. |
| Status tracker + `admin_feedback` + resubmission | **Done** | `OnboardingStatusTracker`; saving while `more_info_requested` returns to the queue and clears the feedback. |
| Notary post-approval: Account / Analytics / Support / Financials | **Done** | All four built. Financials is a `ParkedTab` pending the transmission decision. |
| Go Live / Offline toggle → realtime status | **Done** | `lib/availability.js` + `/api/partner/availability`. Server-written only, with a 2-minute presence TTL and a 1-minute heartbeat, so a closed laptop stops receiving work. |
| Jurisdiction-based waiting queue, realtime | **Done** | `lib/queue.js` + `/api/partner/queue`, polled at 5s. Polled rather than `onSnapshot` so client identities can be redacted server-side until acceptance. |
| Accept Client / Decline Request | **Done** | `/api/partner/queue/claim`, both as Firestore transactions so two notaries cannot claim one client. Audited. |
| Session: Zego SDK + PDF viewer embedded | **Done** | `components/session/SessionView.jsx` — the composition Phase 1 never made. UIKit Prebuilt in a panel with sharing/chat/layout controls off, PDF beside it. |
| **Jurisdiction lockout — session must not proceed on mismatch** | **Done** | Four server-side gates: request, accept, session creation, execution. The session banner displays the *recorded* server result with the statute, not a browser re-check. |
| Earnings / payouts view | **Parked** | Deliberately not built against a guess at the provider. The Financials tab says what it is waiting for. |
| Virtual stamp (e-seal) module | **Done** | `lib/stamp.js`. Reads the PDF from Storage **by path**, not by a client-supplied URL as the Phase 1 routes did. Certificate on its own appended page so execution clauses are never covered; seal mark, per-page footer, and the statutory authority written onto the instrument. |
| COaths — identical to Notary | **Done** | `ROLES.COATH` throughout; one dashboard component serves both, differing only in which service type the queue matches. |
| Attorney 7 tabs (Account, Appointment, Social Media, Analytics, Support, Invoice, File Manager) | **Done** | Six working; Invoice is a `ParkedTab`. |
| Attorney pre-approval: Account + Invoice only | **Done** | Same `TAB_MATRIX`. |
| Attorney subscription via card (Invoice tab) | **Parked** | Stripe Checkout is built (`lib/payments/stripe.js`, plans in `lib/plans.js`) but not switched on: collecting before the platform can pay out is the wrong way round. |
| Appointment scheduling, max 24h window, e-sign vs notarise vs COath | **Done** | `lib/appointments.js`. "Max 24h" read as a booking horizon — see the note in that file. Refuses notarisation in e-signature-only jurisdictions. |
| Social media signing-link generation | **Done** | `lib/signingLinks.js`. Only a SHA-256 digest is stored, so a link is shown once and cannot be recovered — reissued instead. Every link expires; all are revocable. |
| File Manager repository | **Done** | `/api/files`. Downloads are 10-minute signed URLs and are audited; nothing is deleted, only archived. |
| Business role — as Attorney, registration doc instead of law certificate, no jurisdiction limit | **Done** | `SubscriberDashboard` serves both; `JURISDICTION_BOUND_ROLES` excludes them. |
| Website Manager: accept / reject / request more info | **Done** | `lib/admin/partners.js` — status, then claims, then audit, then email, with claims-drift logged loudly if the claim write fails after the Firestore write. |
| Document repository with Jurisdiction / Partner Type / Account Name filters | **Done** | `lib/admin/documents.js` + `/admin/documents`. Account Name is a two-step prefix lookup against `users.nameLower` — Firestore has no substring matching, and the UI says what the filter actually matches. |
| Audit, flag suspicious, revoke signed documents | **Done** | Flag and revoke are deliberately different weights of control. Revocation requires a ground and a written reason, refuses anything not executed, refuses a second revocation, writes a party-readable record, and cannot be undone. |
| Sanction / suspend for a period / remove partners | **Done** | Stage 3 built the decision; Stage 3b made it end. `suspendedUntil` was being written and never read, so every timed suspension was permanent. It now lapses on the account's next request — `lib/admin/sanctions.js`. |
| Issue payments for partner balances | **Parked** | Same reason as the Financials tab. |

### 3. Graphics

| Requirement | State | Work |
|---|---|---|
| Logo visibility fix | **Needs live reproduction** | `Logo.jsx` injects a `<style>` element into `document.head` on every mount and removes it on unmount — with two logos mounted, the first unmount strips the shared styles. Likely cause; needs confirming against the live site. |
| Heading images rendering as square boxes | **Root cause found and fixed** | Not missing images — missing **icon webfonts**. The headings use `<i className="flaticon-*">` and FontAwesome glyphs; when the webfont fails to load the browser renders the tofu box. `public/assets/v1/fonts` and `v2/fonts` were each missing five FontAwesome files including `fa-solid-900.{eot,ttf,svg}`, and `_bootstrap-icons.scss` pointed `$bootstrap-icons-font-dir` at `"../../fonts"` while every sibling partial uses `"../fonts"`, resolving outside `public/assets` entirely. Both fixed. Verify against the live site. |
| "Notarize Now" button routes to wrong page | **Done** | Diagnosed without live reproduction: FOUR buttons, four wrong destinations — `/${locale}/signIn` (wrong casing), `/en/form-step1` (locale hard-coded, Phase 1 form model), `/auth/signin` (no locale), `/about` (the page it is on). All now go through `lib/routes.js`. |

**`npm run build` was broken on `main` and had been since v1.0.** The missing
icon fonts above were hard webpack resolution errors, not warnings, so no
production build could complete. Fixed in the same change. The build now reaches
"Compiled successfully" and stops only at prerender for want of Firebase
credentials.

### 4. Plugin / workflow

| Requirement | State | Work |
|---|---|---|
| Platform fee collection (Stripe) | **Parked** | Built, not switched on. |
| Revenue distribution (Stripe Connect) | **Blocked** | The money-transmission question. Stripe Connect cannot reach the Caribbean; Global Payouts can but needs a US/UK platform entity. WiPay has no recurring primitive. Your call, once WiPay is set up. |
| KYC replacement | **Done** | Provider-agnostic adapter; Didit live, Persona throws with an explanation rather than pretending. |
| PDF stamping, core PDF uneditable, upload must be PDF | **Done** | PDF only, enforced server-side against Storage metadata. Rejected with the reason: a conversion step between what the client approved and what the notary seals is a gap nobody can audit. |
| ZegoCloud video | **Done, one thing unproven** | Secret is server-side in `lib/video/zego.js`; tokens are per-session and per-participant. The `token04` generator was transcribed from ZEGO's spec and has NEVER been tested against a live project — if a call fails on a token error, swap in `zego-server-assistant`. |
| Workflow order: Personal Info → Doc Selection → Signature & Notarization → Payment → Download | **Done** | `components/client/RequestWizard.jsx`. Jurisdiction and service are chosen **before** the upload, so a refusal happens before the client has uploaded or paid anything. |
| COaths as distinct role everywhere | **Done** | |
| T&Cs checkbox at Document Selection | **Done** | Recorded to `/acceptances` with the text VERSION accepted, immutable. A tick box that gates a button and is then forgotten proves nothing. |
| Disclaimer pop-up before upload, jurisdiction-specific | **Done** | Versioned constants in `lib/clientRequests.js`, not component text — text in a component changes silently on deploy and takes the meaning of every past acceptance with it. |
| Document-to-role and document-to-jurisdiction mapping via admin templates | **Done** | `lib/templates.js` + `/admin/templates`. Unavailable types are shown to the client **with their reason** rather than filtered out — an empty list reads as a broken website. |
| Document revocation (paid), multi-party KYC opt-in, auth code returns "Revoked" | **Absent** | Stage 7, the only brief requirement not started. Admin-side revocation is done; client-initiated paid revocation is not, and the `authenticate/` code lookup does not yet report "Revoked". |

**Count: 7 partial-and-usable, 12 partial-needs-rework, 30 absent.**

---

## Build order

Staged so each stage is reviewable on its own and nothing is built on a foundation that is
still moving.

**Stage 0 — Security remediation.** Remove the committed key from the working tree, strip card
storage, move ZegoCloud token minting server-side. *(Key rotation is yours — see security note.)*

**Stage 1 — Identity foundation.** The role/status model, Firestore schema and security rules,
reduced sign-up, email verification gate, server-side route guard replacing the five client
guards, `/onboarding/verification`. Everything else depends on this.

**Stage 2 — Partner onboarding.** Pre-approval Account and Financials/Invoice tabs, KYC adapter
+ Didit, certificate upload, Stripe Connect and Stripe Billing onboarding, status tracker and
the request-more-information resubmission loop.

**Stage 3 — Website Manager dashboard.** Approval queue, document repository and filters, audit
/ flag / revoke, sanctions, payouts, and the document template system — templates gate Stage 6.

**Stage 4 — Notary & COath operational dashboard.** Four tabs, Go Live toggle, realtime
jurisdiction queue, accept/decline, the composed session view (Zego + PDF + stamp), jurisdiction
lockout, earnings.

**Stage 5 — Attorney & Business dashboards.** Seven tabs, appointments, social links, file
manager.

**Stage 6 — Client document workflow.** The five-step sequence, T&Cs checkpoint, disclaimer,
PDF upload + stamping replacing the form-field model, template binding.

**Stage 7 — Revocation.** Paid revocation, multi-party KYC opt-in, authentication-code status.

**Stage 8 — Graphics.** Logo, images, routing — after live reproduction.

Stages 4 and 5 can run in parallel once 3 lands. 8 can be pulled forward at any point.

---

## Open risks

1. **Stripe availability in Guyana.** Stripe does not list Guyana as a supported country for
   payouts. If Guyanese notaries cannot be onboarded to Connect, revenue distribution — the
   core of the notary side — does not work, and WiPay becomes the only option. **This needs
   confirming before Stage 2 starts.** The platform-fee side (collecting from attorneys and
   businesses, many of them diaspora-facing) is less exposed.
2. **Didit contract terms** are not yet verified against the 3 Sept figures.
3. **The 25MB file cap** is stated as "e.g." in the brief. Firebase Storage has no equivalent cap. Confirm the number.
4. **Replacing the form-field model with PDF stamping discards `config/documentTypes.js`** —
   roughly 30KB of document definitions and every `DynamicFormRenderer` form. That content needs
   to reappear as uploaded PDF templates, which is a content-production task, not a code task,
   and it is not costed in the brief.
5. **Jurisdiction lockout vs. the legal position.** The 3 Sept brief records that Trinidad and
   Barbados have no provision equivalent to Guyana s.14(3) — they are e-signature markets only.
   The lockout rules must encode that, not just match jurisdiction strings, or the platform
   will route notarisation work into two jurisdictions where it has no legal effect.
