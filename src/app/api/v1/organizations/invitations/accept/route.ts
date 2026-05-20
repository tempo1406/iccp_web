import { NextRequest, NextResponse } from 'next/server';
import { ROUTES } from '@/common/constant/routes';

function buildInviteAcceptUrl(request: NextRequest): URL {
  const targetUrl = request.nextUrl.clone();
  targetUrl.pathname = ROUTES.inviteAccept;
  return targetUrl;
}

export function GET(request: NextRequest) {
  return NextResponse.redirect(buildInviteAcceptUrl(request));
}
