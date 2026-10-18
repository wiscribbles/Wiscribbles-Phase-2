/**
 * Prepare & Register — the client side.
 *
 *   GET                                  → options, the fee, the versioned notice
 *   GET ?jurisdiction=&category=         → is this eligible, and why
 *   GET ?mine=1                          → this client's own requests
 *   POST                                 → create one
 *
 * Eligibility is checked server-side both here and inside `createRequest`,
 * because the paper route must never be sold for a document that could have
 * been notarised online — that would be charging someone for a slower service
 * they did not need.
 */

import { NextResponse } from 'next/server';
import { authErrorResponse, requireApiUser } from '@/lib/auth/server';
import {
  DELIVERY_OPTIONS,
  PR_NOTICE,
  PrepareRegisterError,
  checkEligibility,
  createRequest,
  excludedCatalogue,
  listForClient,
} from '@/lib/prepareRegister';
import { prepareRegisterFee } from '@/lib/fees';
import { DOCUMENT_CATEGORIES } from '@/lib/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function prError(error) {
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

    if (searchParams.get('mine') === '1') {
      return NextResponse.json({ requests: await listForClient(user.uid) });
    }

    const jurisdiction = searchParams.get('jurisdiction');
    const category = searchParams.get('category');

    if (jurisdiction && category) {
      return NextResponse.json(
        checkEligibility({ jurisdiction, documentCategory: category }),
      );
    }

    return NextResponse.json({
      options: {
        notice: PR_NOTICE,
        fee: prepareRegisterFee(),
        delivery: DELIVERY_OPTIONS,
        categories: DOCUMENT_CATEGORIES,
        /* Which jurisdiction excludes what, from the registry rather than a
           hand-written list — so when counsel confirms the gazetted schedule
           and `lib/jurisdictions.js` changes, this page changes with it. */
        catalogue: excludedCatalogue(),
      },
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

    try {
      const result = await createRequest({
        client: user,
        documentCategory: String(body?.documentCategory ?? ''),
        jurisdiction: String(body?.jurisdiction ?? ''),
        delivery: String(body?.delivery ?? ''),
        details: body?.details ?? '',
        noticeVersion: String(body?.noticeVersion ?? ''),
      });

      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      if (error instanceof PrepareRegisterError) return prError(error);
      throw error;
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}
