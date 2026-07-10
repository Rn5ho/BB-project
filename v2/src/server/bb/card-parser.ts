// Parser for BB player cards (transfer list results; NT roster page uses the same
// denomination markup — Phase 4 reuses this). Numeric skill values live in the
// title="" attribute of each denomination link.
//
// Fixture adaptations (verified 2026-07-10 against transferlist-pot6-p1.html):
// 1. Date separator is BACKSLASH in the fixture ("7\10\2026"), not forward-slash.
//    parseBbDateTime uses [\/\\] to handle both.
// 2. Nationality flag img carries the country in id="...nationalFlag_N" title="..."
//    (no class="nationalFlag" or "flags") — regex matches on the id attribute.
// 3. Rookie badge is <span class="drafteeLabel">Rookie</span> — detected by /Rookie/ in block.

export interface ParsedCard {
  bbPlayerId: number;
  name: string;
  nationality: string | null; // flag title, BB local name (e.g. "Italia", "España")
  position: string | null;    // PG/SG/SF/PF/C
  age: number | null;
  heightCm: number | null;
  potential: number | null;
  gameShape: number | null;
  salary: number | null;
  experience: number | null;
  skills: Record<string, number>; // dbKeys: jump_shot … free_throw
  tsp: number | null;
  isRookie: boolean;
  // market-only (null on roster pages)
  price: number | null;
  auctionEnds: Date | null;
  ownerTeamId: number | null;
  ownerTeamName: string | null;
}

const POSITION_LONG: Record<string, string> = {
  'Point Guard': 'PG', 'Shooting Guard': 'SG', 'Small Forward': 'SF', 'Power Forward': 'PF', 'Center': 'C',
};

const SKILL_LABELS: [string, string][] = [
  ['Jump Shot', 'jump_shot'], ['Jump Range', 'jump_range'], ['Outside Def\\.', 'outside_def'],
  ['Handling', 'handling'], ['Driving', 'driving'], ['Passing', 'passing'],
  ['Inside Shot', 'inside_shot'], ['Inside Def\\.', 'inside_def'], ['Rebounding', 'rebounding'],
  ['Shot Blocking', 'shot_blocking'], ['Stamina', 'stamina'], ['Free Throw', 'free_throw'],
];

function clean(s: string): string {
  return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function money(s: string | undefined): number | null {
  if (!s) return null;
  const digits = s.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

/**
 * "7\10\2026 5:43:11 PM" or "7/10/2026 5:43:11 PM" (page-local clock) → Date in that same local frame.
 * Adaptation: BB fixture uses backslash as date separator (not forward-slash).
 */
export function parseBbDateTime(s: string): Date {
  const m = s.match(/(\d+)[\/\\](\d+)[\/\\](\d+)\s+(\d+):(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) throw new Error(`Unparseable BB datetime: ${s}`);
  let h = Number(m[4]) % 12;
  if (/pm/i.test(m[7])) h += 12;
  return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]), h, Number(m[5]), Number(m[6]));
}

export function parsePageHeader(html: string): Date {
  // Fixture: "Transfer Listed Players as of \n            7\10\2026 5:43:11 PM"
  const m = html.match(/Transfer Listed Players as of\s*([\d\\/]+\s+[\d:]+\s*[AP]M)/i)
    ?? html.match(/as of\s*([\d\\/]+\s+[\d:]+\s*[AP]M)/i);
  if (!m) throw new Error('No as-of header found');
  return parseBbDateTime(m[1]);
}

export function parseResultsTotal(html: string): number {
  const m = html.match(/Showing results \d+-\d+ of (\d+)/);
  if (!m) throw new Error('No results total found');
  return Number(m[1]);
}

