import { NextRequest, NextResponse } from 'next/server';

const TENANT_REQUIRED_ROOTS = new Set([
  'chatbot',
  'team-chat',
  'documents',
  'project',
  'projects',
  'analytics',
  'billing',
  'ticket',
  'settings',
  'profile',
  'notifications',
  'admin',
  'users',
  'salary-management',
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return NextResponse.next();
  }

  const [firstSegment] = segments;
  if (!TENANT_REQUIRED_ROOTS.has(firstSegment)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/dashboard';

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
