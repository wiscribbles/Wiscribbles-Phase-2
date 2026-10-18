/**
 * Prepare & Register — the Website Manager's queue.
 *
 *   GET  ?status=       → the queue, oldest first
 *   POST { id, toStatus, note? } → advance one
 *
 * Oldest first, because these are people waiting on a document they cannot get
 * any other way: the whole reason this product exists is that the electronic
 * route is closed to them.
 */

import { NextResponse } from 'next/server';
import { authErrorResponse, requireApiAdmin } from '@/lib/auth/server';
import {
  PR_STATUS,
  PR_STATUS_LABELS,
  PrepareRegisterError,
  advance,
  listForAdmin,
} from '@/lib/prepareRegister';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await requireApiAdmin();
    const status = new URL(request.url).searchParams.get('status');

    return NextResponse.json({
      requests: await listForAdmin({ status: status || null }),
      statuses: Object.values(PR_STATUS).map((value) => ({
        value,
        label: PR_STATUS_LABELS[value],
      })),
    });
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

    try {
      const result = await advance({
        id: String(body?.id ?? ''),
        toStatus: String(body?.toStatus ?? ''),
        note: body?.note ?? null,
        actor: { uid: admin.uid, email: admin.email },
      });

      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      if (error instanceof PrepareRegisterError) {
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