export function parsePlayerCards(html: string): ParsedCard[] {
  // Split on the player-details anchors; each segment up to the next anchor is one card.
  const anchors = [...html.matchAll(/<a id="cphContent_[A-Za-z0-9]+_(?:hlPlayerDetails|HyperLink1)_\d+" href="[^"]*\/player\/(\d+)\/overview\.aspx">([\s\S]*?)<\/a>/g)];
  const cards: ParsedCard[] = [];
  for (let i = 0; i < anchors.length; i++) {
    const start = anchors[i].index!;
    // include some prefix for flag/position (they precede the anchor)
    const prefixStart = Math.max(0, start - 2500);
    const end = i + 1 < anchors.length ? anchors[i + 1].index! : Math.min(html.length, start + 12000);
    const block = html.slice(start, end);
    const prefix = html.slice(prefixStart, start);

    const skills: Record<string, number> = {};
    for (const [label, key] of SKILL_LABELS) {
      const m = block.match(new RegExp(`${label}:\\s*<a[^>]*title="(\\d+)"`));
      if (m) skills[key] = Number(m[1]);
    }

    const positionLong = prefix.match(/>\s*(Point Guard|Shooting Guard|Small Forward|Power Forward|Center)\s*</)?.[1] ?? null;

    // Adaptation: flag uses id="...nationalFlag_N" title="CountryName", not a class attribute.
    // Pattern: <img id="...nationalFlag_N" title="CountryName" ...>
    const flag = prefix.match(/<img[^>]*id="[^"]*nationalFlag[^"]*"[^>]*title="([^"]+)"/i)?.[1]
      ?? prefix.match(/<img[^>]*title="([^"]+)"[^>]*id="[^"]*nationalFlag[^"]*"/i)?.[1] ?? null;

    cards.push({
      bbPlayerId: Number(anchors[i][1]),
      name: clean(anchors[i][2]),
      nationality: flag ? clean(flag) : null,
      position: positionLong ? POSITION_LONG[positionLong] : null,
      age: block.match(/Age:\s*(\d+)/) ? Number(block.match(/Age:\s*(\d+)/)![1]) : null,
      heightCm: block.match(/(\d{3})\s*cm/) ? Number(block.match(/(\d{3})\s*cm/)![1]) : null,
      potential: block.match(/Potential:\s*<a[^>]*title="(\d+)"/) ? Number(block.match(/Potential:\s*<a[^>]*title="(\d+)"/)![1]) : null,
      gameShape: block.match(/Game Shape:\s*<a[^>]*title="(\d+)"/) ? Number(block.match(/Game Shape:\s*<a[^>]*title="(\d+)"/)![1]) : null,
      salary: money(block.match(/Weekly salary:\s*\$([\s\d&nbsp;]+)/)?.[1]),
      experience: block.match(/Experience:\s*<a[^>]*title="(\d+)"/) ? Number(block.match(/Experience:\s*<a[^>]*title="(\d+)"/)![1]) : null,
      skills,
      tsp: block.match(/TSP:\s*<b>(\d+)<\/b>/) ? Number(block.match(/TSP:\s*<b>(\d+)<\/b>/)![1]) : null,
      isRookie: /Rookie/.test(block),
      price: money(block.match(/(?:Current Bid|Starting Price):\s*\$([\s\d&nbsp;,]+?)(?:\s*by|<)/)?.[1]),
      auctionEnds: block.match(/Auction ends:\s*([\d\\/]+\s+[\d:]+\s*[AP]M)/i)
        ? parseBbDateTime(block.match(/Auction ends:\s*([\d\\/]+\s+[\d:]+\s*[AP]M)/i)![1]) : null,
      ownerTeamId: block.match(/Owner:\s*<a[^>]*\/team\/(\d+)\//) ? Number(block.match(/Owner:\s*<a[^>]*\/team\/(\d+)\//)![1]) : null,
      ownerTeamName: block.match(/Owner:\s*<a[^>]*>([^<]+)<\/a>/) ? clean(block.match(/Owner:\s*<a[^>]*>([^<]+)<\/a>/)![1]) : null,
    });
  }
  return cards;
}
