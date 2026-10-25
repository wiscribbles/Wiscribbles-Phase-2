/**
 * Jurisdiction rules.
 *
 * This file is a legal safety rail, not a lookup table. The jurisdiction
 * lockout required by the brief ("the session MUST NOT PROCEED") is enforced
 * against `notarizationEnabled` here — NOT against a bare string comparison of
 * the client's jurisdiction and the professional's.
 *
 * Why that matters: matching strings would happily route a notarisation to a
 * Trinidadian notary for a Trinidadian client, and the resulting instrument
 * would have no statutory effect, because Trinidad has no provision equivalent
 * to Guyana's s.14(3). A string match is not a legality check.
 *
 * SOURCE OF THESE FLAGS: the WiScribbles launch brief of 3 Sept 2026 and the
 * project's regulatory-compliance record. Several entries carry open counsel
 * questions — see `legalReview` on each. Do not flip a flag to true without a
 * written opinion; `legalReview` is the record of what is still outstanding.
 */

export const JURISDICTIONS = Object.freeze({
  GY: 'GY',
  JM: 'JM',
  TT: 'TT',
  BB: 'BB',
});

const REGISTRY = Object.freeze({
  [JURISDICTIONS.GY]: {
    code: JURISDICTIONS.GY,
    name: 'Guyana',
    statute: 'Electronic Communications and Transactions Act No. 12 of 2023',
    /**
     * The enabling provision: a requirement to notarise, acknowledge, verify or
     * swear is satisfied by attaching the authorised person's electronic
     * signature, together with all other information required by other
     * applicable law.
     *
     * ⚠ THE SECTION NUMBER IS PROBABLY WRONG AND IS NOW LABELLED AS SUCH.
     *
     * 25 Oct 2026: `s.14(3)` was verified to be the section number in the
     * Electronic Communications and Transactions BILL 2019, whose text was
     * found and read in full. It is very likely NOT the section number in the
     * gazetted Act No. 12 of 2023. A section-by-section commentary on the Act
     * places electronic notarisation at s.15(2) and electronic
     * payments/receipts at s.14(1) — i.e. a payments section was inserted at 14
     * and displaced notarisation to 15. The same series cites the Act's
     * ss.5(1)(a), 6, 7, 8(1)(a), 35, 36, 38, 39, 40 and 49-52, while the 2019
     * Bill ended at s.50: the Act is materially renumbered and expanded.
     *
     * That evidence is SECONDARY (a newspaper law column). It is enough to stop
     * printing "s.14(3)" on a certificate as though it were verified, and not
     * enough to print "s.15(2)" instead. So the basis string now says what is
     * actually known. Resolve from the gazetted text, then set it once.
     */
    notarizationEnabled: true,
    notarizationStatutoryBasis:
      's.14(3) of the 2019 Bill — section number in the gazetted Act UNVERIFIED, ' +
      'probably s.15(2)',
    eSignatureEnabled: true,
    /** Launch market. */
    launchEnabled: true,
    /**
     * s.4 and the Schedule. Documents in these categories cannot be executed
     * electronically at all and must be routed to the wet-ink
     * "Prepare & Register" product rather than to a notary.
     */
    excludedDocumentCategories: [
      'power_of_attorney',
      'last_will_and_testament',
      'trust_instrument',
      'agreement_of_sale',
      'lease_agreement',
      'promissory_note',
      'negotiable_instrument',
      'document_of_title',
      'interest_in_immovable_property',
      'court_document',
      /*
       * ADDED 25 OCT 2026 — and this one costs real revenue, so here is the
       * whole reason.
       *
       * Sale of chattels was the strongest remaining commercial item in the
       * Guyana launch catalogue. It is excluded now on a PRIMARY-source ground
       * that has nothing to do with the e-transactions Act, and on a second,
       * independent ground that is still open.
       *
       * GROUND 1, PRIMARY AND DECISIVE — the Bills of Sale Act, Cap. 90:12
       * (Act 22 of 1916, am. Act 4 of 1972, L.R.O. 1/2012), read in full:
       *   s.8(1)(a)  "the execution of every bill of sale shall be attested by
       *              two credible witnesses" who are "not parties thereto";
       *   s.8(1)(b)  filing with the Registrar of Deeds "within seven clear
       *              days after the making or giving of the bill";
       *   s.9(1)     registration "must be renewed annually" or becomes void;
       *   s.20       a schedule/inventory of the chattels must be annexed;
       *   s.25       a security bill "shall be void unless made in accordance
       *              with Form 3 in the Schedule";
       *   s.24       a Part II bill must be "duly attested as provided in
       *              section 8", registered and advertised within seven clear
       *              days, and must "truly set forth the consideration ...
       *              otherwise the bill of sale shall be void".
       * So a bill of sale needs TWO non-party attesting witnesses. As of
       * 19 Oct 2026 the platform refuses witness parties outright (see
       * `lib/signing.js`), because remote attestation is not established in any
       * of these jurisdictions. A document that requires two witnesses the
       * platform will not accept cannot be executed here at all — so offering
       * it was offering something undeliverable, and the honest place for it is
       * Prepare & Register, which handles exactly this shape of problem.
       *
       * GROUND 2, STILL OPEN AND POTENTIALLY WIDER — the gazetted Act may
       * exclude movable property outright. The 2019 Bill's Schedule item 1 read
       * "Creation or transfer of interest in real or immovable property". TWO
       * independent secondary sources describing the GAZETTED ACT render it
       * "movable or immovable" — a Georgetown law firm's summary of the Act,
       * and press reporting of the responsible Minister's second-reading
       * remarks. If the Act does say "movable", then every transfer of an
       * interest in movable property is outside the Act and this exclusion is
       * required rather than merely prudent. One word, and nobody can read it
       * because the gazette scan has no text layer.
       *
       * Ground 1 alone justifies the exclusion, which is why it is encoded now
       * rather than left pending ground 2.
       */
      'chattel_sale',
    ],
    legalReview: {
      outstanding: true,
      /*
       * 25 Oct 2026 — A SECOND RUN FAILED TO CLOSE THIS, AND THE REASON IS
       * WORTH RECORDING SO A THIRD DOES NOT REPEAT IT.
       *
       * The gazette scan cannot be OCR'd from the build environment, for two
       * compounding reasons: the project's copy is served to tooling as
       * already-extracted text (headers only — the image layer never reaches a
       * local file, so there is nothing for tesseract to read), and every
       * Guyanese government host — officialgazette.gov.gy, parliament.gov.gy —
       * is refused at the egress proxy with a 403 on CONNECT, so the PDF cannot
       * be re-downloaded. This is not a tooling gap to work around. It needs a
       * person with the PDF open, or a copy obtained outside this environment.
       *
       * WHAT THE 25 OCT RESEARCH DID ESTABLISH, all SECONDARY:
       *   - Notarisation is probably s.15(2), not s.14(3) — see above.
       *   - The Act's exclusion list probably reads "movable or immovable"
       *     property, not "real or immovable". If so, chattel sales are outside
       *     the Act entirely. See the note on `chattel_sale` above.
       *   - The encoded list OVER-excludes two types the Bill Schedule did not
       *     name: `agreement_of_sale` and `lease_agreement`. Those are lost
       *     business rather than legal risk, and they stay excluded until the
       *     gazette is read, because the conservative direction is the right one
       *     while the schedule is unverified.
       *   - Immigration, citizenship and passport documents appear in NO source
       *     — not the Bill Schedule, not the firm's summary of the Act, not the
       *     Minister's remarks. So the Guyana/Trinidad asymmetry looks real
       *     rather than a gap. It is also less dangerous than it looks: the
       *     Act's s.5(1)(a) provides that nobody is required to ACCEPT
       *     electronic communications, so an immigration authority may refuse
       *     an electronically executed document whatever the schedule says. A
       *     user-facing warning is the proportionate response, not a hard block.
       *   - No commencement order was found. The Interpretation and General
       *     Clauses Act, Cap. 2:01 s.15 (PRIMARY) provides that an Act "shall
       *     come into operation on the date of publication" unless it says
       *     otherwise, which would put this Act in force on 16 Aug 2023 — but
       *     that is an INFERENCE, and a risky one: the Data Protection Act
       *     (No. 18 of 2023) and the Digital Identity Card Act (No. 19 of 2023),
       *     assented the same day, both DO require a commencement order and
       *     both were still awaiting one into 2026.
       *   - No regulations have been made under the Act.
       *   - THE CERTIFYING AUTHORITY HAS NOT BEEN SET UP. s.35 requires the
       *     Minister to establish or designate it; s.36 gives it the function of
       *     regulating, registering and accrediting Electronic Security
       *     Procedure Providers; s.38 provides that a provider "cannot purport
       *     to provide electronic security procedures unless they are
       *     registered". Nobody can register, because there is nobody to
       *     register with. Whether that makes operation unlawful or merely
       *     unaccredited turns on the exact wording of s.38 and on whether any
       *     offence attaches — NOT FOUND, and the one commentary article that
       *     would answer it was unreachable on both attempts.
       *     Mitigation to consider deliberately: the question disappears if the
       *     platform does not hold itself out as a provider of "electronic
       *     security procedures" — i.e. uses a third-party certificate provider
       *     rather than issuing certificates itself.
       *   - ss.50-52 impose duties on accredited providers that are worth
       *     building to NOW regardless of accreditation, because s.51 is the
       *     cheapest compliance win available: written PRE-CONTRACT disclosure
       *     of the terms, conditions and limitations of the electronic security
       *     procedure, INCLUDING whether the provider is accredited.
       */
      notes:
        'STILL OUTSTANDING, and here is exactly why. The gazetted Act (Official ' +
        'Gazette, Legal Supplement A, 16 August 2023) IS now in hand — but that ' +
        'PDF is an image scan with no text layer, so its body cannot be read ' +
        'mechanically; only the running page headers extract. The exclusion ' +
        'schedule below therefore still derives from the published BILL text via ' +
        'the Sept 2026 launch brief, NOT from the gazetted Act, and the two have ' +
        'not been compared. Someone has to read the scan with their eyes and ' +
        'confirm (a) the exclusion schedule is unchanged, (b) s.14(3) is ' +
        'unchanged, (c) no commencement order or regulations have since altered ' +
        'them. Until then every notarised instrument in Guyana rests on an ' +
        'unverified schedule. Separately, the accreditation regime is dormant — ' +
        'no Certifying Authority has been designated.',
    },
  },

  [JURISDICTIONS.JM]: {
    code: JURISDICTIONS.JM,
    name: 'Jamaica',
    statute: 'Electronic Transactions Act',
    /**
     * s.9 carries the enabling provision — but Jamaica's is NOT identical to
     * Guyana's, and the difference is operational. Guyana s.14(3) and Trinidad
     * s.18 are satisfied by the authorised person's signature plus "all other
     * information required by other applicable law". Jamaica s.9 spells out
     * THREE things that must be attached or logically associated:
     *
     *   (a) the encrypted signature of that person;
     *   (b) in the case of a signature or a document requiring a signature, a
     *       statement by that person attesting to his identity;
     *   (c) a statement by that person certifying the performance of all
     *       obligations imposed by any other law governing the legal validity
     *       of the document.
     *
     * So a Jamaican notarial certificate needs those two statements written
     * onto it in terms, not merely implied by the act of sealing. See
     * `certificateStatements` below, which lib/stamp.js reads.
     */
    notarizationEnabled: true,
    notarizationStatutoryBasis: 's.9 (Electronic Transactions Act, Act 15 of 2006)',
    /*
     * ⚠ CORRECTED 25 OCT 2026 — s.9 HAS FOUR LIMBS, NOT THREE.
     *
     * The Act was read (2010 revised edition, pages authorised by L.N.
     * 11/2010). s.9 is headed "Requirements for attestation, etc., of
     * documents" and applies where a law requires a document or signature to
     * be "made, attested, acknowledged, authenticated, notarized, or verified,
     * or to be made under oath". The requirement is met if the following are
     * attached to or logically associated with the document:
     *
     *   (a) the encrypted signature of that person;
     *   (b) in the case of a signature or a document requiring a signature, a
     *       statement by that person, attesting to his identity;
     *   (c) a statement by that person certifying the performance of all
     *       obligations imposed by any other law governing the legal validity
     *       of the document; AND
     *   (d) all other information required to be included under any other law.
     *
     * Limb (d) was missing from this file. It is the catch-all that the Guyana
     * and Trinidad provisions carry in their own closing words, and omitting it
     * meant a Jamaican certificate could have been issued asserting compliance
     * with (a)-(c) while silently dropping whatever (d) picks up from the
     * instrument's own governing statute. Added to `certificateStatements`
     * below as an express undertaking rather than left implied.
     *
     * Also confirmed, because it looked like an OCR artefact and is not:
     * "ENCRYPTED signature" is genuinely the statutory term in (a), not
     * "electronic signature". That is an unusually strong requirement and it
     * is a real design constraint — a click-to-sign mark with an audit trail
     * is not obviously an "encrypted signature". PUT THIS TO JAMAICAN COUNSEL
     * BEFORE ENABLING JAMAICA; it may require a cryptographic signature where
     * the other three jurisdictions do not.
     */
    certificateStatements: [
      'I attest to my identity as the authorised person executing this ' +
        'certificate.',
      'I certify the performance of all obligations imposed by any other law ' +
        'governing the legal validity of this document.',
      'All other information required to be included under any other law ' +
        'governing this document is attached to or logically associated with ' +
        'it.',
    ],
    eSignatureEnabled: true,
    /**
     * Still false, but for a DIFFERENT and much narrower reason than before —
     * see `legalReview` below. The schedule is no longer the blocker.
     */
    launchEnabled: false,
    /**
     * ⚠ NO LONGER EMPTY. MAPPED 25 OCT 2026 FROM A CLEAN SOURCE.
     *
     * s.4: "The provisions of this Act shall not apply to the transactions set
     * out in the First Schedule" to the extent specified there. The First
     * Schedule has exactly FOUR items, each marked "Whole Act":
     *
     *   1. The making, execution, alteration or revocation of a WILL or other
     *      testamentary instrument.
     *   2. The CONVEYANCE OR TRANSFER OF REAL PROPERTY or any interest in real
     *      property.
     *   3. The creation, variation, performance or enforcement of any
     *      (a) TRUST; or (b) POWER OF ATTORNEY.
     *   4. Any procedure governed by the CIVIL PROCEDURE RULES, 2002, or by
     *      rules of court made pursuant to any law.
     *
     * Corroborated item-for-item by a Jamaican firm's published summary.
     *
     * JAMAICA'S LIST IS MUCH SHORTER THAN TRINIDAD'S, AND THE DIFFERENCES ARE
     * COMMERCIALLY SIGNIFICANT — do NOT port Trinidad's list here, which is the
     * obvious mistake waiting to be made. NOT excluded in Jamaica:
     *   - personal property and chattels (Trinidad s.6(b) catches these;
     *     Jamaica item 2 is real property only)
     *   - INDENTURES (named in both Guyana and Barbados; absent here)
     *   - negotiable instruments and promissory notes
     *   - documents of title
     *   - immigration, citizenship and passport documents
     *   - agreements of sale
     *
     * LEASES ARE DELIBERATELY EXCLUDED HERE ON AN INFERENCE, AND IT IS LABELLED
     * AS ONE. "Lease agreement" is not named in the First Schedule. The grant
     * or assignment of a lease is arguably the transfer of "any interest in
     * real property" under item 2, but that is a reading and not a citation.
     * Excluded pending Jamaican advice, because the conservative direction is
     * correct when the alternative is executing a land interest electronically
     * in a jurisdiction that excludes land interests.
     */
    excludedDocumentCategories: [
      // First Schedule item 1
      'last_will_and_testament',
      // First Schedule item 2
      'interest_in_immovable_property',
      // First Schedule item 2, by inference — see the note above
      'lease_agreement',
      // First Schedule item 3(a) and 3(b)
      'trust_instrument',
      'power_of_attorney',
      // First Schedule item 4
      'court_document',
    ],
    legalReview: {
      outstanding: true,
      notes:
        'SUBSTANTIALLY ADVANCED 25 Oct 2026. The exclusion schedule is MAPPED ' +
        '(s.4 + First Schedule, four items, from the 2010 revised edition) and ' +
        's.9 is confirmed and CORRECTED to four limbs. Three things still hold ' +
        'launchEnabled false, and the first is the real one. ' +
        '(1) THE ACT WAS AMENDED IN 2023 AND THE AMENDMENT TOUCHES THE FIRST ' +
        'SCHEDULE. Electronic Transactions (Amendment) Act 2023, No. 6 — its ' +
        'existence is confirmed in Parliament\u2019s own 2023 Acts index, but ' +
        'its TEXT could not be retrieved (the parliamentary PDF and the CommonLII ' +
        'mirror both failed). Official government reporting says clause 3 amends ' +
        'the First Schedule to add circumstances in which the Act COULD apply to ' +
        'court proceedings, which would NARROW item 4 rather than add exclusions ' +
        '\u2014 but that is a press description, not the operative words. Note ' +
        'also that the Ministry of Justice library page still reads "Last ' +
        'Amendment January 1, 2014" and is therefore out of date, so a reader ' +
        'checking currency there will be misled. DO NOT SHIP THE JAMAICA ' +
        'SCHEDULE UNTIL THOSE WORDS ARE READ. ' +
        '(2) "ENCRYPTED SIGNATURE" in s.9(a) may require a cryptographic ' +
        'signature rather than the signature model used elsewhere on the ' +
        'platform. Separately, the Act\u2019s e-signature definition reportedly ' +
        'EXCLUDES a signature produced by a fax machine or electronic scanning ' +
        'device, which would rule out image-based signatures \u2014 verify ' +
        'against s.2. ' +
        '(3) Registration as a data controller with the Office of the ' +
        'Information Commissioner is a PRECONDITION, not a parallel task: Data ' +
        'Protection Act 2020 s.15(1) prohibits processing without registration ' +
        'and s.18 makes it an offence (up to J$2,000,000 or 6 months). A ' +
        'non-resident controller must also appoint a representative established ' +
        'in Jamaica (s.3(2)). ' +
        'GOOD NEWS, AND IT IS A REAL DIFFERENCE FROM BARBADOS AND TRINIDAD: ' +
        'there is NO offence of unlicensed operation as a certification service ' +
        'provider. s.23 imposes duties only; there is no licence requirement and ' +
        'no express prohibition on operating unauthorised. The Certifying ' +
        'Authority under s.33(2) is the Trade Board, or another body designated ' +
        'by Gazette notice, and the regime appears entirely dormant \u2014 no ' +
        'designation, no application process, no register, no accredited ' +
        'provider found. Only the general contravention offence at s.34 applies. ' +
        'Jamaica is therefore the EASIEST of the four on licensing and the ' +
        'hardest on signature technology.',
    },
  },

  [JURISDICTIONS.TT]: {
    code: JURISDICTIONS.TT,
    name: 'Trinidad & Tobago',
    statute: 'Electronic Transactions Act, Chap. 22:05',
    /**
     * CORRECTION — AND IT IS A SIGNIFICANT ONE.
     *
     * This used to read "No provision equivalent to Guyana s.14(3). Electronic
     * notarisation has no statutory effect here." That is wrong, and it came
     * from the Sept launch brief, which states "Trinidad and Barbados have no
     * such provision — they are e-signature markets only."
     *
     * Trinidad HAS the provision. Chap. 22:05 s.18, headed "Electronic
     * notarisation", is word-for-word equivalent to Guyana s.14(3):
     *
     *   "Where information or a signature, document or record is required by a
     *    statutory provision or rule of law, or by contract or deed to be
     *    notarised, acknowledged or verified, the requirement shall be
     *    satisfied if ... the electronic signature of the person authorised to
     *    perform those acts, together with all other information required to
     *    be included by other applicable law, is attached to or logically
     *    associated with the electronic ... record to be notarized,
     *    acknowledged or verified."
     *
     * So notarisation is statutorily possible in Trinidad for any document NOT
     * caught by the s.6 exclusions. That is a materially larger market than
     * "e-signature only".
     *
     * IT IS STILL GATED OFF, and deliberately so. Flipping this flag is a
     * legal decision, not an engineering one, and two things have to happen
     * first:
     *
     *   1. Part V. s.33(1): "No person shall issue a qualified electronic
     *      authentication product to the public unless he is registered as an
     *      accredited Electronic Authentication Service Provider." This is the
     *      Trinidad analogue of the Barbados s.18 offence. s.31 and s.32
     *      suggest an UNaccredited signature can still be reliable — s.32 only
     *      *deems* accredited products to satisfy s.31 — so WiScribbles may
     *      well sit outside the accreditation requirement. "May well" is not
     *      good enough when the neighbouring jurisdiction attaches an
     *      indictable offence to getting it wrong.
     *   2. The text read is the Ministry of the Attorney General's
     *      consolidation, marked UNOFFICIAL VERSION, updated to 31 Dec 2016.
     *      Someone must confirm s.18 and s.6 are current.
     *
     * Set `notarizationEnabled: true` only on a written opinion covering both.
     */
    notarizationEnabled: false,
    notarizationStatutoryBasis: 's.18 (Electronic notarisation)',
    notarizationGatedPending:
      'Updated 25 Oct 2026. The provision (s.18) exists and is in force. The ' +
      'licensing question turned out to be the WEAKER of the two blockers: ' +
      'Part V was never proclaimed, so the s.33(1) accreditation offence is not ' +
      'yet law and accreditation is impossible in any event. The live question ' +
      'is s.31(3) and the Schedule, whose only entry is "Electronic ' +
      'certificates" — on a restrictive reading only a certificate-based ' +
      'signature can validate under s.31(1). Opinion needed on that, and on ' +
      'whether the platform "issues a qualified electronic authentication ' +
      'product to the public" once Part V is proclaimed.',
    eSignatureEnabled: true,
    launchEnabled: true,
    /**
     * s.6 — "Inapplicability of Act". Verified 25 Oct 2026 against the
     * as-enacted text of Act No. 6 of 2011. Lettering (a)-(e) confirmed.
     *
     * FOUR WORDING CORRECTIONS from the 25 Oct verification, none of which
     * changes which categories are excluded, but all of which change what the
     * exclusion MEANS — and the first is arguable in the platform's favour:
     *
     *   1. s.6 does NOT disapply the whole Act. The opening words are "Parts
     *      II, III and IV of this Act shall not apply to any written law
     *      requiring writing, signatures or original documents for—". So Parts
     *      I and VII still apply to an excluded document, and the disapplication
     *      is tied to a written-law requirement for writing/signature/original
     *      rather than being a flat carve-out of the subject matter.
     *   2. (c) is the "creation, performance or enforcement" of an indenture,
     *      declaration of trust or power of attorney — three verbs, previously
     *      omitted here.
     *   3. (d) is the "production" of documents relating to immigration,
     *      citizenship or passport matters.
     *   4. (e) is confirmed as encoded.
     *
     * NOTE THE INTERACTION WITH s.18, which is easy to miss and is the reason
     * Trinidad is not simply "a notarisation market now": s.18 sits in PART II,
     * and s.6 switches Part II off for these categories. So s.18 cannot be used
     * to notarise a will, a conveyance of real OR PERSONAL property, an
     * indenture/trust/power of attorney, an immigration or passport document,
     * or a negotiable instrument. s.18 is real, in force, and narrower than it
     * looks.
     *
     * THIS LIST WAS EMPTY AND THAT WAS A BUG. Trinidad is a LAUNCH market, so
     * an empty exclusion schedule meant the platform would have e-signed a will
     * or a promissory note there — documents the Act expressly does not apply
     * to. "E-signature only" describes the absence of a notarisation provision;
     * it says nothing about which documents may be signed electronically at
     * all, and conflating the two left the wider hole.
     *
     * Note that s.6(b) is wider than Guyana's: it covers real OR PERSONAL
     * property, so a sale of chattels is excluded in Trinidad while it is
     * permitted in Guyana. The same template is therefore lawful in one launch
     * market and not the other, which is exactly why this is per-jurisdiction
     * data and not a global list.
     */
    excludedDocumentCategories: [
      // s.6(a) making, execution or revocation of a will or testamentary instrument
      'last_will_and_testament',
      // s.6(b) conveyance of real OR PERSONAL property, or transfer of any interest
      'interest_in_immovable_property',
      'agreement_of_sale',
      'lease_agreement',
      'chattel_sale',
      // s.6(c) indenture, declaration of trust or power of attorney
      'power_of_attorney',
      'trust_instrument',
      // s.6(d) documents relating to immigration, citizenship or passport matters
      'passport_application',
      'immigration_document',
      // s.6(e) recognition or endorsement of negotiable instruments
      'promissory_note',
      'negotiable_instrument',
    ],
    legalReview: {
      /*
       * WAS `outstanding: false` WITH A NOTE SAYING "E-signature only — there
       * is no provision equivalent to Guyana s.14(3)". Both halves were wrong,
       * and the note flatly contradicted the long correction written directly
       * above it in this same file. s.18 exists. Fixed 25 Oct 2026.
       */
      outstanding: true,
      notes:
        'VERIFIED 25 Oct 2026 against the as-enacted text of Act No. 6 of 2011 ' +
        '(Government of T&T host) and the Joint Select Committee on Finance and ' +
        'Legal Affairs 8th Report of 21 May 2024. Four findings. ' +
        '(1) s.18 "Electronic Notarization" EXISTS, is in Part II, and Part II ' +
        'WAS proclaimed on 6 Jan 2012 — so electronic notarisation has statutory ' +
        'effect here for any document not caught by s.6. s.18 makes no reference ' +
        'to Part V or to accreditation; its only condition is that the signer be ' +
        '"the person authorized to perform those acts", and that authorisation ' +
        'comes from the notarial and oaths statutes, not from this Act. ' +
        '(2) PART V WAS NEVER PROCLAIMED. The s.33(1) accreditation offence is ' +
        'therefore NOT YET LAW, no designated authority has ever been appointed, ' +
        'no regulations have been made, and the s.38 public registry does not ' +
        'exist — so accreditation is presently impossible rather than merely ' +
        'un-obtained. The penalty for s.33(1) is not in s.33 at all but in the ' +
        'general penalty at s.63, which sits in Part IX and also appears ' +
        'unproclaimed. On the current text the enforcement exposure for ' +
        'operating unaccredited appears to be NIL. Treat that as a timing ' +
        'advantage with a shelf life, not a safe harbour: the 2024 JSC report ' +
        'recommends proclaiming the outstanding Parts. ' +
        '(3) s.32 DEFINES "qualified electronic authentication product" in a ' +
        'parenthetical, not in s.2, and it only DEEMS an accredited product to ' +
        'satisfy s.31. s.31(1) is an open test ("criteria ... include whether"), ' +
        'so an unaccredited signature that in fact meets s.31(1)(a)-(d) is ' +
        'reliable. Accreditation is a safe harbour, not a gate. ' +
        '(4) THE REAL TECHNICAL CONSTRAINT IS s.31(3) AND THE SCHEDULE, not ' +
        's.33. The Schedule is headed "Electronic authentication products used ' +
        'to validate electronic signatures" and its ONLY entry is "Electronic ' +
        'certificates"; s.31(3) says those Schedule products "are the products ' +
        'which can be used to validate an electronic signature under subsection ' +
        '(1)". On a restrictive reading only a certificate-based signature can ' +
        'validate under s.31(1), which cuts against a pure click-to-sign plus ' +
        'audit-trail model. The Minister may amend the Schedule by order ' +
        '(s.31(4)); no such order was found. THIS IS THE ITEM TO PUT TO COUNSEL. ' +
        'CAVEAT ON SOURCES: the authorised Laws of T&T consolidation at ' +
        'rgd.legalaffairs.gov.tt is unreachable from the build environment, so ' +
        'currency rests on the as-enacted text plus a negative search for any ' +
        'amending Act — consistent with "never amended", not proof of it. ' +
        'NOTARIZATION STAYS DISABLED pending a written opinion on s.31(3) and ' +
        'on whether the platform issues "authentication products to the public".',
    },
  },

  [JURISDICTIONS.BB]: {
    code: JURISDICTIONS.BB,
    name: 'Barbados',
    statute: 'Electronic Transactions Act, Cap. 308B',
    notarizationEnabled: false,
    eSignatureEnabled: true,
    /**
     * HARD GATE — AND AS OF 25 OCT 2026 THERE ARE TWO GATES, NOT ONE. THE
     * SECOND ONE IS NEW AND IT IS THE DECISIVE ONE.
     *
     * GATE 1 — s.18 as amended by Act 2014-8 (assent 19 June 2014, commenced
     * 26 June 2014). CONFIRMED verbatim, and it has only two subsections:
     *   18(1) "A person who seeks to operate as a certification service
     *         provider shall apply to the Minister for a licence for the
     *         purpose in the prescribed manner."
     *   18(2) "A person who operates as a certification service provider
     *         without a licence to do so, is guilty of an offence and is liable
     *         on indictment to a fine of $20 000 or to a term of imprisonment
     *         of 12 months or to both."
     * INDICTABLE ONLY — there is no summary alternative, and the contrast with
     * s.22(5) (which expressly provides both) looks like deliberate drafting.
     * Add to the risk model s.25, unamended: where a corporation commits an
     * offence under the Act, every director or officer at the time is "guilty
     * of the like offence" unless HE proves the contravention took place
     * without his consent or that he exercised all due diligence. Reverse-onus
     * PERSONAL liability on directors for an indictable offence.
     *
     * Two corrections to what this file previously assumed about gate 1:
     *
     *   (a) THE REGIME IS NOT DORMANT. Electronic Transactions Regulations 2014
     *       (S.I. 2014 No. 41) exist and are a working scheme: application form
     *       in the First Schedule; reg.3(2) requires proof of Companies Act
     *       registration, liability insurance of not less than $500,000 and a
     *       performance bond or banker's guarantee of not less than $500,000;
     *       reg.3(3) the licence runs 12 months; reg.5(1) refusal grounds;
     *       reg.6 revocation with a hearing; regs.5(2)/6(3) appeal to a Judge
     *       in Chambers; Second Schedule fees $2,500 application / $500
     *       renewal. So compliance is possible and priced. What is missing is
     *       any evidence the regime has ever been USED — no Gazette notice
     *       licensing anyone, no notice appointing the Supervisor of
     *       Certification Authorities required by s.18A(1), and no sign of the
     *       publicly accessible disclosure database s.18A(2) mandates. The trap
     *       is not "compliance is impossible"; it is "fully drafted, priced and
     *       never visibly exercised, with an indictable offence attached and no
     *       public register against which to check your own status".
     *
     *   (b) THE PLATFORM MAY WELL FALL OUTSIDE THE DEFINITION. Act 2014-8 s.2
     *       redefines "certification service provider" as a person who
     *         (a) issues identity certificates for the purposes of electronic
     *             signatures or provides other services to the public related
     *             to electronic signatures AND ASSOCIATES A SIGNATURE
     *             VERIFICATION DEVICE TO A PERSON; and
     *         (b) is licensed in accordance with section 18 to provide
     *             accredited certificates.
     *       Limb (a) is conjunctive and the second conjunct is the
     *       discriminator: the platform plainly "provides other services to the
     *       public related to electronic signatures", so the only thing keeping
     *       it outside is that it does not associate a signature verification
     *       device (a public key or uniquely configured device) to a person.
     *       ANY PKI FEATURE FLIPS THAT — embedding a certificate that binds a
     *       public key to a signer's identity, even a platform-held one, or
     *       provisioning signing credentials, arguably brings the platform
     *       INSIDE. Whoever next touches the signature implementation needs to
     *       know this. Limb (b) is also circular — it makes being licensed an
     *       element of the defined term, so on the literal text an unlicensed
     *       person is not a certification service provider and cannot commit
     *       the s.18(2) offence. That is a genuine defence argument on a penal
     *       provision construed strictly, NOT a reason to proceed.
     *       And note what the 2014 amendment actually did: the DELETED s.18(1)
     *       read "The provision of certification services for electronic
     *       signatures is NOT SUBJECT TO PRIOR AUTHORIZATION by the Minister".
     *       That express safe harbour was removed and criminal exposure put in
     *       its place. The deletion is the substance of the risk.
     *       Confidence in the "outside" reading: MODERATE. Not high. The
     *       asymmetry — unlimited criminal downside and personal director
     *       liability against a BBD 2,500 licence fee — argues for licensing or
     *       local counsel, not for relying on the reading.
     *
     * GATE 2 — THE NOTARIES PUBLIC ACT 2024, s.9(2). THIS IS THE ONE THAT
     * ACTUALLY STOPS THE NOTARISATION PRODUCT, AND IT IS INDEPENDENT OF s.18.
     *
     * The Notaries Public Act 2024 (passed by the House 28 Mar 2024 and the
     * Senate 17 Jul 2024, reported as in operation 1 Sept 2024, repealing the
     * 2017 Act) provides at s.9(2):
     *
     *   "Notwithstanding the requirement in law to exercise the powers of a
     *    notary public IN THE PHYSICAL PRESENCE OF AN INDIVIDUAL ..."
     *
     * and then provides that regulations "may prescribe the conditions for the
     * notary public to exercise his notarial powers remotely".
     *
     * Three consequences, and they matter more than anything in Cap. 308B:
     *   1. Parliament has legislated on the EXPRESS PREMISE that the general
     *      law of Barbados requires a notary to act in the physical presence of
     *      the individual. That is Parliament's own characterisation of the
     *      baseline, enacted in 2024 — stronger evidence than a presence
     *      requirement inferred from some other statute's wording.
     *   2. Remote notarisation is lawful in Barbados ONLY once regulations
     *      under s.9(2) are made. The Act does not itself permit it.
     *   3. As last verified (a Barbadian firm's note, last modified 2 May
     *      2025) those regulations HAD NOT BEEN MADE. That leaves an 18-month
     *      gap to today and it could not be closed from this environment.
     *      ⚠ THIS IS THE SINGLE HIGHEST-VALUE ITEM TO RE-CHECK BEFORE ANY
     *      BARBADOS DECISION. If the regulations have since been made, the
     *      product becomes lawful and the gate changes character entirely.
     *
     * Also newly relevant and NOT yet encoded anywhere — two 2014 insertions
     * that are build requirements rather than legal trivia:
     *   s.12A — an electronic transaction has NO LEGAL EFFECT where a material
     *           error was made, the system gave NO OPPORTUNITY TO CORRECT IT,
     *           the person promptly notified the other party, and consideration
     *           was returned or dealt with reasonably. A signing flow without a
     *           review-and-correct step before commitment produces VOIDABLE
     *           signatures.
     *   s.16A — a seller using electronic communications to consumers must
     *           provide accurate information about its identity, means of
     *           contact, SERVICE OF LEGAL PROCESS, the goods or services, terms,
     *           costs, and REFUND AND CANCELLATION POLICIES.
     * And a watch item: s.3(4) lets the Minister by regulation disapply the Act
     * or any provision of it to any class of transactions — a single statutory
     * instrument could exclude e-notarisation outright.
     *
     * Do not enable without a written opinion covering BOTH gates.
     */
    launchEnabled: false,
    /**
     * s.3(1) — read from the L.R.O. 2002 text of Cap. 308B and RE-VERIFIED
     * VERBATIM on 25 Oct 2026, including that Act 2014-8 did not amend it.
     * Lettering (a)(b)(c) confirmed. Recorded even though `launchEnabled` is
     * false, so that enabling Barbados later does not start from an empty list
     * the way Trinidad did.
     *
     * Two points confirmed on 25 Oct that were previously assumed:
     *   - s.3(1)(b) IS REAL PROPERTY ONLY. The words "real property" appear
     *     twice and personal property, chattels and things in action appear
     *     nowhere in s.3(1). So Barbados does NOT follow Trinidad, whose s.6(b)
     *     reaches personal property. A chattel sale is not excluded here by the
     *     e-transactions Act — though the Bills of Sale Act, Cap. 306
     *     independently requires attestation by a non-party witness WHO MUST
     *     THEN SWEAR AN AFFIDAVIT OF EXECUTION, plus a true copy verified by a
     *     Justice of the Peace and registration within seven clear days, void
     *     as to the chattels if not. So chattel sales are unservable here for
     *     the same reason as in Guyana, by a different route.
     *   - THE ABSENCE OF A NOTARISATION PROVISION IS CONFIRMED, affirmatively
     *     and by two independent routes: the whole consolidated Act (28
     *     sections, Parts I-VIII) contains no occurrence of notary, notarise,
     *     notarial, attest, swear, oath, affirmation, affidavit, acknowledgement
     *     in the notarial sense, or witness; and Act 2014-8 contains none of
     *     those words either. (One false positive to know about: s.15 is headed
     *     "Acknowledgment of receipt of electronic records", which is about
     *     acknowledging receipt of a MESSAGE and has nothing to do with
     *     notarial acknowledgement.) Barbados legislated for electronic
     *     signatures and for PKI certification and said nothing whatever about
     *     notarisation, attestation, witnessing or presence — which is exactly
     *     why the Notaries Public Act 2024 s.9(2), not Cap. 308B, is the
     *     operative gate. See the note on `launchEnabled`.
     *   - Scope note: s.3(1) disapplies PARTS II AND III ONLY. Part IV
     *     (certification), Part VI (data/privacy), Part VII (intermediaries)
     *     and the new ss.12A/16A still apply to an excluded matter.
     *
     * Note the carve-out in s.3(c): constructive and resulting trusts are NOT
     * excluded, only express ones. The platform has no way to tell them apart
     * from a category tick box, so the whole category stays excluded — the
     * safe direction when the distinction turns on facts the platform cannot see.
     */
    excludedDocumentCategories: [
      // s.3(1)(a) making, execution or revocation of a will or testamentary instrument
      'last_will_and_testament',
      // s.3(b) conveyance of real property or transfer of any interest in it
      'interest_in_immovable_property',
      'agreement_of_sale',
      'lease_agreement',
      // s.3(c) indenture, declaration of trust or power of attorney
      'power_of_attorney',
      'trust_instrument',
    ],
    legalReview: {
      outstanding: true,
      notes:
        'BLOCKING, AND THE PRINCIPAL BLOCKER CHANGED ON 25 OCT 2026. It is no ' +
        'longer s.18. It is the NOTARIES PUBLIC ACT 2024 s.9(2), which confirms ' +
        'that the general law of Barbados requires a notary to act IN THE ' +
        'PHYSICAL PRESENCE of the individual and makes remote notarial acts ' +
        'lawful only once regulations are made — and as last verified (May 2025) ' +
        'they had not been. That gates the notarisation product outright, ' +
        'independently of licensing, and it could not be re-checked from the ' +
        'build environment because barbadosparliament.com and ' +
        'barbadoslawcourts.gov.bb are both refused at the egress proxy. ' +
        'RE-CHECK WHETHER THOSE REGULATIONS HAVE BEEN MADE — it is the single ' +
        'highest-value enquiry for Barbados and it is an 18-month-old answer. ' +
        's.18 remains a real indictable offence with reverse-onus director ' +
        'liability under s.25, but the position is better understood than it ' +
        'was: the licensing regime is NOT dormant (Regulations S.I. 2014 No. 41, ' +
        'BBD 2,500 application fee, insurance and bond of BBD 500,000 each), and ' +
        'on the best reading of the Act 2014-8 s.2 definition a platform that ' +
        'issues no certificates and no key pairs falls OUTSIDE it — moderate ' +
        'confidence only, and ANY PKI feature would flip that analysis. Full ' +
        'reasoning on both gates is in the comment on launchEnabled above. Do ' +
        'not enable without a written opinion covering both.',
    },
  },
});

