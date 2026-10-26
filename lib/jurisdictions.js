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
     * RESOLVED 26 OCTOBER 2026 — s.15(3), read from the gazetted Act.
     *
     * The Official Gazette of 16 August 2023, Legal Supplement A, Act No. 12
     * of 2023, was OCR'd from the scan page by page. The provision reads:
     *
     *   "15. ... (3) Where information or a signature, document or record is
     *   required by any law, or by contract or deed to be notarised,
     *   acknowledged, verified or made under oath, the requirement is
     *   satisfied if, in relation to electronic information, an electronic
     *   signature, electronic document or electronic record, the electronic
     *   signature of the person authorised to perform those acts, together
     *   with all other information required to be included by other
     *   applicable law, is attached to or associated with the electronic
     *   information, electronic signature, electronic document or electronic
     *   record to be notarised, acknowledged, verified or made under oath."
     *
     * So BOTH earlier answers were wrong. `s.14(3)` is the 2019 Bill's
     * numbering; s.14 of the Act is "Legal recognition of receipt, payment or
     * transfer of money by electronic form or means". And the newspaper
     * commentary's `s.15(2)` is wrong too — s.15(2) is the SEAL provision.
     * The notarisation provision is s.15(3).
     *
     * TWO THINGS IN THE PROVISION THAT BIND THE BUILD:
     *
     *   "together with all other information required to be included by other
     *   applicable law" — the hook that makes the certificate contents a
     *   statutory requirement rather than presentation. See
     *   `certificateStatements` on the other jurisdictions.
     *
     *   s.15(2), one subsection up, is worth knowing about even though it is
     *   not the notarisation power: where a SEAL is required by law, the
     *   requirement is met only by "the secure electronic signature of the
     *   person by whom it is required to be sealed". "Secure electronic
     *   signature" is a defined term with its own reliability and integrity
     *   requirements in Part V s.31. So any instrument needing a seal demands
     *   a higher standard of signature than an ordinary notarial act does,
     *   and the platform does not currently distinguish the two. Not a
     *   blocker for the launch catalogue, which contains no sealed
     *   instruments; a blocker for anything that adds one.
     *
     * The Act is also far larger than the Bill it came from: the Bill ended at
     * s.50, the Act runs past s.84 and adds an entire Part IX of offences
     * about cards and electronic fund transfer. Any section number in this
     * file taken from Bill-era research must be treated as unverified until
     * checked against the gazette the same way.
     */
    notarizationEnabled: true,
    notarizationStatutoryBasis: 's.15(3)',
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
       * GROUND 2, NOW CONFIRMED AND WIDER THAN GROUND 1 — the gazetted Act
       * excludes movable property outright.
       *
       * The Schedule, read from the gazette on 26 October 2026, item 1:
       * "Creation or transfer of interest in MOVABLE or immovable property."
       * The 2019 Bill said "real or immovable". The word changed between Bill
       * and Act, and the two secondary sources that reported it were right.
       *
       * s.4(1): "This Act does not apply to the documents and transactions
       * specified in the Schedule." So this is not a weak presumption against
       * electronic execution — the Act simply does not reach these
       * transactions at all, and nothing in it can give an electronic
       * signature on one of them legal effect. Every transfer of an interest
       * in movable property is outside the Act: chattels, vehicles, goods,
       * equipment.
       *
       * That makes this exclusion REQUIRED rather than prudent, and it is
       * wider than Ground 1: Ground 1 catches instruments that happen to be
       * bills of sale, Ground 2 catches any transfer of an interest in a
       * movable thing however it is papered.
       *
       * Ground 1 alone justifies the exclusion, which is why it is encoded now
       * rather than left pending ground 2.
       */
      'chattel_sale',
    ],
    legalReview: {
      outstanding: true,
      /*
       * 26 OCTOBER 2026 — THE GAZETTE HAS BEEN READ. This is the primary
       * record; everything below it that says "probably" has been resolved.
       *
       * How, since two previous attempts failed: the owner's own copy of the
       * gazette PDF was taken from his machine rather than from the project
       * knowledge base. The knowledge base serves the file as already-extracted
       * text, which for this document is the running page headers and nothing
       * else — the body is an image scan. The PDF itself was rasterised at
       * 300 dpi and OCR'd page by page. If this has to be done again, that is
       * the route: the file, not the extraction.
       *
       * WHAT THE ACT ACTUALLY SAYS — all PRIMARY, from the Official Gazette of
       * 16 August 2023, Legal Supplement A:
       *
       *   - NOTARISATION IS s.15(3). Not s.14(3) (the Bill), not s.15(2) (the
       *     newspaper commentary — that is the seal provision). Quoted in full
       *     above.
       *
       *   - THE SCHEDULE HAS SIX ITEMS, and item 1 says "MOVABLE":
       *       1. Creation or transfer of interest in movable or immovable
       *          property.
       *       2. Negotiable instruments.
       *       3. Documents of title.
       *       4. Wills and other testamentary instruments.
       *       5. Trusts.
       *       6. Powers of attorney.
       *     s.4(1): "This Act does not apply to the documents and transactions
       *     specified in the Schedule." Not a presumption — the Act does not
       *     reach them, so nothing in it can give an electronic signature on
       *     one of them any effect.
       *
       *   - s.4(2): "The Minister may, by order, amend the Schedule." A WATCH
       *     ITEM with teeth in both directions: an order could free a category
       *     or capture a new one, and it would not be an amending Act that
       *     anyone would notice.
       *
       *   - THE ENCODED LIST MAPS ONTO THE SCHEDULE, with one exception.
       *     `interest_in_immovable_property`, `chattel_sale` and
       *     `agreement_of_sale` all fall under item 1 now that it reads
       *     "movable or immovable"; `negotiable_instrument` and
       *     `promissory_note` under item 2; `document_of_title` under 3;
       *     `last_will_and_testament` under 4; `trust_instrument` under 5;
       *     `power_of_attorney` under 6. `lease_agreement` is item 1 on the
       *     footing that granting a lease creates an interest in immovable
       *     property, which is an inference rather than the Schedule's words.
       *     THE EXCEPTION IS `court_document`, which appears NOWHERE in the
       *     Schedule. It stays excluded on a different ground — the Deeds
       *     Registry Act requires certain instruments to be executed before
       *     the Court (ss.12(1), 16(1)) — and should not be described as a
       *     Schedule exclusion, because it is not one.
       *   - Immigration, citizenship and passport documents appear in NO source
       *     — not the Bill Schedule, not the firm's summary of the Act, not the
       *     Minister's remarks. So the Guyana/Trinidad asymmetry looks real
       *     rather than a gap. It is also less dangerous than it looks: the
       *     Act's s.5(1)(a) provides that nobody is required to ACCEPT
       *     electronic communications, so an immigration authority may refuse
       *     an electronically executed document whatever the schedule says. A
       *     user-facing warning is the proportionate response, not a hard block.
       *   - COMMENCEMENT IS SETTLED, and the evidence is an absence. s.1 of
       *     the Act is a single sentence — "This Act may be cited as the
       *     Electronic Communications and Transactions Act 2023" — with no
       *     subsection (2) and no commencement provision of any kind. The
       *     Interpretation and General Clauses Act, Cap. 2:01 s.15 therefore
       *     applies by default and the Act came into operation on publication,
       *     16 August 2023. This was previously recorded as a risky inference
       *     because the Data Protection Act (No. 18 of 2023) and the Digital
       *     Identity Card Act (No. 19 of 2023), assented the same day, both DO
       *     require commencement orders and had not received them. That is now
       *     the point rather than the worry: those Acts say so in their own
       *     s.1, and this one does not.
       *
       *   - s.23 IS A REVIEW-AND-CORRECT PROVISION, AND IT IS IN FORCE HERE.
       *     This was missed entirely until the gazette was read, and it is the
       *     most consequential find in the document. s.23(1) makes an
       *     electronic contract or transaction VOID where all of:
       *       (a) the person made a material error in the information;
       *       (b) the other party's electronic agent "did not provide an
       *           opportunity to prevent or correct the error";
       *       (c) the person notifies on becoming aware of it;
       *       (d) the other party takes no reasonable steps to correct it; and
       *       (e) no material benefit was received, or consideration is
       *           returned.
       *     Void, not merely voidable. The conditions are conjunctive and limb
       *     (b) is the one the platform controls, which means a confirm-and-
       *     amend step before commitment is what defeats the claim. That step
       *     exists — `lib/review.js`, enforced in `recordSignature` — and was
       *     built believing the duty applied only in Barbados and Jamaica,
       *     both of which are gated off. It applies in the primary launch
       *     market, in force, today.
       *
       *   - s.5(1)(a) CONFIRMED verbatim: nothing in the Act "require[s] any
       *     person to use or accept electronic communications, electronic
       *     signatures or electronic contracts". So consent is an element of
       *     validity, which is why it is captured per party per document.
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
        'THE STATUTE IS NOW VERIFIED FROM THE GAZETTE (26 Oct 2026). ' +
        'Notarisation is s.15(3); the exclusion Schedule is the six items ' +
        'recorded above and item 1 covers MOVABLE as well as immovable ' +
        'property; the Act is in force from 16 August 2023 because s.1 ' +
        'contains no commencement provision; s.23 voids a transaction where no ' +
        'opportunity to correct a material error was given. The schedule and ' +
        'the certificate basis no longer rest on Bill-era text. ' +
        'WHAT IS STILL OUTSTANDING IS NO LONGER ABOUT THIS ACT. ' +
        '(1) The professional-conduct and fee question: Legal Practitioners ' +
        'Act Cap. 4:01 Rule VI(1) forbids advertising legal services through ' +
        'any medium, s.12 and s.16 make touting an offence, Rule XIII(2) deems ' +
        'an attorney who associates with touts unfit to practise, and ' +
        'Public Notaries Act Cap. 4:02 s.5 caps notarial fees at the figure ' +
        'prescribed by rules of court. This governs how the platform may be ' +
        'described, priced and paid, and it needs a Guyanese attorney. It is ' +
        'the item most likely to change the commercial model rather than the ' +
        'code. (2) The Certifying Authority under s.35 has still not been ' +
        'established, so s.38 registration is impossible to comply with rather ' +
        'than merely un-obtained; whether any offence attaches is not found. ' +
        '(3) s.4(2) lets the Minister amend the Schedule by order — worth ' +
        'rechecking before launch and periodically after. (4) No regulations ' +
        'have been made under the Act.',
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

/* ========================================================================== */
/* WHAT HAS BEEN READ FROM PRIMARY TEXT, AND WHAT HAS NOT                     */
/* ========================================================================== */

/**
 * The provenance record for everything above.
 *
 * This exists because the most dangerous state for this file is not being
 * wrong — it is being wrong while looking verified. Three separate times a
 * section number or a schedule entry in here turned out to come from a Bill,
 * a newspaper column, or an inference, after it had already been printed on a
 * certificate as though it were the law. So each jurisdiction now records
 * which document was actually read, how current that document is, and what it
 * did and did not settle.
 *
 * Read it before trusting any citation in this file, and extend it rather than
 * quietly correcting a number.
 */
export const PRIMARY_SOURCE_VERIFICATION = Object.freeze({
  GY: Object.freeze({
    document: 'Official Gazette, Legal Supplement A, 16 August 2023 — Act No. 12 of 2023',
    howRead:
      'Image scan with no text layer. Rasterised at 300 dpi and OCR\'d page by ' +
      'page, 26 October 2026. The knowledge-base copy is useless for this — it ' +
      'serves only the running page headers.',
    currency: 'As enacted. No amending Act or commencement order found.',
    confirmed: Object.freeze([
      's.15(3) is the notarisation provision (NOT s.14(3), which is the Bill, and NOT s.15(2), which is the seal provision)',
      's.15(2) requires a SECURE electronic signature where a seal is required by law',
      's.4(1): the Act does not apply to the Schedule at all',
      's.4(2): the Minister may amend the Schedule by order',
      'Schedule item 1 reads "movable or immovable property" — the Bill said "real or immovable"',
      'Schedule has exactly six items: property, negotiable instruments, documents of title, wills, trusts, powers of attorney',
      's.1 contains NO commencement provision, so Cap. 2:01 s.15 applies and the Act is in force from publication',
      's.5(1)(a): nobody is required to use or accept electronic communications, signatures or contracts',
      's.23(1): an electronic transaction is VOID where no opportunity to prevent or correct a material error was given',
      'The Act runs past s.84 with a Part IX of card and fund-transfer offences; the 2019 Bill ended at s.50',
    ]),
    notConfirmed: Object.freeze([
      'Whether any offence attaches to operating unregistered under s.38 — the section body was not read closely',
      'The prescribed notarial fee schedule under Cap. 4:02 s.5 — a different statute, not obtained',
      'Whether any order under s.4(2) has since amended the Schedule',
    ]),
  }),

  TT: Object.freeze({
    document:
      'Electronic Transactions Act Chap. 22:05 — Ministry of the Attorney General ' +
      'consolidation, Act 6 of 2011 as amended by Act 4 of 2014',
    howRead: 'Text layer extracted directly. 26 October 2026.',
    currency:
      'UPDATED TO 31 DECEMBER 2016, and marked "UNOFFICIAL VERSION" on every ' +
      'page. So this settles the 2011–2016 position and nothing after it. A ' +
      'ten-year gap remains, and it is the gap in which the outstanding Parts ' +
      'could have been proclaimed.',
    confirmed: Object.freeze([
      's.18 "Electronic notarisation" exists verbatim, sits in Part II, and imposes no accreditation condition',
      's.6 disapplies Parts II, III and IV only — not the whole Act',
      's.6(b) covers "real or personal property", so movable property is excluded as in Guyana',
      's.6(d) covers immigration, citizenship and passport matters',
      'Note on Proclamation: "Parts V, VI, VIII, IX and X had not yet been brought into operation" — so the Part V accreditation offence and the Part IX general penalty are not law',
      'The Schedule to s.31 contains exactly one entry: "Electronic certificates"',
    ]),
    notConfirmed: Object.freeze([
      'Anything after 31 December 2016, including whether Parts V, VI, VIII, IX or X have since been proclaimed',
      'The exact words of s.31(3) and therefore how hard the Schedule limits what can validate a signature',
      'Notaries Public Act Chap. 6:51 and Commissioners of Affidavits Act Chap. 6:52 — still not obtained',
    ]),
  }),

  JM: Object.freeze({
    document: 'Electronic Transactions Act — consolidation authorised by L.N. 11/2010',
    howRead: 'Text layer extracted directly. 26 October 2026.',
    currency:
      'AUTHORISED TO L.N. 11/2010 ONLY. This copy PREDATES Act 6 of 2023, which ' +
      'is reported to amend the First Schedule — the very thing encoded above. ' +
      'So the schedule is verified as at 2010 and unverified as at today.',
    confirmed: Object.freeze([
      'First Schedule (s.4) has exactly four items, each excluding the Whole Act: wills and testamentary instruments; conveyance or transfer of real property or any interest in it; creation, variation, performance or enforcement of a trust or power of attorney; any procedure under the Civil Procedure Rules 2002 or rules of court',
      'Item 2 is REAL property only — movable property is NOT excluded in Jamaica, unlike Guyana and Trinidad',
      'So `lease_agreement` is a sound reading of item 2 ("any interest in real property"), not a stretch',
      'And `court_document` IS a schedule item here (item 4), unlike Guyana where it rests on the Deeds Registry Act',
      's.5(2): the Act applies only between parties who have each agreed to transact electronically',
      's.5(3)(b): agreement may be inferred from context, surrounding circumstances and conduct',
      'Second Schedule (s.27) sets the consumer information a supplier must provide',
    ]),
    notConfirmed: Object.freeze([
      'Act 6 of 2023 and what it does to the First Schedule — STILL the blocking item for Jamaica',
      'Whether "encrypted signature" in s.9(a) requires a cryptographic signature',
    ]),
  }),

  BB: Object.freeze({
    document: 'Electronic Transactions Act Cap. 308B — L.R.O. 2002',
    howRead: 'Text layer extracted directly. 26 October 2026.',
    currency:
      'L.R.O. 2002 — the 2002 revised edition. It PREDATES Act 2014-8 and ' +
      'contains no s.12A, no s.16A, no s.18A and no Supervisor; a search for ' +
      'each returns nothing. Every citation to those provisions therefore ' +
      'remains SECONDARY, including the s.12A review-and-correct duty recorded ' +
      'in lib/review.js. Barbados is gated off, so nothing turns on it today, ' +
      'but it must not be presented as verified.',
    confirmed: Object.freeze([
      's.3(1) disapplies Parts II and III to: (a) wills and testamentary instruments; (b) conveyance of real property or transfer of any interest in real property; (c) indenture, declaration of trust or power of attorney',
      's.3(1)(c) expressly EXCEPTS constructive and resulting trusts, which are therefore within the Act',
      's.3(1)(b) is REAL property only, so `agreement_of_sale` of goods is over-excluded above — conservative, and moot while Barbados is gated',
      'There is NO notarisation provision anywhere in Cap. 308B: a search for "notar" across the whole Act returns nothing. This is an affirmative negative, read directly.',
    ]),
    notConfirmed: Object.freeze([
      'Everything inserted by Act 2014-8: s.12A, s.16A, s.18 as amended, s.18A, s.25 director liability',
      'Notaries Public Act 2024 — its Act number, assent date, commencement, and whether the s.9(2) remote-notarisation regulations have been made',
    ]),
  }),
});
