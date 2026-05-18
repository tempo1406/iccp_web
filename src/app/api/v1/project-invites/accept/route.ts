import { NextRequest, NextResponse } from 'next/server';
import { ROUTES } from '@/common/constant/routes';

function buildProjectInviteAcceptUrl(request: NextRequest): URL {
  const targetUrl = request.nextUrl.clone();
  targetUrl.pathname = ROUTES.projectInviteAccept;
  return targetUrl;
}

export function GET(request: NextRequest) {
  return NextResponse.redirect(buildProjectInviteAcceptUrl(request));
}
