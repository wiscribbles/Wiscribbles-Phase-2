/**
 * Document templates.
 *
 * Brief, on both document-to-role and document-to-jurisdiction mapping:
 *   "This can be done by the creation of templates in the website manager
 *    dashboard. These templates will have tick boxes for roles and
 *    jurisdiction and any document uploaded by a user or account holder must
 *    be attributed to one of the templates."
 *
 * So a template is the unit that carries routing: who may handle this kind of
 * document, and where. Every uploaded document binds to one, and the binding
 * is what the session lockout later checks against.
 *
 * THE POINT OF THE VALIDATION BELOW: the Website Manager cannot create a
 * template that routes work somewhere it has no legal effect. Ticking
 * "requires notarisation" and "Trinidad & Tobago" together is refused, because
 * Trinidad has no provision equivalent to Guyana s.14(3) and the resulting
 * instrument would be a nullity. Catching that at template creation is far
 * better than catching it in a live session with a client waiting — or not
 * catching it at all.
 */

import { ROLES } from '@/lib/roles';
import {
  getJurisdiction,
  isDocumentCategoryExcluded,
  listLaunchJurisdictions,
  supportsNotarization,
} from '@/lib/jurisdictions';

/** Roles that can be ticked on a template. Only the two that do the work. */
export const TEMPLATE_ROLES = Object.freeze([ROLES.NOTARY, ROLES.COATH]);

/**
 * Document categories. The first group maps onto the exclusion schedules in
 * lib/jurisdictions, so a template in an excluded category is caught.
 */
export const DOCUMENT_CATEGORIES = Object.freeze([
  { value: 'affidavit', label: 'Affidavit' },
  { value: 'statutory_declaration', label: 'Statutory declaration' },
  { value: 'attestation', label: 'Attestation / certified copy' },
  { value: 'employment_contract', label: 'Employment contract' },
  { value: 'commercial_contract', label: 'Commercial contract' },
  { value: 'corporate_resolution', label: 'Corporate resolution' },
  { value: 'nda', label: 'Non-disclosure agreement' },
  { value: 'property_management', label: 'Property management agreement' },
  { value: 'chattel_sale', label: 'Sale of chattels' },

  /* Commonly requested, frequently excluded. Listed so the Website Manager
     can see them refused with a reason rather than wondering why they are
     missing. */
  { value: 'power_of_attorney', label: 'Power of attorney', oftenExcluded: true },
  { value: 'last_will_and_testament', label: 'Last will and testament', oftenExcluded: true },
  { value: 'agreement_of_sale', label: 'Agreement of sale', oftenExcluded: true },
  { value: 'lease_agreement', label: 'Lease agreement', oftenExcluded: true },
  { value: 'promissory_note', label: 'Promissory note', oftenExcluded: true },
  { value: 'other', label: 'Other' },
]);

export const EXECUTION_MODE = Object.freeze({
  /** Signature only — no authorised person involved. */
  ESIGN: 'esign',
  /** Requires a Notary or Commissioner of Oaths. */
  NOTARIZED: 'notarized',
});

export const isValidCategory = (value) =>
  DOCUMENT_CATEGORIES.some((category) => category.value === value);

/**
 * Validate a template before it is saved.
 *
 * @param {object} template
 * @param {string} template.name
 * @param {string} template.documentCategory
 * @param {string} template.executionMode    one of EXECUTION_MODE
 * @param {string[]} template.roles          ticked professional roles
 * @param {string[]} template.jurisdictions  ticked jurisdictions
 * @returns {{ valid: boolean, errors: Record<string,string>, warnings: string[] }}
 */