export const getJurisdiction = (code) => REGISTRY[code] ?? null;

export const listJurisdictions = () => Object.values(REGISTRY);

/** Jurisdictions the platform is currently open for business in. */
export const listLaunchJurisdictions = () =>
  Object.values(REGISTRY).filter((j) => j.launchEnabled);

/** Jurisdictions a notary or COath may be licensed in and take work from. */
export const listNotarizableJurisdictions = () =>
  Object.values(REGISTRY).filter((j) => j.launchEnabled && j.notarizationEnabled);

export const supportsNotarization = (code) =>
  Boolean(REGISTRY[code]?.launchEnabled && REGISTRY[code]?.notarizationEnabled);

export const supportsESignature = (code) =>
  Boolean(REGISTRY[code]?.launchEnabled && REGISTRY[code]?.eSignatureEnabled);

export const isDocumentCategoryExcluded = (code, category) =>
  Boolean(REGISTRY[code]?.excludedDocumentCategories?.includes(category));

/* ------------------------------------------------------------------------- */
/* The lockout                                                                */
/* ------------------------------------------------------------------------- */

export const LOCKOUT_REASON = Object.freeze({
  OK: 'ok',
  UNKNOWN_JURISDICTION: 'unknown_jurisdiction',
  JURISDICTION_NOT_LAUNCHED: 'jurisdiction_not_launched',
  NOTARIZATION_NOT_AVAILABLE: 'notarization_not_available',
  PROFESSIONAL_NOT_LICENSED_HERE: 'professional_not_licensed_here',
  DOCUMENT_CATEGORY_EXCLUDED: 'document_category_excluded',
});

