/**
 * The standard forms library.
 *
 * Brief (18 Oct): "Create a standard forms library whereby the website manager
 * includes standard forms for everyone on the website to use."
 *
 * The Website Manager uploads a blank form once — an affidavit of identity, a
 * statutory declaration — and every account can take a copy and have it
 * executed. It is the difference between a platform and a file host: a client
 * who does not have a correctly drafted affidavit to hand cannot use a notary
 * service at all, however good the notary is.
 *
 * HOW IT RELATES TO TEMPLATES, WHICH ARE A DIFFERENT THING
 *
 * A TEMPLATE (`lib/templates.js`) is routing metadata: who may handle this
 * kind of document, where it has effect, whether it needs a seal. It has no
 * file.
 *
 * A STANDARD FORM is a file — the actual blank PDF. It binds to a template, so
 * taking a form gives you the document AND the routing rules that come with
 * it. One template can have several forms (a short-form and long-form
 * affidavit); a form belongs to exactly one template.
 *
 * ONE COPY, SHARED. The library's files are stored once, under the platform's
 * own path rather than per-account. They do not count against anybody's
 * repository quota, because nobody is storing them — charging each account for
 * a copy of a form it merely used would be billing people for storage that
 * does not exist. When an account USES a form, a copy is made into their own
 * folder and that copy counts, because at that point it is their document.
 *
 * PDF ONLY. Not a technical limitation — a decision, the same one the upload
 * flow makes. The PDF is what gets signed and sealed, so a conversion step
 * between what the client approved and what the notary sealed would be a gap
 * nobody can audit. Phase 1's marketing offered "pdf / docx templates"; this
 * library holds PDFs, and the copy saying otherwise is wrong.
 */

import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { downloadBuffer, uploadBuffer, uniqueFilename, ALLOWED_DOCUMENT_TYPES } from '@/lib/storage/server';
import { DOCUMENT_CATEGORIES, isValidCategory } from '@/lib/templates';
import { getJurisdiction, listLaunchJurisdictions } from '@/lib/jurisdictions';

export const FORMS_COLLECTION = 'standardForms';

/** Where the library's shared files live. Not under any user's path. */
export const FORMS_STORAGE_PREFIX = 'library/forms';

/** PDF, and only PDF. See the note at the top. */
export const PERMITTED_FORM_TYPES = ALLOWED_DOCUMENT_TYPES;

/** A blank form is a form, not a book. */
export const MAX_FORM_BYTES = 10 * 1024 * 1024;

