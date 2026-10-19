# Scheduled run brief — 25 October 2026

**You are a fresh session with no memory of the conversation that produced this
file.** Everything you need is here. Read it all before starting.

Repo: `wiscribbles/Wiscribbles-Phase-2`. Branch `main`. Head at time of writing:
`b69aa95`. Phase 2 is complete through Stage 8.

Thomas (the owner) is not necessarily watching. Where this brief says to stop
and ask, stop and write down what you would have done instead.

---

## Standing constraints — do not break these

These were decided deliberately. If you think one is wrong, say so in your
report; do not quietly reverse it.

1. **Never flip a jurisdiction flag on your own.** `notarizationEnabled`,
   `launchEnabled` and `REMOTE_WITNESSING_ENABLED` in `lib/jurisdictions.js`
   are legal decisions. Barbados attaches an **indictable offence** to
   unlicensed operation (s.18 as amended by Act 2014-8) and Trinidad has a
   comparable accreditation provision (Part V, s.33(1)). Research and
   recommend; never enable.

2. **An executed document is never deleted or purged.** Signed, notarised,
   revoked or awaiting-notarisation documents are evidence. `assertPurgeable`
   in `lib/retention.js` throws rather than skipping — leave it that way.

3. **PDF only.** No `.docx` upload path anywhere, ever. The PDF is what gets
   sealed, so a conversion between what the client approved and what the notary
   sealed is an unauditable gap.

4. **Notaries and Commissioners of Oaths are never charged.** See
   `assertNotCharged` in `lib/plans.js`. They are paid from the service fee.

5. **Payments stay switched off.** Stripe Checkout and WiPay are built; neither
   is live. The blocker is the money-transmission question on paying Caribbean
   professionals, which Thomas is handling separately. Do not switch collection
   on.

6. **Do not deploy to production.** See task 2.

7. **Keep the Phase 1 visual style.** `lib/theme.js` holds the existing
   palette, extracted from the Phase 1 codebase. Use it. Do not introduce a
   second design system.

---

## Task 1 — Remove the witness option until further notice

**Decision made 19 Oct: witnesses come out of the client-facing flow entirely.**

Why: no electronic transactions Act in any of the four jurisdictions converts
a witnessing *presence* requirement into a video call. The gate was already
shut (`REMOTE_WITNESSING_ENABLED` is false everywhere), but the flow still let
a client add a witness — and then parked the document at
`awaiting_in_person_witnessing` with **no route onward**. Nothing releases it,
nothing tells the creator what to do. A witness currently kills a document.

The cross-reference that settled it: of the eleven document categories Guyana
permits, only **sale of chattels** clearly attracts a witness (bills of sale
legislation historically requires attestation plus registration), and
**property management agreement** conditionally. Everything classically
witnessed — wills, powers of attorney, deeds of land, trusts, leases,
agreements of sale — is *already excluded* and already routed to Prepare &
Register. Trinidad permits eight categories and none clearly attracts one.

So the witness-requiring work is nearly all on the paper route already.

**What to do:**

- Remove the witness choice from the party list in
  `components/client/RequestWizard.jsx`. Every added party is a signatory.
- Where a client indicates they need a witness, route them to
  `/[locale]/prepare-register` with an explanation — the same honest offer that
  flow already makes: everything online except the bit the law reserves.
- Leave `lib/signing.js` witness machinery **in place and dormant**:
  `PARTY_ROLE.WITNESS`, `PARTY_STATUS.IN_PERSON_REQUIRED`, the `nextParty`
  skip, the `needsInPersonWitnessing` checks. It is correct, it is tested by
  nothing, and deleting it would mean rebuilding it if task 4 finds that
  witnessing is permitted somewhere. Add a comment at the top of the witness
  section saying it is deliberately unreachable from the UI as of 19 Oct and
  what would re-enable it.
- Make sure no document can newly reach `awaiting_in_person_witnessing`. Any
  existing document already in that status must still be readable and must
  still never be purged.
- Leave the zero-rated witness fee line in `lib/fees.js` alone — it is
  unreachable but harmless, and it documents the position.

---

## Task 2 — Full push to GitHub, prepare Netlify, STOP before deploying