/**
 * The check the brief requires before a notarisation session may begin.
 *
 *   "The session interface MUST display an explicit check that the Document
 *    Jurisdiction matches the Professional Jurisdiction. If they do not match,
 *    the session MUST NOT PROCEED."
 *
 * Call this on the SERVER before issuing a session token, and again in the
 * session UI for display. A client-side check alone is decoration.
 *
 * @param {object}   args
 * @param {string}   args.documentJurisdiction    ISO code the document belongs to
 * @param {string[]} args.professionalJurisdictions codes the notary/COath is licensed in
 * @param {string}  [args.documentCategory]       category for exclusion-schedule check
 * @returns {{ allowed: boolean, reason: string, message: string }}
 */
export function checkJurisdictionLockout({
  documentJurisdiction,
  professionalJurisdictions = [],
  documentCategory = null,
}) {
  const jurisdiction = getJurisdiction(documentJurisdiction);

  if (!jurisdiction) {
    return {
      allowed: false,
      reason: LOCKOUT_REASON.UNKNOWN_JURISDICTION,
      message: `Unknown jurisdiction "${documentJurisdiction}". The session cannot proceed.`,
    };
  }

  if (!jurisdiction.launchEnabled) {
    return {
      allowed: false,
      reason: LOCKOUT_REASON.JURISDICTION_NOT_LAUNCHED,
      message: `WiScribbles does not yet operate in ${jurisdiction.name}. The session cannot proceed.`,
    };
  }

  if (!jurisdiction.notarizationEnabled) {
    return {
      allowed: false,
      reason: LOCKOUT_REASON.NOTARIZATION_NOT_AVAILABLE,
      message:
        `${jurisdiction.name} law does not give electronic notarisation statutory ` +
        `effect (${jurisdiction.statute}). This document cannot be notarised ` +
        `electronically. The session cannot proceed.`,
    };
  }

  if (documentCategory && isDocumentCategoryExcluded(jurisdiction.code, documentCategory)) {
    return {
      allowed: false,
      reason: LOCKOUT_REASON.DOCUMENT_CATEGORY_EXCLUDED,
      message:
        `Documents of this type are excluded from electronic execution under ` +
        `${jurisdiction.statute}. The session cannot proceed.`,
    };
  }

  if (!professionalJurisdictions.includes(jurisdiction.code)) {
    return {
      allowed: false,
      reason: LOCKOUT_REASON.PROFESSIONAL_NOT_LICENSED_HERE,
      message:
        `This professional is not licensed in ${jurisdiction.name}. ` +
        `The session cannot proceed.`,
    };
  }

  return {
    allowed: true,
    reason: LOCKOUT_REASON.OK,
    message: `Jurisdiction confirmed: ${jurisdiction.name}.`,
  };
}

