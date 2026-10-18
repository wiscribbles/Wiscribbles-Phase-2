/**
 * The Website Manager's document repository.
 *
 *   GET  → the filtered listing, plus filter options
 *   GET  ?audit=<id>     → one document's audit trail
 *   GET  ?download=<id>  → a 10-minute signed URL, recorded
 *   POST → { id, action: 'flag' | 'unflag' | 'revoke', ... }
 *
 * An admin download is audited exactly like a party's. The Website Manager
 * having legitimate access to every document is not a reason to stop recording
 * which ones they opened — if anything it is the reason to start, because
 * theirs is the account with no natural limit on what it can read.
 */

import { NextResponse } from 'next/server';
import { authErrorResponse, requireApiAdmin } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSignedUrl } from '@/lib/storage/server';
import {
  RepositoryError,
  auditTrailFor,
  flagDocument,
  listDocuments,
  repositoryFilterOptions,
  revokeDocument,
  unflagDocument,
} from '@/lib/admin/documents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOWNLOAD_TTL_MS = 10 * 60 * 1000;
const ACTIONS = ['flag', 'unflag', 'revoke'];

export async function GET(request) {
  try {
    const admin = await requireApiAdmin();
    const { searchParams } = new URL(request.url);

    /* ---- one document's history ---------------------------------------- */
    const auditId = searchParams.get('audit');
    if (auditId) {
      return NextResponse.json({ events: await auditTrailFor(auditId) });
    }

    /* ---- download ------------------------------------------------------ */
    const downloadId = searchParams.get('download');
    if (downloadId) {
      const snapshot = await adminDb().collection('documents').doc(downloadId).get();

      if (!snapshot.exists) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
      }

      const data = snapshot.data();
      const path = data.stampedPath ?? data.storagePath ?? null;

      if (!path) {
        return NextResponse.json(
          { error: 'no_file', message: 'That document has no file attached.' },
          { status: 409 },
        );
      }

      const url = await getSignedUrl(path, DOWNLOAD_TTL_MS);
      const at = new Date().toISOString();

      await adminDb()
        .collection('auditLog')
        .add({
          type: 'document_downloaded',
          documentId: downloadId,
          actorUid: admin.uid,
          actorEmail: admin.email,
          actorRole: 'admin',
          // Marked, so a later review can tell a manager's access apart from a
          // party's without cross-referencing every uid against the user list.
          byWebsiteManager: true,
          at,
        })
        .catch((error) => console.error('[admin/documents] audit write failed', error));

      return NextResponse.json({ url, expiresInMs: DOWNLOAD_TTL_MS });
    }

    /* ---- the listing --------------------------------------------------- */
    const result = await listDocuments({
      jurisdiction: searchParams.get('jurisdiction') ?? null,
      partnerType: searchParams.get('partnerType') ?? null,
      accountName: searchParams.get('accountName') ?? null,
      status: searchParams.get('status') ?? null,
      flaggedOnly: searchParams.get('flagged') === 'true',
    });

    return NextResponse.json({ ...result, options: repositoryFilterOptions() });
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

    const id = String(body?.id ?? '').trim();
    const action = String(body?.action ?? '');

    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
    }

    const actor = { uid: admin.uid, email: admin.email, role: 'admin' };

    try {
      if (action === 'flag') {
        return NextResponse.json(
          await flagDocument({
            documentId: id,
            reason: String(body?.reason ?? ''),
            note: body?.note ?? null,
            actor,
          }),
        );
      }

      if (action === 'unflag') {
        return NextResponse.json(await unflagDocument({ documentId: id, actor }));
      }

      return NextResponse.json(
        await revokeDocument({
          documentId: id,
          ground: String(body?.ground ?? ''),
          note: body?.note ?? null,
          actor,
        }),
      );
    } catch (error) {
      if (error instanceof RepositoryError) {
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
