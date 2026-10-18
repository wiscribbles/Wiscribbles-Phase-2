/**
 * The File Manager — an account's document repository.
 *
 *   GET  → this account's documents, filterable
 *   GET  ?download=<id>  → a short-lived signed URL for one document
 *   PATCH → archive / restore  ({ id, archived: boolean })
 *
 * WHY DOWNLOADS ARE SIGNED URLS AND NOT STORAGE READS
 *
 * `storage.rules` deliberately does not grant read access to document objects.
 * It would be easier to let the client read the file straight from Storage with
 * its own credentials, and the rule would be short. But a notarised document is
 * the kind of object whose access needs to be decided per request and recorded
 * — who asked, for which document, when — and a Storage rule cannot record
 * anything. So a read goes through here, which checks ownership, mints a URL
 * valid for ten minutes, and leaves a trail.
 *
 * WHY NOTHING IS DELETED
 *
 * A signed or notarised document is evidence. Its existence, and the record of
 * who executed it under which template, may be needed years later by a party
 * who is not the account holder — or by a court. Archiving hides it from the
 * list; it does not remove it. An account holder who genuinely needs a document
 * destroyed raises it with the Website Manager, where it is a decision with a
 * record rather than a button with a confirmation dialog.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authErrorResponse, requireApiUser } from '@/lib/auth/server';
import { getSignedUrl } from '@/lib/storage/server';
import { DOCUMENT_CATEGORIES } from '@/lib/templates';
import { listLaunchJurisdictions } from '@/lib/jurisdictions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOWNLOAD_TTL_MS = 10 * 60 * 1000;
const PAGE_SIZE = 50;

const DOCUMENT_STATUS_OPTIONS = Object.freeze([
  { value: 'draft', label: 'Draft' },
  { value: 'awaiting_signature', label: 'Awaiting signature' },
  { value: 'awaiting_notarisation', label: 'Awaiting notarisation' },
  { value: 'signed', label: 'Signed' },
  { value: 'notarised', label: 'Notarised' },
  { value: 'revoked', label: 'Revoked' },
]);

function shape(id, data) {
  return {
    id,
    name: data?.name ?? data?.fileName ?? 'Untitled document',
    status: data?.status ?? 'draft',
    documentCategory: data?.documentCategory ?? null,
    jurisdiction: data?.jurisdiction ?? null,
    templateId: data?.templateId ?? null,
    templateName: data?.templateName ?? null,
    sizeBytes: data?.sizeBytes ?? null,
    pageCount: data?.pageCount ?? null,
    archived: Boolean(data?.archived),
    createdAt: data?.createdAt ?? null,
    updatedAt: data?.updatedAt ?? null,
    executedAt: data?.executedAt ?? null,
    /* No storage path. The client has no use for it — downloads are signed
       here — and publishing it invites someone to try it directly. */
  };
}

export async function GET(request) {
  try {
    const user = await requireApiUser();
    const { searchParams } = new URL(request.url);

    /* ---- single download ---------------------------------------------- */
    const downloadId = searchParams.get('download');

    if (downloadId) {
      const snapshot = await adminDb().collection('documents').doc(downloadId).get();

      if (!snapshot.exists) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
      }

      const data = snapshot.data();
      const signerIds = Array.isArray(data.signerIds) ? data.signerIds : [];

      /* The same parties the Firestore rule allows, kept in step with it by
         hand because a route handler runs with Admin credentials and is not
         subject to the rules at all. */
      const permitted =
        data.ownerId === user.uid ||
        signerIds.includes(user.uid) ||
        data.assignedProfessionalId === user.uid;

      if (!permitted) {
        // 404, not 403 — a 403 confirms the document exists.
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
      }

      const path = data.stampedPath ?? data.storagePath ?? null;
      if (!path) {
        return NextResponse.json(
          { error: 'no_file', message: 'That document has no file attached yet.' },
          { status: 409 },
        );
      }

      const url = await getSignedUrl(path, DOWNLOAD_TTL_MS);
      const now = new Date().toISOString();

      await adminDb()
        .collection('auditLog')
        .add({
          type: 'document_downloaded',
          documentId: downloadId,
          actorUid: user.uid,
          actorEmail: user.email,
          actorRole: user.role,
          at: now,
        })
        .catch((error) => console.error('[files] audit write failed', error));

      return NextResponse.json({ url, expiresInMs: DOWNLOAD_TTL_MS });
    }

    /* ---- the list ------------------------------------------------------ */
    const status = searchParams.get('status');
    const jurisdiction = searchParams.get('jurisdiction');
    const showArchived = searchParams.get('archived') === 'true';

    let query = adminDb().collection('documents').where('ownerId', '==', user.uid);

    if (status) query = query.where('status', '==', status);
    if (jurisdiction) query = query.where('jurisdiction', '==', jurisdiction);

    const snapshot = await query.orderBy('createdAt', 'desc').limit(PAGE_SIZE * 2).get();

    /* Archived is filtered in memory rather than in the query. Adding it as a
       third equality filter would need another composite index for every
       combination of the filters above, and the page size is small. */
    const documents = snapshot.docs
      .map((doc) => shape(doc.id, doc.data()))
      .filter((document) => document.archived === showArchived)
      .slice(0, PAGE_SIZE);

    /* A free-text search is applied here too, for the same reason: Firestore
       has no substring matching, so a `name` search means either a prefix query
       (useless for "find the Smith affidavit") or a search service. Filtering
       the current page is honest about its limits — the UI says it searches the
       documents shown. */
    const search = searchParams.get('q')?.trim().toLowerCase();
    const filtered = search
      ? documents.filter((document) => document.name.toLowerCase().includes(search))
      : documents;

    return NextResponse.json({
      documents: filtered,
      truncated: snapshot.size >= PAGE_SIZE * 2,
      options: {
        statuses: DOCUMENT_STATUS_OPTIONS,
        categories: DOCUMENT_CATEGORIES,
        jurisdictions: listLaunchJurisdictions().map((j) => ({ code: j.code, name: j.name })),
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const user = await requireApiUser();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const id = String(body?.id ?? '');
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    if (typeof body?.archived !== 'boolean') {
      return NextResponse.json(
        {
          error: 'unsupported',
          message:
            'Only archiving can be changed here. A document’s contents, ' +
            'template and status are set by the workflow that produced it.',
        },
        { status: 400 },
      );
    }

    const ref = adminDb().collection('documents').doc(id);
    const snapshot = await ref.get();

    if (!snapshot.exists || snapshot.data().ownerId !== user.uid) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    await ref.set({ archived: body.archived, updatedAt: now }, { merge: true });

    return NextResponse.json({ ok: true, archived: body.archived });
  } catch (error) {
    return authErrorResponse(error);
  }
}
