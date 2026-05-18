import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

function sanitizeLabel(value: string | null): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return 'ORG';

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'ORG';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase() || 'ORG';
}

function loadingSvg(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="24" fill="white" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#d7e3f9" stroke-width="8" />
      <path
        d="M32 14a18 18 0 0 1 12.73 5.27"
        fill="none"
        stroke="#4f46e5"
        stroke-linecap="round"
        stroke-width="8"
      >
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from="0 32 32"
          to="360 32 32"
          dur="1s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  `.trim();
}

function initialsSvg(label: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="28" fill="#eef2ff" />
      <text
        x="32"
        y="37"
        text-anchor="middle"
        font-size="18"
        font-family="Arial, sans-serif"
        font-weight="700"
        fill="#3730a3"
      >${label}</text>
    </svg>
  `.trim();
}

function roundImageSvg(dataUrl: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <clipPath id="tenant-favicon-circle">
          <circle cx="32" cy="32" r="28" />
        </clipPath>
      </defs>
      <image
        href="${dataUrl}"
        x="4"
        y="4"
        width="56"
        height="56"
        preserveAspectRatio="xMidYMid slice"
        clip-path="url(#tenant-favicon-circle)"
      />
    </svg>
  `.trim();
}

function asSvgResponse(svg: string, cacheControl: string) {
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  });
}

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get('src');
  const version = request.nextUrl.searchParams.get('v');
  const label = sanitizeLabel(request.nextUrl.searchParams.get('label'));

  if (!src) {
    return asSvgResponse(loadingSvg(), 'no-store');
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return asSvgResponse(initialsSvg(label), 'no-store');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return asSvgResponse(initialsSvg(label), 'no-store');
  }

  try {
    // Cache the upstream image fetch on the server side.
    // The `v` param (org.updatedAt) acts as a cache-busting key — when the
    // org logo changes, TenantProvider generates a new URL with a new `v`,
    // so we can safely cache the image for a long time.
    const upstream = await fetch(url.toString(), {
      next: { revalidate: 86_400 }, // 24 h server-side cache
      headers: { Accept: 'image/*' },
    });

    if (!upstream.ok) {
      return asSvgResponse(initialsSvg(label), 'no-store');
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const mimeType = upstream.headers.get('content-type')?.split(';')[0] || 'image/png';
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // When `v` is present the URL is versioned — safe to cache immutably in
    // the browser. Without `v`, fall back to a short cache.
    const cacheControl = version
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=60';

    return asSvgResponse(roundImageSvg(dataUrl), cacheControl);
  } catch {
    return asSvgResponse(initialsSvg(label), 'no-store');
  }
}
