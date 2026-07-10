import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token && (await verifySessionToken(token))) return NextResponse.next();
  const login = new URL('/login', req.url);
  return NextResponse.redirect(login);
}

export const config = {
  // everything except /login, Next internals, and static assets
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
};