export function validateTemplate({
  name,
  documentCategory,
  executionMode,
  roles = [],
  jurisdictions = [],
}) {
  const errors = {};
  const warnings = [];

  if (!name || name.trim().length < 3) {
    errors.name = 'Give the template a name.';
  } else if (name.trim().length > 120) {
    errors.name = 'Keep the name under 120 characters.';
  }

  if (!isValidCategory(documentCategory)) {
    errors.documentCategory = 'Choose a document category.';
  }

  if (!Object.values(EXECUTION_MODE).includes(executionMode)) {
    errors.executionMode = 'Choose how this document is executed.';
  }

  if (!Array.isArray(jurisdictions) || jurisdictions.length === 0) {
    errors.jurisdictions = 'Tick at least one jurisdiction.';
  }

  const notarized = executionMode === EXECUTION_MODE.NOTARIZED;

  if (notarized && (!Array.isArray(roles) || roles.length === 0)) {
    errors.roles = 'Tick at least one role that may handle this document.';
  }

  if (Array.isArray(roles)) {
    const invalidRoles = roles.filter((role) => !TEMPLATE_ROLES.includes(role));
    if (invalidRoles.length) {
      errors.roles = `Not a professional role: ${invalidRoles.join(', ')}.`;
    }
    if (!notarized && roles.length > 0) {
      warnings.push(
        'This template is e-signature only, so the ticked roles have no effect.',
      );
    }
  }

  /* ---- the legal checks ------------------------------------------------ */

  if (Array.isArray(jurisdictions)) {
    for (const code of jurisdictions) {
      const jurisdiction = getJurisdiction(code);

      if (!jurisdiction) {
        errors.jurisdictions = `Unknown jurisdiction "${code}".`;
        continue;
      }

      if (!jurisdiction.launchEnabled) {
        errors.jurisdictions =
          `WiScribbles does not operate in ${jurisdiction.name} yet.` +
          (jurisdiction.legalReview?.outstanding
            ? ' There is an outstanding legal question on that market.'
            : '');
        continue;
      }

      // The one that matters most. A notarised template in a jurisdiction
      // with no enabling provision produces instruments with no effect.
      if (notarized && !supportsNotarization(code)) {
        errors.jurisdictions =
          `${jurisdiction.name} law does not give electronic notarisation ` +
          `statutory effect (${jurisdiction.statute}). This template cannot ` +
          `require notarisation there — offer it as e-signature only, or ` +
          `untick ${jurisdiction.name}.`;
        continue;
      }

      if (documentCategory && isDocumentCategoryExcluded(code, documentCategory)) {
        errors.documentCategory =
          `Documents of this type are excluded from electronic execution in ` +
          `${jurisdiction.name} under ${jurisdiction.statute}. They must be ` +
          `executed on paper.`;
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, warnings };
}

/**
 * Which templates a client may choose, given where they are and what they
 * want done. Used by the Stage 6 upload flow.
 */
export function selectableTemplates(templates, { jurisdiction, executionMode = null }) {
  return templates.filter((template) => {
    if (!template.active) return false;
    if (!template.jurisdictions?.includes(jurisdiction)) return false;
    if (executionMode && template.executionMode !== executionMode) return false;
    return true;
  });
}

/**
 * Can this professional handle this template?
 * The role half of the document-to-role mapping; the jurisdiction half is
 * `checkJurisdictionLockout` in lib/jurisdictions.
 */
export function canProfessionalHandle(template, { role, jurisdictions = [] }) {
  if (!template?.active) {
    return { allowed: false, reason: 'That template is no longer active.' };
  }

  if (template.executionMode === EXECUTION_MODE.ESIGN) {
    return { allowed: false, reason: 'That document does not require a professional.' };
  }

  if (!template.roles?.includes(role)) {
    return {
      allowed: false,
      reason: 'This document type is not handled by your role.',
    };
  }

  const overlap = (template.jurisdictions ?? []).filter((code) => jurisdictions.includes(code));
  if (overlap.length === 0) {
    return {
      allowed: false,
      reason: 'You are not licensed in a jurisdiction this document is valid in.',
    };
  }

  return { allowed: true, reason: null, jurisdictions: overlap };
}

/** For the admin form: the jurisdictions that can be ticked at all. */
export const selectableJurisdictionsForTemplates = () =>
  listLaunchJurisdictions().map((j) => ({
    code: j.code,
    name: j.name,
    supportsNotarization: j.notarizationEnabled,
  }));