/* ------------------------------------------------------------------------- */
/* Two questions answered from the Acts, Oct 2026                             */
/* ------------------------------------------------------------------------- */

/**
 * DOES ANY OF THE FOUR ACTS REQUIRE THE SESSION TO BE RECORDED?
 *
 * No. Not one of them.
 *
 * This was checked because the live site's privacy policy claims recordings are
 * kept ("Documents and recordings are stored securely and retained for the
 * minimum period required by law"), and nothing in the platform records
 * anything. The question was whether that claim had to be made true or had to
 * be withdrawn. It has to be withdrawn.
 *
 * These are UNCITRAL-model e-transactions statutes. They do functional
 * equivalence — when does an electronic thing satisfy a legal requirement for
 * a written/signed/original/notarised thing — and they say nothing whatever
 * about notarial procedure. There is no audio-visual retention provision, no
 * journal requirement, no minimum retention period for a recording, because
 * there is no recording contemplated anywhere in any of them. (Trinidad s.14
 * mentions "audio or video playback", but it is about not HINDERING a
 * recipient's ability to retain a record, not about making one.)
 *
 * WHAT THEY DO REQUIRE, which is where the effort should go instead:
 *
 *   Retention of the record itself, accessible and in a format that accurately
 *   represents what was generated — Barbados s.10(1)(a),(b); Trinidad s.13.
 *
 *   Retention of the metadata identifying origin, destination and the date and
 *   time sent or received — Barbados s.10(1)(c).
 *
 *   Integrity: the test is whether the information "has remained complete and
 *   unaltered" — Barbados s.9(3)(a); Trinidad s.12(2).
 *
 *   Tamper-evidence as a reliability criterion for the signature itself: the
 *   signature must be "linked to the information to which it relates in such a
 *   manner that any subsequent change in the information is detectable" —
 *   Trinidad s.31(1)(d). And meeting s.31 has a real payoff: under s.31(2) the
 *   record is then "deemed to be unaltered since the time of its signing".
 *
 *   Identification of the originator is an express factor in evidential weight
 *   — Barbados s.11(2)(c); Trinidad s.17.
 *
 * So the statutory burden falls on the document's integrity and on the KYC
 * record, not on a video file. `lib/integrity.js` is the response to
 * Trinidad s.31(1)(d) and Barbados s.9(3)(a).
 *
 * NOTE WHAT THIS DOES NOT SAY. It does not say recording is pointless — a
 * recording is excellent evidence of what a signatory understood and whether
 * they were under pressure, and if WiScribbles ever operates in a jurisdiction
 * with a real RON statute (most US states) it will be mandatory there. It says
 * only that none of these four Acts compels it, so the privacy policy's claim
 * is not a legal obligation being met but an untrue statement to be removed.
 */
