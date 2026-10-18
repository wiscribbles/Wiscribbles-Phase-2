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
| Public endpoint collects name, email, password only | **Partial** | `SignUpForm2.jsx` collects ~15 fields incl. ID upload, certificate, card number, jurisdiction, DOB, phone. Strip to four. |
| Dashboard access only after email verification | **Absent** | No `emailVerified` check anywhere. Needs verification send, callback, and a server-side gate. |
| Admin panel controls correspond to role at sign-up | **Partial** | Role is stored; nothing downstream reads it for admin control. |

### 2. Administrative dashboards

| Requirement | State | Work |
|---|---|---|
| Notary pre-approval: restrict to Account + Financials | **Absent** | Build. |
| Redirect `pending_review` → `/onboarding/verification` | **Absent** | Route does not exist. Build + server guard. |
| Jurisdiction(s) of practice capture | **Partial** | Collected at sign-up as a single value; needs to move to Account tab and become multi-select. |
| KYC trigger from Account tab | **Absent** | Build on the new adapter. |
| Certificate upload, 25MB cap | **Partial** | Cloudinary upload exists in sign-up (unsigned preset, no size/type validation). Move, harden, cap. |
| Bank capture + tokenization (Financials) | **Absent** | Stripe Connect onboarding. |
| Status tracker + `admin_feedback` + resubmission | **Absent** | Build. |
| Notary post-approval: Account / Analytics / Support / Financials | **Absent** | Build all four. |
| Go Live / Offline toggle → realtime status | **Absent** | Supabase client is wired; `RealtimeSync.js` exists as a starting point. |
| Jurisdiction-based waiting queue, realtime | **Absent** | Build. |
| Accept Client / Decline Request | **Absent** | Build. |
| Session: Zego SDK + PDF viewer embedded | **Partial** | `SafeVideoCall.jsx`, `ContainedVideoCall.jsx`, `PDFViewer.jsx` exist separately; never composed into one session view. |
| **Jurisdiction lockout — session must not proceed on mismatch** | **Absent** | Build. Hard block, enforced server-side, not just UI. |
| Earnings / payouts view | **Absent** | Build. |
| Virtual stamp (e-seal) module | **Partial** | `api/notary-stamp-pdf`, `api/stamp-pdf` exist. No stamp creation, no seal asset, no authority binding. |
| COaths — identical to Notary | **Absent** | Role does not exist. |
| Attorney 7 tabs (Account, Appointment, Social Media, Analytics, Support, Invoice, File Manager) | **Absent** | Build all seven. |
| Attorney pre-approval: Account + Invoice only | **Absent** | Build. |
| Attorney subscription via card (Invoice tab) | **Absent** | Stripe Billing. |
| Appointment scheduling, max 24h window, e-sign vs notarise vs COath | **Partial** | `dashboard/calender`, `appointment/` are theme stubs. |
| Social media signing-link generation | **Absent** | Build. |
| File Manager repository | **Absent** | Build. |
| Business role — as Attorney, registration doc instead of law certificate, no jurisdiction limit | **Absent** | Build on Attorney shell. |
| Website Manager: accept / reject / request more info | **Partial** | `admin/commissioners`, `admin/users`, `AdminService.js` have the shape; the three-way action and feedback loop are not implemented. |
| Document repository with Jurisdiction / Partner Type / Account Name filters | **Absent** | Build. |
| Audit, flag suspicious, revoke signed documents | **Absent** | Build. |
| Sanction / suspend for a period / remove partners | **Absent** | Build. |
| Issue payments for partner balances | **Partial** | `admin/payments` is a stub. |

### 3. Graphics

| Requirement | State | Work |
|---|---|---|
| Logo visibility fix | **Needs live reproduction** | `Logo.jsx` injects a `<style>` element into `document.head` on every mount and removes it on unmount — with two logos mounted, the first unmount strips the shared styles. Likely cause; needs confirming against the live site. |
| Heading images rendering as square boxes | **Root cause found and fixed** | Not missing images — missing **icon webfonts**. The headings use `<i className="flaticon-*">` and FontAwesome glyphs; when the webfont fails to load the browser renders the tofu box. `public/assets/v1/fonts` and `v2/fonts` were each missing five FontAwesome files including `fa-solid-900.{eot,ttf,svg}`, and `_bootstrap-icons.scss` pointed `$bootstrap-icons-font-dir` at `"../../fonts"` while every sibling partial uses `"../fonts"`, resolving outside `public/assets` entirely. Both fixed. Verify against the live site. |
| "Notarize Now" button routes to wrong page | **Partial** | Label lives in `locales/en.json` (3 places); the `href` is hard-coded at each call site. Needs a single route constant. |

**`npm run build` was broken on `main` and had been since v1.0.** The missing
icon fonts above were hard webpack resolution errors, not warnings, so no
production build could complete. Fixed in the same change. The build now reaches
"Compiled successfully" and stops only at prerender for want of Firebase
credentials.

### 4. Plugin / workflow

| Requirement | State | Work |
|---|---|---|
| Platform fee collection (Stripe) | **Absent** | Stripe Billing subscriptions. |
| Revenue distribution (Stripe Connect) | **Absent** | Connect Express onboarding + transfers. |
| KYC replacement | **Absent** | Adapter + Didit. |
| PDF stamping, core PDF uneditable, upload must be PDF | **Partial** | Libraries present; stamping endpoints are stubs. Replaces the entire `form-step1..5` + `documentTypes.js` input model. |
| ZegoCloud video | **Partial** | Works; server secret must move server-side. |
| Workflow order: Personal Info → Doc Selection → Signature & Notarization → Payment → Download | **Partial** | Five steps exist in a different order and shape. |
| COaths as distinct role everywhere | **Absent** | Build. |
| T&Cs checkbox at Document Selection | **Absent** | Build. |
| Disclaimer pop-up before upload, jurisdiction-specific | **Absent** | Build. |
| Document-to-role and document-to-jurisdiction mapping via admin templates | **Absent** | Template system with role + jurisdiction tick boxes; every uploaded document must bind to a template. |
| Document revocation (paid), multi-party KYC opt-in, auth code returns "Revoked" | **Absent** | `authenticate/` verification flow exists to extend. |

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
3. **The 25MB file cap** is stated as "e.g." in the brief. Cloudinary's free tier caps raw
   uploads at 10MB; Firebase Storage does not. Confirm the number and the destination.
4. **Replacing the form-field model with PDF stamping discards `config/documentTypes.js`** —
   roughly 30KB of document definitions and every `DynamicFormRenderer` form. That content needs
   to reappear as uploaded PDF templates, which is a content-production task, not a code task,
   and it is not costed in the brief.
5. **Jurisdiction lockout vs. the legal position.** The 3 Sept brief records that Trinidad and
   Barbados have no provision equivalent to Guyana s.14(3) — they are e-signature markets only.
   The lockout rules must encode that, not just match jurisdiction strings, or the platform
   will route notarisation work into two jurisdictions where it has no legal effect.
