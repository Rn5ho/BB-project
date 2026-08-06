import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';
import { isTrackableNavigation } from '@/lib/guest-tracking';
import { recordGuestEvent } from '@/queries/guest-events';

// Guests are redirected off these page trees (UX layer only — the server actions
// behind them are independently guarded by requireOwner()).
const OWNER_PATHS = ['/settings', '/census', '/scorecard'];

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (session?.role === 'owner') return NextResponse.next();
  if (session?.role === 'guest') {
    const { pathname } = req.nextUrl;
    if (OWNER_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (isTrackableNavigation(req)) {
      // Fire-and-forget. waitUntil keeps the write off the response path (the Next 16
      // proxy docs sanction exactly this beacon pattern), and the swallowed rejection
      // means a DB hiccup can never break a guest's browsing.
      event.waitUntil(
        recordGuestEvent({
          sessionId: session.sessionId ?? 'unknown',
          event: 'pageview',
          path: pathname, // pathname only — query strings are deliberately not stored
        }).catch(() => {}),
      );
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
