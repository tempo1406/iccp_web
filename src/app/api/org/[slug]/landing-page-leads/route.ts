import { NextRequest, NextResponse } from 'next/server';
import type { SubmitLandingPageLeadBody } from '@/features/tenant/landing-page-builder/types/landing-page.types';

interface Context {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { slug } = await params;
    const payload = (await request.json()) as SubmitLandingPageLeadBody;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333/api';
    const response = await fetch(`${baseUrl}/v1/organizations/${slug}/landing-page-leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const text = await response.text();
    const contentType = response.headers.get('content-type') ?? 'application/json; charset=utf-8';

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[landing-page-leads] Unexpected error:', error);
    return NextResponse.json(
      {
        statusCode: 500,
        message: 'Failed to submit landing page lead.',
        data: null,
      },
      { status: 500 },
    );
  }
}
