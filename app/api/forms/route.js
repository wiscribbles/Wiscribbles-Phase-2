/**
 * The standard forms library, for everyone.
 *
 *   GET  ?jurisdiction=       → the published forms
 *   GET  ?preview=<id>        → a short-lived URL to read one before using it
 *   POST { formId }           → take a copy into your own repository
 *
 * Preview is separate from taking a copy, deliberately. Someone deciding
 * whether the short-form affidavit is the one they need should be able to read
 * it without it landing in their repository and counting against their quota.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApiUser } from '@/lib/auth/server';
import { getSignedUrl } from '@/lib/storage/server';
import { FormError, copyFormForUser, listForms } from '@/lib/forms';
import { QuotaError, assertRoomFor, describeUsage, usageFor } from '@/lib/quota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PREVIEW_TTL_MS = 15 * 60 * 1000;

export async function GET(request) {
  try {
    const user = await requireApiUser();
    const { searchParams } = new URL(request.url);

    /* ---- preview one ---- */
    const previewId = searchParams.get('preview');
    if (previewId) {
      const snapshot = await adminDb().collection('standardForms').doc(previewId).get();

      if (!snapshot.exists || snapshot.data().active === false) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
      }

      const url = await getSignedUrl(snapshot.data().storagePath, PREVIEW_TTL_MS);
      return NextResponse.json({ url, expiresInMs: PREVIEW_TTL_MS });
    }

    /* ---- the library, plus where the account stands on space ---- */
    const [forms, usage] = await Promise.all([
      listForms({ jurisdiction: searchParams.get('jurisdiction') || null }),
      usageFor({ uid: user.uid, planId: user.planId ?? null }),
    ]);

    return NextResponse.json({
      forms,
      /* Shown alongside the library because taking a copy consumes space, and
         finding that out at the moment of refusal is worse than knowing. */
      usage: describeUsage(usage),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireApiUser();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const formId = String(body?.formId ?? '');
    if (!formId) {
      return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    }

    try {
      /* Check for room BEFORE copying. The library file's size is known, so
         there is no reason to copy the bytes and then discover there is
         nowhere to put them. */
      const snapshot = await adminDb().collection('standardForms').doc(formId).get();

      if (!snapshot.exists || snapshot.data().active === false) {
        return NextResponse.json(
          { error: 'not_found', message: 'That form is no longer available.' },
          { status: 404 },
        );
      }

      await assertRoomFor({
        uid: user.uid,
        planId: user.planId ?? null,
        role: user.role,
        bytes: Number(snapshot.data().sizeBytes ?? 0),
      });

      const copy = await copyFormForUser({ formId, uid: user.uid });

      return NextResponse.json({
        ok: true,
        ...copy,
        /* The path and the template, so the request wizard can carry straight
           on from here rather than making the client upload what they have
           just been given. */
        next: {
          storagePath: copy.storagePath,
          templateId: copy.templateId,
          name: copy.name,
        },
      });
    } catch (error) {
      if (error instanceof QuotaError || error instanceof FormError) {
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