export const RECORDING_REQUIRED_BY_STATUTE = Object.freeze({
  GY: false,
  JM: false,
  TT: false,
  BB: false,
});

export const recordingRequired = (code) =>
  RECORDING_REQUIRED_BY_STATUTE[code] === true;

/**
 * MAY A WITNESS ATTEST REMOTELY — e-signing over video while the notary acts?
 *
 * Not safely, in any of these four jurisdictions, and this is gated off
 * everywhere as a result.
 *
 * The Acts validate electronic SIGNATURES, and a witness's electronic
 * signature is a perfectly good signature under all four. That is not the
 * problem. The problem is that a witnessing requirement is not a signature
 * requirement — it is a PRESENCE requirement. When a statute or a deed says an
 * instrument must be signed "in the presence of" a witness, the witness is
 * attesting that they saw the signatory sign. The signature is only the record
 * of that attestation.
 *
 * None of the four Acts touches presence. Each enumerates what it converts:
 * writing, signature, original form, retention, admissibility, and
 * notarisation/acknowledgement/verification. Attestation and presence appear
 * in none of those lists. An Act that carefully says "a requirement for a
 * signature is satisfied by an electronic signature" and never mentions
 * presence has not converted presence.
 *
 * The comparative position supports reading it narrowly rather than
 * generously. Where common-law jurisdictions have permitted remote witnessing
 * they have done it by EXPRESS legislation, and narrowly — England and Wales
 * allowed video witnessing of wills only through a specific temporary
 * instrument, confined to wills, with conditions. Legislatures treating remote
 * witnessing as something that needs its own statute is poor evidence that a
 * general e-signature provision already achieves it.
 *
 * The consequence of getting this wrong is not a rejected upload. It is an
 * instrument that is defective on its face years later, when somebody relies
 * on it and the attestation is challenged — by which time the platform has
 * issued a certificate saying it was properly executed.
 *
 * So: the capability is built (`lib/signing.js` handles witness parties and
 * their signatures), and it is refused at the jurisdiction gate. Enabling it
 * takes a written opinion per jurisdiction, exactly like notarisation in
 * Trinidad. The honest offer in the meantime is the one Prepare & Register
 * already makes: do everything online except the bit the law reserves.
 */
