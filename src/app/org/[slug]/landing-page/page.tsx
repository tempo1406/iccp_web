import type { Metadata } from 'next';
import type { LandingPageDto } from '@/features/tenant/landing-page-builder/types/landing-page.types';
import { normalizeLandingPageHtmlForPublicRender } from '@/features/tenant/landing-page-builder/utils/public-html';

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchLandingPage(slug: string): Promise<LandingPageDto | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333/api';
    const res = await fetch(`${baseUrl}/v1/organizations/${slug}/landing-page`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json() as { data?: LandingPageDto | null };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} — Landing Page` };
}

export default async function OrgLandingPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchLandingPage(slug);
  const html = normalizeLandingPageHtmlForPublicRender(data?.rawHtml ?? '', {
    orgSlug: slug,
  });

  if (!data || !html.trim()) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <p>This organization has not published a landing page yet.</p>
      </div>
    );
  }

  return (
    <iframe
      title={`${slug} landing page`}
      className="h-screen w-full border-none"
      srcDoc={html}
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    />
  );
}