**Thomas chose: prepare everything, stop short of the live deploy.** He wants
to trigger production himself.

- Commit and push everything to `main`.
- Confirm `npm run build` passes. Note: this container cannot reach
  `fonts.googleapis.com`, so `next/font` fails here. Verify by copying the repo
  to a scratch directory, rewriting `next/font/google` imports to a local stub,
  and building there — see the pattern used throughout this project's history.
  **Never commit the stub.** A build that stops at prerendering `/_not-found`
  for want of Firebase credentials is the expected, correct outcome.
- Write the Netlify configuration (`netlify.toml`) for a Next.js 14 App Router
  site. Document every environment variable that must be set in the Netlify
  dashboard — read `docs/CREDENTIALS_SETUP.md` for the full list. **Put no
  secret values in any committed file.**
- Write `docs/DEPLOY_CHECKLIST.md`: the ordered steps Thomas follows, what to
  verify after each, and the rollback. Include that
  `npm run deploy-rules` must have run against the target Firebase project
  (it has, as of 19 Oct, against `wiscribbles-ecdea` — 26 composite indexes).
- A Netlify MCP connector may be available. You may use it to **inspect** and to
  configure. **Do not publish to the production domain.** A branch or preview
  deploy is acceptable if it does not touch production; say clearly in your
  report which you did.

---

## Task 3 — Deep search for errors and mistakes, and fix them

There are **no tests in this repository. Not one.** That is the largest
outstanding risk and the single most valuable thing you could add. Prioritise
accordingly: a few tests over the places where a subtly wrong answer does real
damage are worth more than a hundred covering getters.

Highest-value targets, in order:

1. `checkJurisdictionLockout` in `lib/jurisdictions.js` — the refusal that
   stops an instrument being executed where it has no effect. Four call sites
   gate on it.
2. `claimEntry` / `declineEntry` in `lib/queue.js` — Firestore transactions
   stopping two notaries claiming one client.
3. `resolveTemplateAllowance` in `lib/plans.js` — three layers where `null`
   means unset, `0` means none and `-1` means unlimited. Test `null` against
   falsiness explicitly; that distinction is easy to break.
4. `quote` in `lib/fees.js` — the derived base (one signatory vs two or more)
   and the zero-rated witness line.
5. `nextParty` / `recordSignature` in `lib/signing.js` — order enforcement,
   spent tokens, expired tokens, out-of-turn refusal.
6. `verify` in `lib/authentication.js` — that a wrong reference and a wrong
   date return *identical* responses. If they ever diverge, the two-factor
   lookup collapses to one factor.
7. `assertPurgeable` in `lib/retention.js` — that it throws on every permanent
   status and on anything carrying a seal.

Also sweep for:

- Unused imports and dead code left by the Phase 2 rework.
- Phase 1 components still reachable that should not be. `videoCallPage.jsx`
  (~55k), `ESignDocument.jsx`, `InteractivePDFSigner.jsx`, the `form-step1`
  through `form-step5` routes and `dashboard/*` subroutes are mostly superseded
  by Stage 6. Identify what is dead; **report before deleting anything large.**
- `config/zegoConfig.js` now posts a session id, so Phase 1's `SafeVideoCall`
  and `ContainedVideoCall` call sites fail where their `meetingId` is not a
  real session. That is intentional and fails closed. Confirm nothing
  user-facing still depends on them.
- Any remaining mention of session recording in the codebase — it has been
  established that no Act requires it (see task 4) and the claim has been
  removed.
- `firestore.rules` and `storage.rules` against every collection the code now
  writes. New since the rules were last reviewed: `standardForms`,
  `revocationRequests`, `prepareRegisterRequests`, `authenticationAttempts`,
  `acceptances`.

**Unproven and must be flagged, not guessed at:** the ZEGOCLOUD `token04`
generator in `lib/video/zego.js` was transcribed from ZEGO's published spec and
has **never been run against a live project**. If you can test it, do. If a
call fails on a token error, swap in the official `zego-server-assistant`
package rather than debugging the implementation by hand — the file's surface
is deliberately small so the swap is contained.

---

## Task 4 — Official gazettes: verify and extend the legal basis

