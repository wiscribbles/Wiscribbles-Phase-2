/**
 * The client's request for service.
 *
 *   GET                       → the wizard's options and versioned notice text
 *   GET ?jurisdiction=&service= → the templates available, and why others are not
 *   GET ?status=<documentId>  → where this client's own request stands
 *   POST                      → submit; creates the document and the queue entry
 *
 * The upload is verified against Storage before anything is written. The path
 * is checked against the SESSION's uid rather than anything in the request, so
 * a path pointing into another account's folder cannot attach their file to
 * this request.
 */

import { NextResponse } from 'next/server';
import { authErrorResponse, requireApiUser } from '@/lib/auth/server';
import { verifyUploadedObject } from '@/lib/storage/server';
import {
  RequestError,
  requestOptions,
  requestStatusFor,
  selectableFor,
  submitRequest,
} from '@/lib/clientRequests';
import { FeeError, quote } from '@/lib/fees';
import { SigningError } from '@/lib/signing';
import { remoteWitnessingEnabled } from '@/lib/jurisdictions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** PDFs only for an executable instrument. See the note in POST. */
const PERMITTED_TYPES = ['application/pdf'];

function requestError(error) {
  return NextResponse.json(
    {
      error: error.code,
      message: error.message,
      ...(error.field ? { field: error.field } : {}),
    },
    { status: error.status },
  );
}

export async function GET(request) {
  try {
    const user = await requireApiUser();
    const { searchParams } = new URL(request.url);

    const statusOf = searchParams.get('status');
    if (statusOf) {
      const status = await requestStatusFor({ uid: user.uid, documentId: statusOf });
      if (!status) return NextResponse.json({ error: 'not_found' }, { status: 404 });
      return NextResponse.json({ status });
    }

    /* A live quote as the wizard is filled in. Server-side rather than
       computed in the browser, so what the client is shown is the same
       calculation that will be charged — and the price list cannot be edited
       in devtools before submission. */
    if (searchParams.get('quote') === '1') {
      try {
        return NextResponse.json({
          quote: quote({
            notarized: searchParams.get('notarized') === 'true',
            signatories: Number(searchParams.get('signatories') ?? 1),
            witnesses: Number(searchParams.get('witnesses') ?? 0),
            seals: Number(searchParams.get('seals') ?? 1),
            witnessingAvailable: remoteWitnessingEnabled(
              searchParams.get('jurisdiction') ?? '',
            ),
          }),
        });
      } catch (error) {
        if (error instanceof FeeError) {
          return NextResponse.json(
            { error: error.code, message: error.message, field: error.field },
            { status: 422 },
          );
        }
        throw error;
      }
    }

    const jurisdiction = searchParams.get('jurisdiction');
    const service = searchParams.get('service');

    if (jurisdiction && service) {
      try {
        return NextResponse.json(
          await selectableFor({ jurisdiction, requestedService: service }),
        );
      } catch (error) {
        if (error instanceof RequestError) return requestError(error);
        throw error;
      }
    }

    return NextResponse.json({ options: requestOptions() });
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

    const storagePath = String(body?.storagePath ?? '');

    /* The path must sit under this session's own folder. Checked here as well
       as in submitRequest, because this is where the file is read: verifying an
       object that belongs to someone else would leak its size and type even if
       the write were later refused. */
    if (!storagePath.startsWith(`users/${user.uid}/`)) {
      return NextResponse.json(
        {
          error: 'bad_upload',
          field: 'document',
          message: 'That upload could not be verified. Upload the document again.',
        },
        { status: 422 },
      );
    }

    /* PDF only, deliberately. A Word file would have to be converted before it
       could be stamped, and a conversion step between what the client approved
       and what the notary seals is a gap nobody can audit — the executed
       instrument would not be the file that was uploaded. Asking for a PDF is
       a small inconvenience against that. */
    const verified = await verifyUploadedObject(storagePath, {
      allowedTypes: PERMITTED_TYPES,
    });

    if (!verified.exists) {
      return NextResponse.json(
        {
          error: 'upload_missing',
          field: 'document',
          message: 'We could not find that upload. Please upload the document again.',
        },
        { status: 422 },
      );
    }

    if (verified.error) {
      return NextResponse.json(
        {
          error: 'upload_rejected',
          field: 'document',
          message:
            verified.contentType && !PERMITTED_TYPES.includes(verified.contentType)
              ? 'The document has to be a PDF. A PDF is what gets sealed, so ' +
                'converting it here would mean the executed document is not ' +
                'the file you uploaded.'
              : verified.error,
        },
        { status: 422 },
      );
    }

    try {
      const result = await submitRequest({
        client: user,
        jurisdiction: String(body?.jurisdiction ?? ''),
        requestedService: String(body?.requestedService ?? ''),
        templateId: String(body?.templateId ?? ''),
        storagePath,
        name: body?.name ?? null,
        sizeBytes: verified.bytes ?? null,
        pageCount: Number.isInteger(body?.pageCount) ? body.pageCount : null,
        signatories: Number(body?.signatories ?? 1),
        witnesses: Number(body?.witnesses ?? 0),
        seals: Number(body?.seals ?? 1),
        parties: Array.isArray(body?.parties) ? body.parties : [],
        acceptances: {
          termsVersion: String(body?.acceptances?.termsVersion ?? ''),
          disclaimerVersion: String(body?.acceptances?.disclaimerVersion ?? ''),
        },
      });

      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      if (error instanceof RequestError) return requestError(error);
      /* buildParties throws on a bad or duplicated email address. Surfaced as
         a field error so the wizard can point at the party list rather than
         showing a generic failure. */
      if (error instanceof SigningError) {
        return NextResponse.json(
          { error: error.code, message: error.message, field: error.field ?? 'parties' },
          { status: error.status },
        );
      }
      throw error;
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}
