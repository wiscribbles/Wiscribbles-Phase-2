/**
 * Document templates — Website Manager only.
 *
 *   GET    → all templates
 *   POST   → create
 *   PATCH  → update, or activate/deactivate
 *   DELETE → deactivate (never a hard delete)
 *
 * Templates are never hard-deleted. Signed documents reference the template
 * they were executed under, and removing it would orphan the record of what
 * rules applied at the time — which is exactly what an audit or a challenge
 * would need to see.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApiAdmin } from '@/lib/auth/server';
import {
  DOCUMENT_CATEGORIES,
  EXECUTION_MODE,
  TEMPLATE_ROLES,
  selectableJurisdictionsForTemplates,
  validateTemplate,
} from '@/lib/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COLLECTION = 'documentTemplates';

/** Shape for the admin form, so the UI never hardcodes these lists. */
function formOptions() {
  return {
    categories: DOCUMENT_CATEGORIES,
    executionModes: [
      { value: EXECUTION_MODE.ESIGN, label: 'E-signature only' },
      { value: EXECUTION_MODE.NOTARIZED, label: 'Requires notarisation or commissioning' },
    ],
    roles: TEMPLATE_ROLES.map((role) => ({
      value: role,
      label: role === 'notary' ? 'Notary Public' : 'Commissioner of Oaths',
    })),
    jurisdictions: selectableJurisdictionsForTemplates(),
  };
}

export async function GET() {
  try {
    await requireApiAdmin();

    const snapshot = await adminDb().collection(COLLECTION).limit(500).get();

    const templates = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));

    return NextResponse.json({ templates, options: formOptions() });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const admin = await requireApiAdmin();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const candidate = {
      name: String(body?.name ?? '').trim(),
      description: String(body?.description ?? '').trim(),
      documentCategory: String(body?.documentCategory ?? ''),
      executionMode: String(body?.executionMode ?? ''),
      roles: Array.isArray(body?.roles) ? body.roles.map(String) : [],
      jurisdictions: Array.isArray(body?.jurisdictions) ? body.jurisdictions.map(String) : [],
    };

    const { valid, errors, warnings } = validateTemplate(candidate);
    if (!valid) {
      return NextResponse.json({ error: 'validation_failed', errors }, { status: 422 });
    }

    const now = new Date().toISOString();

    const created = await adminDb()
      .collection(COLLECTION)
      .add({
        ...candidate,
        // E-signature templates carry no roles, whatever was ticked.
        roles: candidate.executionMode === EXECUTION_MODE.NOTARIZED ? candidate.roles : [],
        active: true,
        createdAt: now,
        updatedAt: now,
        createdBy: { uid: admin.uid, email: admin.email },
      });

    await adminDb()
      .collection('auditLog')
      .add({
        type: 'template_created',
        templateId: created.id,
        name: candidate.name,
        actorUid: admin.uid,
        actorEmail: admin.email,
        at: now,
      })
      .catch((error) => console.error('[admin/templates] audit write failed', error));

    return NextResponse.json({ ok: true, id: created.id, warnings });
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
    if (!id) {
      return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    }

    const ref = adminDb().collection(COLLECTION).doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Activate / deactivate on its own needs no revalidation.
    if (Object.keys(body).length === 2 && typeof body.active === 'boolean') {
      await ref.set({ active: body.active, updatedAt: now }, { merge: true });
      return NextResponse.json({ ok: true, active: body.active });
    }

    const existing = snapshot.data();
    const candidate = {
      name: String(body.name ?? existing.name ?? '').trim(),
      description: String(body.description ?? existing.description ?? '').trim(),
      documentCategory: String(body.documentCategory ?? existing.documentCategory ?? ''),
      executionMode: String(body.executionMode ?? existing.executionMode ?? ''),
      roles: Array.isArray(body.roles) ? body.roles.map(String) : (existing.roles ?? []),
      jurisdictions: Array.isArray(body.jurisdictions)
        ? body.jurisdictions.map(String)
        : (existing.jurisdictions ?? []),
    };

    const { valid, errors, warnings } = validateTemplate(candidate);
    if (!valid) {
      return NextResponse.json({ error: 'validation_failed', errors }, { status: 422 });
    }

    await ref.set(
      {
        ...candidate,
        roles: candidate.executionMode === EXECUTION_MODE.NOTARIZED ? candidate.roles : [],
        ...(typeof body.active === 'boolean' ? { active: body.active } : {}),
        updatedAt: now,
        updatedBy: { uid: admin.uid, email: admin.email },
      },
      { merge: true },
    );

    await adminDb()
      .collection('auditLog')
      .add({
        type: 'template_updated',
        templateId: id,
        name: candidate.name,
        actorUid: admin.uid,
        actorEmail: admin.email,
        at: now,
      })
      .catch((error) => console.error('[admin/templates] audit write failed', error));

    return NextResponse.json({ ok: true, warnings });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    const admin = await requireApiAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    const ref = adminDb().collection(COLLECTION).doc(id);
    if (!(await ref.get()).exists) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    // Deactivate, never remove — signed documents reference the template they
    // were executed under, and that record has to survive.
    const now = new Date().toISOString();
    await ref.set(
      { active: false, deactivatedAt: now, updatedAt: now, updatedBy: { uid: admin.uid, email: admin.email } },
      { merge: true },
    );

    return NextResponse.json({ ok: true, deactivated: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