This is the most valuable task in the list. Use web search against official
sources — the gazettes, the Attorney General / Ministry of Legal Affairs sites,
the parliamentary sites. **Prefer primary sources. Say plainly when you could
only find a secondary one.**

### 4a. Verify what is already encoded

`lib/jurisdictions.js` holds the current position. Confirm or correct each:

**Guyana — Electronic Communications and Transactions Act No. 12 of 2023.**
- `s.14(3)` is the enabling provision: a requirement to notarise, acknowledge,
  verify or swear is satisfied by attaching the authorised person's electronic
  signature. **Confirm this section number and wording.**
- The exclusion schedule currently encoded: interests in immovable property,
  negotiable instruments, documents of title, wills, trusts, court documents,
  powers of attorney, agreements of sale, leases, promissory notes.
- **CRITICAL OPEN ITEM.** That schedule comes from the published *Bill* text,
  not the gazetted Act. The gazetted Act is in the project files
  (`23758-act_no._12_of_2023_pdf.pdf`, Official Gazette Legal Supplement A,
  16 August 2023) but **it is an image scan with no text layer** — only the
  running page headers extract. Nobody has compared the two. Try: a different
  OCR route, the DCRA, Guyana's parliament site, or a published consolidation.
  Until this is confirmed, every notarised instrument in Guyana rests on an
  unverified schedule.
- Also confirm whether any commencement order or regulations have been made,
  and whether a Certifying Authority has yet been designated — as of the last
  check the accreditation regime was **dormant**.
- **Suspicious asymmetry to resolve:** Guyana currently permits passport and
  immigration documents while Trinidad excludes them by name at s.6(d). That
  would be an odd policy difference. It may be a gap in the Bill-derived
  schedule.

**Trinidad & Tobago — Electronic Transactions Act, Chap. 22:05.**
- **s.18 "Electronic notarisation" EXISTS** and is word-for-word equivalent to
  Guyana s.14(3). The Sept 2026 launch brief is **wrong** where it says
  "Trinidad and Barbados have no such provision — they are e-signature markets
  only". Confirm s.18 is current.
- `s.6` exclusions encoded: wills, real **and personal** property transfers,
  indenture/trust/power of attorney, immigration/citizenship/passport matters,
  negotiable instruments. Note s.6(b) is **wider** than Guyana's.
- `notarizationEnabled` is deliberately **false** pending a Part V opinion:
  s.33(1) makes issuing "a qualified electronic authentication product to the
  public" without accreditation an offence. s.31 and s.32 suggest an
  unaccredited signature can still be reliable (s.32 only *deems* accredited
  products to satisfy s.31). **Research this and recommend. Do not enable.**
- The text read was the Ministry's consolidation marked UNOFFICIAL VERSION,
  updated to 31 Dec 2016. Find something current.

**Jamaica — Electronic Transactions Act.**
- `s.9` is the enabling provision and is **not identical** to Guyana's: it
  requires the encrypted signature **plus** a statement attesting to identity
  **plus** a statement certifying performance of all obligations imposed by
  other law. Those print on the certificate via `certificateStatements` on the
  registry entry. Confirm the wording.
- **The exclusion schedule is unmapped.** The Act is in the project files but
  badly OCR'd — section numbers come out corrupted. `launchEnabled` is false.
  Map the schedule from a clean source. An empty list reads as "nothing is
  excluded", which is exactly the bug that was found in Trinidad.

**Barbados — Electronic Transactions Act, Cap. 308B.**
- `s.3(1)` exclusions encoded: wills/testamentary instruments, conveyance of
  real property or transfer of any interest in it, indenture/declaration of
  trust/power of attorney — with the carve-out that **constructive and
  resulting trusts are NOT excluded**, only express ones.
- No provision equivalent to s.14(3) found. Confirm.
- **HARD GATE.** s.18 as amended by Act 2014-8: unlicensed operation as a
  certification service provider is an indictable offence, BBD 20,000 /
  12 months. `launchEnabled` is false and must stay false without a written
  opinion.

### 4b. Pull the legislation not yet examined

None of the four Acts above addresses witnessing, attestation or presence — the
witness question turns on **other** statutes that have not been read. Per
jurisdiction, find and summarise:

