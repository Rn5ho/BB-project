/** The NextRequest fields the predicate needs. Structural so tests need no server. */
export type TrackableRequest = {
  method: string;
  headers: { get(name: string): string | null };
  nextUrl: { pathname: string };
};

/** Is this request a real guest page view worth logging?
 *
 *  App Router client navigations arrive here as RSC GETs, so in-app link clicks count.
 *  But the router also PREFETCHES routes the user may never open — counting those would
 *  inflate every number on the activity card, so they are dropped. */
export function isTrackableNavigation(req: TrackableRequest): boolean {
  if (req.method !== 'GET') return false;

  if (req.headers.get('next-router-prefetch')) return false;
  const purpose = req.headers.get('purpose') ?? req.headers.get('x-purpose');
  if (purpose?.toLowerCase() === 'prefetch') return false;

  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api/')) return false;
  // /favicon.ico, /icon.png, … — assets, not pages. App routes never end in an extension.
  if (/\.[a-z0-9]+$/i.test(pathname)) return false;

  return true;
}
