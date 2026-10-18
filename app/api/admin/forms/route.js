/**
 * The standard forms library — Website Manager side.
 *
 *   GET                             → every form, including withdrawn ones
 *   POST  multipart/form-data       → publish a form
 *   PATCH { id, active }            → withdraw or restore
 *
 * Withdraw, never delete. An executed instrument records which form and which
 * version it came from, and removing the form would orphan that reference —
 * exactly the record an audit would want.
 *
 * Multipart rather than JSON because this carries a file. The file is read into
 * memory, size-checked and type-checked before anything reaches the bucket.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApiAdmin } from '@/lib/auth/server';
import {
  FormError,
  MAX_FORM_BYTES,
  PERMITTED_FORM_TYPES,
  formOptions,
  listForms,
  publishForm,
  setFormActive,
} from '@/lib/forms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireApiAdmin();

    const [forms, templatesSnapshot] = await Promise.all([
      listForms({ includeInactive: true }),
      adminDb().collection('documentTemplates').where('active', '==', true).limit(300).get(),
    ]);

    return NextResponse.json({
      forms,
      options: {
        ...formOptions(),
        /* The templates a form can bind to. Only active ones: binding a form
           to a deactivated template would publish something unusable. */
        templates: templatesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name ?? 'Untitled template',
          documentCategory: doc.data().documentCategory ?? null,
          jurisdictions: doc.data().jurisdictions ?? [],
          executionMode: doc.data().executionMode ?? null,
        })),
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const admin = await requireApiAdmin();

    let form;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const file = form.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json(
        { error: 'no_file', message: 'Choose a PDF to publish.', field: 'file' },
        { status: 422 },
      );
    }

    const contentType = file.type || 'application/octet-stream';

    if (!PERMITTED_FORM_TYPES.includes(contentType)) {
      return NextResponse.json(
        {
          error: 'wrong_type',
          field: 'file',
          message:
            'Standard forms have to be PDFs. The PDF is what gets signed and ' +
            'sealed, so a Word file converted here would mean the executed ' +
            'document is not the form that was published.',
        },
        { status: 422 },
      );
    }

    /* The header first, to reject an obviously oversized file without reading
       it; the real length is checked inside `publishForm`, because the header
       is client-supplied. */
    if (typeof file.size === 'number' && file.size > MAX_FORM_BYTES) {
      return NextResponse.json(
        {
          error: 'too_large',
          field: 'file',
          message: `A blank form should not exceed ${MAX_FORM_BYTES / 1024 / 1024}MB.`,
        },
        { status: 413 },
      );
    }

    let jurisdictions = [];
    try {
      const raw = form.get('jurisdictions');
      jurisdictions = raw ? JSON.parse(String(raw)) : [];
    } catch {
      jurisdictions = [];
    }

    try {
      const result = await publishForm({
        buffer: Buffer.from(await file.arrayBuffer()),
        contentType,
        filename: file.name ?? 'form.pdf',
        meta: {
          name: form.get('name'),
          description: form.get('description'),
          documentCategory: form.get('documentCategory'),
          templateId: form.get('templateId'),
          jurisdictions: Array.isArray(jurisdictions) ? jurisdictions.map(String) : [],
        },
        actor: { uid: admin.uid, email: admin.email },
      });

      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      if (error instanceof FormError) {
        return NextResponse.json(
          { error: error.code, message: error.message, ...(error.field ? { field: error.field } : {}) },
          { status: error.status },
        );
      }
      throw error;
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const admin = await requireApiAdmin();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const id = String(body?.id ?? '');
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    if (typeof body?.active !== 'boolean') {
      return NextResponse.json(
        {
          error: 'unsupported',
          message:
            'Only withdrawal can be changed here. To change a form’s contents, ' +
            'publish a new one — an executed document cites the version it came ' +
            'from, so editing in place would rewrite history.',
        },
        { status: 400 },
      );
    }

    try {
      const result = await setFormActive({
        formId: id,
        active: body.active,
        actor: { uid: admin.uid, email: admin.email },
      });

      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      if (error instanceof FormError) {
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: error.status },
        );
      }
      throw error;
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}