- **Deeds / conveyancing legislation** — when must a signature be witnessed?
  Individuals executing a deed generally need an attesting witness; confirm per
  jurisdiction and establish whether any permit remote attestation.
- **Bills of Sale legislation** — this is the live one. Sale of chattels is
  permitted in Guyana and is the strongest witness candidate in the permitted
  catalogue. Does it require attestation, and registration?
- **Wills legislation** — number of witnesses, presence requirements. (Wills
  are excluded from electronic execution everywhere, so this is for the
  Prepare & Register paper route.)
- **Oaths / statutory declarations legislation** — who may administer, and
  confirm the position already assumed: that the authorised officer *is* the
  formality and no lay witness is required. Most of the launch catalogue
  depends on this being right.
- **Powers of attorney legislation** — execution formalities.
- **Notaries Public / Commissioners of Oaths legislation** — who may be
  appointed, on what terms, whether there is any register, and critically
  **whether anything prohibits or conditions acting remotely**. This bears
  directly on whether the whole model is sound.
- Anything on **electronic/remote execution** made since the e-transactions
  Acts — regulations, practice directions, court rules.

### 4c. Advise

- Is the witness feature necessary? Where, for which documents, and on what
  authority? If any jurisdiction permits remote attestation, say so with the
  citation — Thomas will decide whether to re-enable.
- Correct `lib/jurisdictions.js` where the research contradicts it, **except
  the flags listed under standing constraints**.
- Update `docs/PHASE2_PLAN.md` and
  `claude/phase2-launch-readiness-2026-10.md` in the claude.ai project.

---

## Task 5 — Legal and regulatory steps before commencement

Per jurisdiction, list what must happen before WiScribbles may lawfully
operate. Be concrete: name the body, the instrument, and whether it is a
precondition or a parallel task. At minimum consider:

- Accreditation or licensing as a certification / electronic authentication
  service provider — **the Barbados offence and the Trinidad Part V question
  are the two sharpest items in this whole project.**
- Whether a Certifying Authority has been designated in Guyana and what
  follows if not.
- Company registration and any local presence requirement.
- Data protection registration, and whether a Data Protection Officer must be
  appointed and notified. The live privacy policy already names one.
- Money transmission / payment services authorisation — this is the open
  question blocking payouts. Say what each jurisdiction requires of a platform
  collecting from clients and paying professionals.
- Professional-conduct constraints on notaries and commissioners acting through
  a platform, and on a platform holding client documents.
- Consumer protection and electronic contracting disclosure requirements.
- Anti-money-laundering obligations, if any attach to this activity.

Flag which items need a local attorney in which jurisdiction, and which Thomas
can do himself.

---

## Task 6 — Recommend additional features

Ground every recommendation in something observed, not in a feature list.
`claude/phase2-launch-readiness-2026-10.md` in the claude.ai project already
holds a gap analysis against the live build at `notary.zaviatechnology.com` —
read it first and do not repeat it.

Known gaps, already identified, for context:

- Appointments do not create a queue entry at the appointed time.
- No email notifications beyond partner decisions and revocations.
- Paid certified-copy download (the live site's authenticate flow step 3).
- Verified signatory portal for business accounts.
- Multi-party KYC opt-in (a Stage 7 brief item, not built).
- Guides, tutorial video, contact details not wired in.

What is wanted is what is **missing that nobody has noticed**. Rank by what
blocks launch or creates legal exposure, not by what would be pleasant.

Also flag, from the live marketing site, anything still wrong — as of 19 Oct
the testimonials were lorem ipsum attributed to invented people, the FAQ was
placeholder text, "#1 Rated Online Notary Service" was unsubstantiated, "24/7
notaries" was unsupported by any rota, and Real Estate Agents was still
advertised despite the role being dropped.

---

## Reporting

Write your findings to the claude.ai project as
`claude/scheduled-run-2026-10-25.md` using the Projects tool, and give Thomas a
short summary in chat. Lead with anything that changes a decision or creates
exposure. Be explicit about what you could not verify and why — an unverified
item reported as unverified is useful; one reported as settled is a liability.

Commit messages: end with the attribution lines the session's own instructions
specify.