export class FormError extends Error {
  constructor(code, message, status = 422, field = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

/* ------------------------------------------------------------------------- */
/* Validation                                                                 */
/* ------------------------------------------------------------------------- */

export function validateForm({ name, description, documentCategory, jurisdictions, templateId }) {
  const errors = {};

  if (!name || String(name).trim().length < 3) {
    errors.name = 'Give the form a name.';
  } else if (String(name).trim().length > 140) {
    errors.name = 'Keep the name under 140 characters.';
  }

  if (description && String(description).length > 600) {
    errors.description = 'Keep the description under 600 characters.';
  }

  if (!isValidCategory(documentCategory)) {
    errors.documentCategory = 'Choose a document category.';
  }

  if (!Array.isArray(jurisdictions) || jurisdictions.length === 0) {
    errors.jurisdictions = 'Tick at least one jurisdiction where this form is used.';
  } else {
    const unknown = jurisdictions.filter((code) => !getJurisdiction(code)?.launchEnabled);
    if (unknown.length) {
      errors.jurisdictions = `We do not operate in: ${unknown.join(', ')}.`;
    }
  }

  if (!templateId) {
    /* A form with no template could be uploaded but never used: the request
       flow routes by template, so a form that is not bound to one has no path
       through the platform. Caught here rather than discovered by a client. */
    errors.templateId =
      'Bind the form to a document template. The template is what decides who ' +
      'may handle it and where it has effect — a form without one cannot be used.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/* ------------------------------------------------------------------------- */
/* Publishing                                                                 */
/* ------------------------------------------------------------------------- */

export async function publishForm({ buffer, contentType, filename, meta, actor }) {
  const { valid, errors } = validateForm(meta);
  if (!valid) {
    const field = Object.keys(errors)[0];
    throw new FormError('validation_failed', errors[field], 422, field);
  }

  if (!PERMITTED_FORM_TYPES.includes(contentType)) {
    throw new FormError(
      'wrong_type',
      'Standard forms have to be PDFs. The PDF is what gets signed and sealed, ' +
        'so converting a Word file here would mean the executed document is not ' +
        'the form that was published.',
      422,
      'file',
    );
  }

  const normalized = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  if (normalized.byteLength === 0) {
    throw new FormError('empty', 'That file is empty.', 422, 'file');
  }
  if (normalized.byteLength > MAX_FORM_BYTES) {
    throw new FormError(
      'too_large',
      `A blank form should not be larger than ${MAX_FORM_BYTES / 1024 / 1024}MB.`,
      422,
      'file',
    );
  }

  /* The template has to exist and be active, checked rather than trusted — a
     form bound to a deactivated template would be published and unusable. */
  const templateSnapshot = await adminDb()
    .collection('documentTemplates')
    .doc(String(meta.templateId))
    .get();

  if (!templateSnapshot.exists) {
    throw new FormError('no_template', 'That template does not exist.', 422, 'templateId');
  }
  if (templateSnapshot.data().active === false) {
    throw new FormError(
      'template_inactive',
      'That template is deactivated, so a form bound to it could not be used. ' +
        'Reactivate the template first.',
      422,
      'templateId',
    );
  }

  const stored = await uploadBuffer({
    buffer: normalized,
    path: `${FORMS_STORAGE_PREFIX}/${uniqueFilename(filename, 'form.pdf')}`,
    contentType,
    allowedTypes: PERMITTED_FORM_TYPES,
    metadata: { library: 'standard-forms', publishedBy: actor.uid },
  });

  const now = new Date().toISOString();

  const created = await adminDb()
    .collection(FORMS_COLLECTION)
    .add({
      name: String(meta.name).trim(),
      description: String(meta.description ?? '').trim() || null,
      documentCategory: meta.documentCategory,
      jurisdictions: meta.jurisdictions,
      templateId: String(meta.templateId),
      templateName: templateSnapshot.data().name ?? null,

      storagePath: stored.path,
      sizeBytes: stored.bytes,
      contentType,

      active: true,
      /* Bumped on each replacement. A client who downloaded version 1 and a
         client downloading version 3 are not holding the same document, and
         an executed instrument records which version it came from. */
      version: 1,
      timesUsed: 0,

      publishedBy: { uid: actor.uid, email: actor.email },
      createdAt: now,
      updatedAt: now,
    });

  await adminDb()
    .collection('auditLog')
    .add({
      type: 'standard_form_published',
      formId: created.id,
      name: String(meta.name).trim(),
      templateId: String(meta.templateId),
      actorUid: actor.uid,
      actorEmail: actor.email,
      at: now,
    })
    .catch((error) => console.error('[forms] audit write failed', error));

  return { id: created.id, path: stored.path, bytes: stored.bytes };
}

/* ------------------------------------------------------------------------- */
/* Using                                                                      */
/* ------------------------------------------------------------------------- */

/**
 * Copy a library form into an account's own folder.
 *
 * A copy, not a reference. The moment a client is going to sign it, the
 * document is theirs: it must not change under them because the Website
 * Manager published a new version of the form, and the executed instrument has
 * to be traceable to the exact bytes that were signed.
 *
 * The copy counts against the account's quota — at that point it is their
 * document, occupying real space. The library original never does.
 *
 * @returns {Promise<{ storagePath: string, bytes: number, formVersion: number }>}
 */
export async function copyFormForUser({ formId, uid }) {
  const snapshot = await adminDb().collection(FORMS_COLLECTION).doc(String(formId)).get();

  if (!snapshot.exists) {
    throw new FormError('not_found', 'That form is no longer available.', 404);
  }

  const form = snapshot.data();

  if (form.active === false) {
    throw new FormError(
      'inactive',
      'That form has been withdrawn and can no longer be used.',
      409,
    );
  }

  const buffer = await downloadBuffer(form.storagePath);

  const stored = await uploadBuffer({
    buffer,
    /* Under the USER's path, derived from their uid — never from a request —
       so the same rules that guard their own uploads guard this copy. */
    path: `users/${uid}/documents/${uniqueFilename(`${form.name}.pdf`, 'document.pdf')}`,
    contentType: form.contentType ?? 'application/pdf',
    allowedTypes: PERMITTED_FORM_TYPES,
    metadata: { fromStandardForm: String(formId), formVersion: String(form.version ?? 1) },
  });

  /* Best-effort usage counter. Worth having — it is the only signal of which
     forms are worth maintaining — and not worth failing a client's request
     over. */
  await adminDb()
    .collection(FORMS_COLLECTION)
    .doc(String(formId))
    .set({ timesUsed: (form.timesUsed ?? 0) + 1 }, { merge: true })
    .catch(() => {});

  return {
    storagePath: stored.path,
    bytes: stored.bytes,
    formVersion: form.version ?? 1,
    templateId: form.templateId,
    name: form.name,
  };
}

/* ------------------------------------------------------------------------- */
/* Listing                                                                    */
/* ------------------------------------------------------------------------- */

/** The library as a client sees it. No storage paths. */
export async function listForms({ jurisdiction = null, includeInactive = false } = {}) {
  const snapshot = await adminDb().collection(FORMS_COLLECTION).limit(400).get();

  const labels = new Map(DOCUMENT_CATEGORIES.map((c) => [c.value, c.label]));

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name ?? 'Untitled form',
        description: data.description ?? null,
        documentCategory: data.documentCategory ?? null,
        categoryLabel: labels.get(data.documentCategory) ?? data.documentCategory ?? null,
        jurisdictions: data.jurisdictions ?? [],
        templateId: data.templateId ?? null,
        templateName: data.templateName ?? null,
        sizeBytes: data.sizeBytes ?? null,
        version: data.version ?? 1,
        timesUsed: data.timesUsed ?? 0,
        active: data.active !== false,
        createdAt: data.createdAt ?? null,
      };
    })
    .filter((form) => (includeInactive ? true : form.active))
    .filter((form) => (jurisdiction ? form.jurisdictions.includes(jurisdiction) : true))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const formOptions = () => ({
  categories: DOCUMENT_CATEGORIES,
  jurisdictions: listLaunchJurisdictions().map((j) => ({ code: j.code, name: j.name })),
  maxBytes: MAX_FORM_BYTES,
  permittedTypes: PERMITTED_FORM_TYPES,
});

/** Withdraw rather than delete — an executed document may cite this version. */
export async function setFormActive({ formId, active, actor }) {
  const ref = adminDb().collection(FORMS_COLLECTION).doc(String(formId));

  if (!(await ref.get()).exists) {
    throw new FormError('not_found', 'No such form.', 404);
  }

  const now = new Date().toISOString();

  await ref.set(
    { active: Boolean(active), updatedAt: now, updatedBy: { uid: actor.uid, email: actor.email } },
    { merge: true },
  );

  return { ok: true, active: Boolean(active) };
}