/**
 * ───────────────────────────────────────────────────────────────────────────
 * UPDATE, 25 OCTOBER 2026 — THE OTHER STATUTES HAVE NOW BEEN READ
 * ───────────────────────────────────────────────────────────────────────────
 *
 * The reasoning above was built entirely from the four e-transactions Acts,
 * which was its weakness: those Acts say nothing about presence, so reading
 * them could only ever establish that they do not convert it. The witnessing
 * and attestation statutes themselves had never been examined. They have now
 * been, per jurisdiction, and the conclusion SURVIVES — but it is no longer a
 * conclusion from silence, and two findings qualify it in opposite directions.
 *
 * WHAT THE INSTRUMENT-SPECIFIC STATUTES REQUIRE (primary sources)
 *
 * Guyana
 *   Deeds Registry Act, Cap. 5:01 s.17(1): instruments creating an interest in
 *     immovable property must be "signed and executed in the presence of two
 *     witnesses" and proved and filed; s.20(1) requires verification "by the
 *     affidavit or declaration of one at least of the subscribing witnesses" —
 *     a human witness must LATER SWEAR to the execution, which is the real
 *     obstacle to remote attestation; ss.12(1) and 16(1) require core
 *     conveyancing to be executed before the COURT or the Registrar, a
 *     physical institutional act no platform can replicate.
 *   Bills of Sale Act, Cap. 90:12 s.8(1)(a): "the execution of every bill of
 *     sale shall be attested by two credible witnesses" who are not parties.
 *     See the `chattel_sale` exclusion on Guyana above — this is why.
 *   Wills Act, Cap. 12:02 s.4: two or more witnesses "present at the same
 *     time", attesting in the testator's presence.
 *   Powers of Attorney Act, Cap. 5:08 s.2A (as amended by Act 2 of 2022): the
 *     hardest in-person requirement found anywhere in this research — donor
 *     and donee must "appear personally together before a Public Notary or
 *     Magistrate", each producing two photo IDs, and s.2A(4) requires signing
 *     "in the presence of a Public Notary or Magistrate and two witnesses" who
 *     subscribe in each other's presence. The 2022 amendment made this
 *     STRICTER, not looser — a deliberate anti-fraud tightening, and a clear
 *     signal of legislative direction.
 * Trinidad & Tobago
 *   Registration of Deeds Act, Chap. 19:06 s.7(1)(a): one non-party witness
 *     AND a qualified functionary must be present and the witness must attest
 *     signing and delivery; s.5 and s.11 require the witness to swear or
 *     declare proof of execution. Note the requirement lives here, in a
 *     REGISTRABILITY provision, and not in the Conveyancing and Law of
 *     Property Act, which imposes no attesting-witness requirement at all.
 *     Since registration is what gives a land deed priority (s.16), it is
 *     effectively mandatory. Pending change: Act No. 17 of 2020 would repeal
 *     ss.7-8 and move execution to a new s.5B; commencement NOT ESTABLISHED.
 *   Wills and Probate Act, Chap. 9:03 s.42: two witnesses, present at the same
 *     time, attesting in the presence of the testator AND of each other —
 *     three concurrent presence requirements.
 * Jamaica
 *   Registration of Titles Act s.152 is the hardest constraint on the model:
 *     an individual signing must do so BEFORE one of the prescribed
 *     functionaries (JP, Judge, Registrar of Titles, Notary Public,
 *     Governor-General, attorney-at-law), and where a lay witness witnesses
 *     instead, that witness must then APPEAR BEFORE a listed functionary who
 *     makes due enquiries and endorses the prescribed form.
 *   Wills Act s.6: two witnesses, "present at the same time".
 * Barbados
 *   Succession Act, Cap. 249 s.61(1): two or more witnesses, present at the
 *     same time, each attesting in the testator's presence.
 *   Bills of Sale Act, Cap. 306 s.10: attestation by a non-party credible
 *     witness AND that witness's own affidavit of execution, plus a true copy
 *     verified by a Justice of the Peace and registration within seven clear
 *     days (s.8), void as to the chattels otherwise.
 *
 * FINDING 1 — THE "OFFICER IS THE FORMALITY" ASSUMPTION IS CONFIRMED FOR THE
 * LAUNCH CATALOGUE, BUT IT IS NOT UNIVERSAL AND IT IS NOT THE RIGHT QUESTION.
 *
 * The bulk of the catalogue — affidavits, statutory declarations, attestation
 * and certified copies — depends on the authorised officer BEING the whole
 * formality, with no additional lay witness. That is confirmed on primary
 * sources in Guyana (Statutory Declarations Act, Cap. 5:09 s.3(1) names only
 * the officer, and the statutory form in the Schedule provides signature lines
 * for the declarant and the officer alone) and in Jamaica (Voluntary
 * Declarations Act s.2 and s.10; the Schedule jurat is "Taken and acknowledged
 * ... before me"), and confirmed in Trinidad from official Government forms
 * made under the Statutory Declarations Act, Chap. 7:04, whose jurat is simply
 * "Declared before me" with no lay-witness line. In Barbados it is neither
 * confirmed nor refuted — there appears to be no statute of general
 * application on who may administer an oath, and the Supreme Court
 * (Judicature) (Civil Procedure) Rules 2008 r.30.5 could not be retrieved.
 *
 * It is NOT universal: bills of sale in both Guyana and Barbados require a lay
 * witness IN ADDITION to an officer. So it must not be encoded as a global
 * rule.
 *
 * And it is not the question that decides the business model. The constraint
 * on the launch catalogue was never a missing witness. It is the meaning of
 * the word "BEFORE" — "before him", "Declared before me", "sworn before",
 * "appear personally before". Whether a video appearance satisfies that is
 * unresolved in all four jurisdictions, and no subsidiary instrument in
 * Guyana — no regulation, practice direction, court rule, DCRA circular or
 * Registrar's direction made since the 2023 Act — resolves it.
 *
 * FINDING 2 — THE NOTARIAL STATUTES DO NOT THEMSELVES PROHIBIT ACTING
 * REMOTELY, WITH ONE DECISIVE EXCEPTION.
 *
 * Guyana's Public Notaries Act, Cap. 4:02 contains no requirement that a party
 * appear before the notary and no limit on where a notary may act (s.2(2)
 * describes the SCOPE of appointment, not a restriction on acting). Jamaica's
 * Notaries Public Act is the same. Trinidad's Notaries Public Act, Chap. 6:51
 * and Commissioners of Affidavits Act, Chap. 6:52 could not be read at all —
 * they exist only on a government domain the build environment cannot reach,
 * so for Trinidad this is NOT FOUND, which is not the same as permission, and
 * obtaining those two Acts is the highest-value outstanding research item.
 *
 * THE EXCEPTION IS BARBADOS, AND IT IS EXPRESS. Notaries Public Act 2024
 * s.9(2) opens "Notwithstanding the requirement in law to exercise the powers
 * of a notary public IN THE PHYSICAL PRESENCE OF AN INDIVIDUAL" and then
 * provides that regulations may prescribe conditions for acting remotely.
 * Parliament has therefore stated, in an enacted 2024 provision, that the
 * baseline law requires physical presence — and has made remote notarial acts
 * conditional on regulations which, as last verified in May 2025, had not been
 * made. That is a harder gate than anything in Cap. 308B.
 *
 * FINDING 3 — AND THIS ONE POINTS THE OTHER WAY. THERE IS NOW REAL EVIDENCE
 * THAT "BEFORE" NEED NOT MEAN PHYSICALLY PRESENT.
 *
 * Trinidad and Tobago Gazette Vol. 62, No. 179, 12 December 2023, item 1896 —
 * Practice Directions of the Judiciary, effective immediately, with no sunset.
 * Paragraph 30 permits an oath or affirmation to be administered in three
 * ways, and the second is:
 *
 *   VIRTUALLY, where the officer and the deponent "communicate by video
 *   connection including video call" — the officer being, among others, a
 *   NOTARY PUBLIC.
 *
 * SCOPE LIMITS, STATED PLAINLY BECAUSE THIS IS EASY TO OVERCLAIM: it operates
 * in the CRIMINAL jurisdiction, under the Criminal Procedure Rules 2023, and
 * largely in relation to the Judiciary's own filing platform. It does NOT
 * authorise remote notarisation in commercial transactions and it does not
 * change the position of this code. Its value is precedential: the Judiciary
 * of Trinidad and Tobago has accepted, in the official Gazette, that an oath
 * may be validly administered to a Notary Public by video connection. That is
 * the best answer anywhere in these four jurisdictions to the question above,
 * and it is a strong platform for the opinion that would re-enable this.
 *
 * SO THE ANSWER TO "IS THE WITNESS FEATURE NECESSARY?" IS NO — on three
 * independent grounds, which is why the UI option came out on 19 Oct and why
 * this code stays switched off:
 *   1. Almost everything that classically needs a witness is already outside
 *      the electronically-executable catalogue in every jurisdiction.
 *   2. The one permitted category that clearly needed witnesses — sale of
 *      chattels in Guyana — requires TWO non-party witnesses who must swear
 *      to the execution afterwards, which no video call delivers, and it has
 *      now been excluded for that reason.
 *   3. No jurisdiction has been found to permit remote ATTESTATION by a lay
 *      witness. The Trinidad Practice Direction is about an OFFICER
 *      administering an oath, which is a different act.
 *
 * WHAT WOULD CHANGE THAT: a written opinion that a jurisdiction permits remote
 * attestation, extending the Trinidad Practice Direction's reasoning from
 * officers to witnesses, or the Barbados s.9(2) regulations being made. Any of
 * those is a flag flip here and nothing else — the machinery is intact.
 */
export const REMOTE_WITNESSING_ENABLED = Object.freeze({
  GY: false,
  JM: false,
  TT: false,
  BB: false,
});

export const remoteWitnessingEnabled = (code) =>
  REMOTE_WITNESSING_ENABLED[code] === true;

export const REMOTE_WITNESSING_REFUSAL =
  'A witness has to be present when the document is signed, and none of the ' +
  'electronic transactions Acts in our jurisdictions converts "in the presence ' +
  'of" into "over video". A witness can sign electronically — but only once ' +
  'they have actually witnessed the signing. Where a document needs a witness, ' +
  'the witnessing happens in person and the rest of the work still happens ' +
  'here.';
