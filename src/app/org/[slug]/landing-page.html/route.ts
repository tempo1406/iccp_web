import { NextResponse } from 'next/server';
import type { LandingPageDto } from '@/features/tenant/landing-page-builder/types/landing-page.types';
import { normalizeLandingPageHtmlForPublicRender } from '@/features/tenant/landing-page-builder/utils/public-html';

interface Context {
  params: Promise<{ slug: string }>;
}

function extractHtml(data: LandingPageDto, slug: string): string {
  return normalizeLandingPageHtmlForPublicRender(data.rawHtml ?? '', {
    orgSlug: slug,
  });
}

export async function GET(_req: Request, { params }: Context) {
  try {
    const { slug } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333/api';
    const apiUrl = `${baseUrl}/v1/organizations/${slug}/landing-page`;

    const res = await fetch(apiUrl, { cache: 'no-store' });

    if (!res.ok) {
      console.error(`[landing-page.html] API returned ${res.status} for ${apiUrl}`);
      return new NextResponse('Page not found', { status: 404 });
    }

    const text = await res.text();
    let json: { data?: LandingPageDto | null };
    try {
      json = JSON.parse(text) as { data?: LandingPageDto | null };
    } catch {
      console.error('[landing-page.html] Failed to parse API response:', text.slice(0, 500));
      return new NextResponse('Internal error', { status: 500 });
    }

    const data = json.data;

    if (!data) {
      console.warn('[landing-page.html] No data in response:', text.slice(0, 500));
      return new NextResponse('This organization has not published a landing page yet.', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const html = extractHtml(data, slug);
    if (!html) {
      return new NextResponse('This organization has not published a landing page yet.', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[landing-page.html] Unexpected error:', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
