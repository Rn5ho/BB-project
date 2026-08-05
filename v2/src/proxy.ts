import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';

// Guests are redirected off these page trees (UX layer only — the server actions
// behind them are independently guarded by requireOwner()).
const OWNER_PATHS = ['/settings', '/census', '/scorecard'];

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const role = token ? await verifySessionToken(token) : null;
  if (role === 'owner') return NextResponse.next();
  if (role === 'guest') {
    const { pathname } = req.nextUrl;
    if (OWNER_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }
  const login = new URL('/login', req.url);
  return NextResponse.redirect(login);
}

export const config = {
  // everything except /login, Next internals, and static assets
  matcher: ['/((?!login(?:/|$)|api/cron(?:/|$)|_next/static|_next/image|favicon.ico).*)'],
};
