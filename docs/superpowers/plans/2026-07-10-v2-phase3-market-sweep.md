# BB Scout v2 — Phase 3 (Market Sweep) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every day, BB Scout logs into buzzerbeater.com, sweeps the transfer list for 18–21yo listings (potential ≥ 6, all countries), and captures their **full skills** as `market` snapshots — catching foreign draftees' initial skills automatically.

**Architecture:** A reusable website-session module (`web-session.ts` — plain HTTP, ASP.NET postbacks, cookie jar; the census reuses it in Phase 4) + a card parser (`card-parser.ts` — fixture-tested; the NT roster page uses the same denomination markup) feed `runMarketSweep()`, which paginates newest-first with an early-stop condition and upserts players + deduped market snapshots. Wired into the existing `/api/cron/daily` dispatcher and Settings sync-now.

**Tech Stack:** Existing v2 stack. No new dependencies (regex parsing; no HTML parser lib needed — markup is highly regular ASP.NET repeater output).

**Spec:** `docs/superpowers/specs/2026-07-10-bb-scout-v2-design.md` §4 (1b), §9 phase 3.

---

## Research facts (verified live 2026-07-10 — build on these, don't re-derive)

- **Login:** GET `https://www.buzzerbeater.com/default.aspx` → collect cookies + hidden `__VIEWSTATE`/`__VIEWSTATEGENERATOR`/`__EVENTVALIDATION`; POST same URL with those + `__EVENTTARGET=ctl00$btnLogin`, `__EVENTARGUMENT=''`, `timeOffset=-120`, `ctl00$txtLoginUserName`, `ctl00$txtLoginPassword`, `ctl00$isFbLogin=''` → 302 to `/home.aspx`, cookies gain `.ASPXAUTH2` + `BBUser`. Env: `BB_WEB_USERNAME` (falls back to `BB_API_USERNAME`) + `BB_WEB_PASSWORD` (already in `v2/.env.local`; controller adds to Vercel in Task 5).
- **Search:** GET `/manage/transferlist.aspx` (collect hidden fields + ALL form field defaults: every `<select name="ctl00$cphContent$...">` selected/first option, every `<input name="ctl00$cphContent$tb...">` as `''`), then POST with those + `ctl00$cphContent$tbMinAge=18`, `tbMaxAge=21`, `ddlPotentialMin='6'`, `ddlsortBy='2'` (Auction Time Reversed = newest listings first) + `ctl00$cphContent$btnSearch=Search`. Response contains `Showing results 1-10 of N.` (N=842 at research time).
- **Pagination:** each results page has hidden `ctl00$cphContent$hdnPage` and submit `ctl00$cphContent$btnNextPage` (value `Next Page`). To advance: re-collect hidden fields + form values FROM THE CURRENT RESPONSE and POST with `btnNextPage='Next Page'`. Verified: page 2 shows `Showing results 11-20 of 842.`
- **Page header:** `Transfer Listed Players as of 7/10/2026 5:43:11 PM` — the page's own clock, same timezone as each card's `Auction ends:` datetime → **relative math is timezone-safe**: `hoursLeft = auctionEnd − asOf`.
- **Card markup** (ASP.NET repeater `cphContent_rptListedPlayers`, one block per player, 10/page). First card in the committed fixture `transferlist-pot6-p1.html`:
  - Player link: `<a id="cphContent_rptListedPlayers_hlPlayerDetails_0" href="../player/54971768/overview.aspx">Giovanbattista&nbsp;Lischi</a> (54971768)` — `&nbsp;` in names must be normalized to spaces.
  - Position as text in a right-floated div before the name anchor: `Point Guard` (map to PG/SG/SF/PF/C via long-name table).
  - `Current Bid: $&nbsp;365&nbsp;000 by <a href="/team/115768/...">...</a>` OR `Starting Price: $ X` (no bids yet) — parser must handle both; store the amount as `startingPrice` either way.
  - `Auction ends: 7/10/2026 5:45:55 PM`, `Owner: <a href="../team/45370/overview.aspx">3L Arredamenti</a>`, `Weekly salary: $&nbsp;15&nbsp;843`, `Age: 21`, `Height: 6'1" / 185 cm` (**use the cm number**), `Potential: <a class="lev12" title="7" ...>perennial allstar</a>` (**numeric potential in `title`**), `Game Shape: <a class="lev9" title="9">proficient (9)</a>`.
  - Skills: `Jump Shot: <a id="..._sdJumpShot_..." class="lev14" title="14">wondrous (14)</a>` — **numeric value in `title` attr**; labels: Jump Shot, Jump Range, Outside Def., Handling, Driving, Passing, Inside Shot, Inside Def., Rebounding, Shot Blocking, Stamina, Free Throw. Experience too (not stored per-skill columns? store in `experience`).
  - `TSP: <b>56</b> (36 + 20)`.
  - Rookie badge: cards for new draftees contain the text `Rookie` near `Age:` (fixture may not contain one — the parser detects the string within the card block; test with a synthetic card if the fixture lacks one).
  - Nationality: a flag `<img>` near the card top with the country name in its `title`/`alt` (v1 pattern: first flag = real country; a second `utopiaFlag` img may follow — ignore it). Verify against the fixture; if the fixture's markup differs, adapt the parser to what the fixture actually contains and note it.
  - **No DMI on market cards** (Players API supplies DMI).
- **Volumes:** first sweep captures ALL current listings (~842); dailies see mostly repeats + new listings — the stop-condition keeps daily page counts low (~1/3 of full).
- Fixtures saved by research (NOT yet committed): `v2/scripts/_fixtures/transferlist-pot6-p1.html`, `transferlist-pot6-p2.html`, `transferlist-results.html`. Research scripts `v2/scripts/_research-*.mjs` and `_tl-defaults.json` exist and must be deleted in Task 1.

## Decisions locked

- Sweep filter: ages 18–21, **potential ≥ 6** (domain rule: below 6 is NT-irrelevant), all countries, store everyone found. Constants at the top of `market.ts` for easy tuning.
- Sort newest-first (`ddlsortBy=2`, fixed 72h auctions ⇒ listedAgo ≈ 72h − hoursLeft). **Stop condition:** stop after the first page where ALL cards have `listedAgo > 30h` (yesterday's sweep saw them), then read ONE more page as overlap safety. `fullSweep` flag ignores the condition (first run / manual backfill). Hard cap `MAX_PAGES = 90` with a loud sync_log warning when hit.
- Snapshot dedup: one `market` snapshot per player per UTC day (delete+bulk-reinsert same-day, mirroring the players sync).
- `auctionEndsAt` stored as real UTC: `new Date(Date.now() + (auctionEnd − asOf))` — relative offset applied to server now.
- Players upsert from market cards: NEW players get identity from the card (name, position, heightCm, countryId+nationality via flag name → countries catalog match); EXISTING players only get owner fields refreshed — market card identity is lower-trust than the API sync.
- Cron: market sweep runs EVERY day right after seasons sync; `?force=market` and `?force=all` supported. Route `maxDuration = 300` (Vercel fluid compute allows it on Hobby; if the deploy rejects 300, fall back to 60 and rely on the stop-condition + MAX_PAGES=40 override via env `MARKET_MAX_PAGES`).

## File Structure

```
v2/src/server/bb/
├── web-session.ts        # login → session; get/post with cookie jar; collectHiddenFields/collectFormFields helpers
├── web-session.test.ts   # pure helpers only (field collection from HTML snippets)
├── card-parser.ts        # parsePlayerCards(html) + parsePageHeader(html) — shared with Phase 4 roster scrape
├── card-parser.test.ts   # against committed fixtures
└── __fixtures__/
    ├── transferlist-pot6-p1.html
    └── transferlist-pot6-p2.html
v2/src/server/sync/market.ts        # runMarketSweep({fullSweep})
v2/src/server/sync/market.test.ts   # pure helpers: stop-condition, listedAgo math
v2/src/app/api/cron/daily/route.ts  # MODIFY: add market job + force values + maxDuration 300
v2/src/app/settings/actions.ts      # MODIFY: syncNow('market')
v2/src/components/settings/SyncButtons.tsx  # MODIFY: third button
v2/src/queries/players.ts           # MODIFY: latest_market CTE → onMarket fields
v2/src/components/PlayerTable.tsx   # MODIFY: Market column (World variant)
```

---

### Task 1: Web session module + fixtures housekeeping

**Files:**
- Create: `v2/src/server/bb/web-session.ts`, `v2/src/server/bb/web-session.test.ts`, `v2/src/server/bb/__fixtures__/` (move the two pot6 fixtures in)
- Delete: `v2/scripts/_research-web-login.mjs`, `_research-tl-search.mjs`, `_research-tl-filtered.mjs`, `_research-sortby.mjs`, `_tl-defaults.json`, `scripts/_fixtures/` (after moving the two pot6 files; `transferlist-results.html` is redundant — delete)

- [ ] **Step 1: Failing tests** — `v2/src/server/bb/web-session.test.ts` (pure HTML-helpers only; login is live-verified in Task 3):

```ts
import { describe, it, expect } from 'vitest';
import { collectHiddenFields, collectFormFields } from './web-session';

const html = `
<input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="abc123" />
<input type="hidden" name="__EVENTVALIDATION" value="ev456" />
<input type="hidden" name="ctl00$cphContent$hdnPage" id="cphContent_hdnPage" value="3" />
<select name="ctl00$cphContent$ddlPotentialMin">
  <option value="0"></option>
  <option selected="selected" value="6">allstar</option>
</select>
<select name="ctl00$cphContent$ddlCountry">
  <option value=""></option>
</select>
<input name="ctl00$cphContent$tbMinAge" type="text" value="18" />
<input name="ctl00$cphContent$tbMaxAge" type="text" />
`;

describe('collectHiddenFields', () => {
  const h = collectHiddenFields(html);
  it('collects ASP.NET state fields', () => {
    expect(h.__VIEWSTATE).toBe('abc123');
    expect(h.__EVENTVALIDATION).toBe('ev456');
  });
  it('collects content hidden fields like hdnPage', () => {
    expect(h['ctl00$cphContent$hdnPage']).toBe('3');
  });
});

describe('collectFormFields', () => {
  const f = collectFormFields(html);
  it('uses the selected option', () => expect(f['ctl00$cphContent$ddlPotentialMin']).toBe('6'));
  it('falls back to first option', () => expect(f['ctl00$cphContent$ddlCountry']).toBe(''));
  it('keeps text input values, empty when absent', () => {
    expect(f['ctl00$cphContent$tbMinAge']).toBe('18');
    expect(f['ctl00$cphContent$tbMaxAge']).toBe('');
  });
});
```

- [ ] **Step 2:** `npm test` → FAIL (module not found); existing 93 green.

- [ ] **Step 3: Implement** — `v2/src/server/bb/web-session.ts`:

```ts
// buzzerbeater.com WEBSITE session (not the APIs) — plain-HTTP ASP.NET login + postbacks.
// Verified 2026-07-10: login POST → 302 /home.aspx with .ASPXAUTH2 cookie. Reused by the census (Phase 4).

const BASE = 'https://www.buzzerbeater.com';

export function collectHiddenFields(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of html.matchAll(/<input type="hidden" name="(__[A-Z][A-Za-z]*|ctl00\$cphContent\$hdn[A-Za-z]*)"[^>]*value="([^"]*)"/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

/** Selected (or first) option per select + current value per text input, for ctl00$cphContent$ fields. */
export function collectFormFields(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of html.matchAll(/<select name="(ctl00\$cphContent\$[^"]+)"[\s\S]*?<\/select>/g)) {
    const sel = m[0].match(/<option selected="selected" value="([^"]*)"/);
    out[m[1]] = sel ? sel[1] : (m[0].match(/<option value="([^"]*)"/)?.[1] ?? '');
  }
  for (const m of html.matchAll(/<input[^>]*name="(ctl00\$cphContent\$tb[^"]+)"([^>]*)/g)) {
    out[m[1]] = m[2].match(/value="([^"]*)"/)?.[1] ?? '';
  }
  return out;
}

export class BbWebSession {
  private jar = new Map<string, string>();

  private cookieHeader(): string {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  private store(res: Response): void {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(';');
      const i = pair.indexOf('=');
      this.jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
  }

  async get(path: string): Promise<string> {
    const res = await fetch(`${BASE}${path}`, { headers: { Cookie: this.cookieHeader() }, redirect: 'manual' });
    this.store(res);
    if (res.status >= 300 && res.status < 400) return this.get(res.headers.get('location')!);
    if (!res.ok) throw new Error(`BB web GET ${path}: HTTP ${res.status}`);
    return res.text();
  }

  /** POST a form; returns the response body (follows one redirect). */
  async post(path: string, fields: Record<string, string>): Promise<string> {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      redirect: 'manual',
      headers: { Cookie: this.cookieHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    });
    this.store(res);
    if (res.status >= 300 && res.status < 400) return this.get(res.headers.get('location')!);
    if (!res.ok) throw new Error(`BB web POST ${path}: HTTP ${res.status}`);
    return res.text();
  }

  async login(): Promise<void> {
    const user = process.env.BB_WEB_USERNAME || process.env.BB_API_USERNAME;
    const pass = process.env.BB_WEB_PASSWORD;
    if (!user || !pass) throw new Error('BB_WEB_USERNAME/BB_WEB_PASSWORD not configured');
    const loginPage = await this.get('/default.aspx');
    const body = await this.post('/default.aspx', {
      ...collectHiddenFields(loginPage),
      __EVENTTARGET: 'ctl00$btnLogin',
      __EVENTARGUMENT: '',
      timeOffset: '-120',
      'ctl00$txtLoginUserName': user,
      'ctl00$txtLoginPassword': pass,
      'ctl00$isFbLogin': '',
    });
    if (!this.jar.has('.ASPXAUTH2')) {
      throw new Error(`BB web login failed (no auth cookie). Page head: ${body.slice(0, 200)}`);
    }
  }
}
```

- [ ] **Step 4:** `npm test` → pass (93 + 5 = 98).

- [ ] **Step 5: Fixtures + cleanup.** `mkdir v2/src/server/bb/__fixtures__`; move `v2/scripts/_fixtures/transferlist-pot6-p1.html` and `transferlist-pot6-p2.html` there; delete `v2/scripts/_fixtures/`, `v2/scripts/_research-web-login.mjs`, `_research-tl-search.mjs`, `_research-tl-filtered.mjs`, `_research-sortby.mjs`, `_tl-defaults.json`. NOTE: the fixtures contain only public game data + the manager's team name — fine to commit.

- [ ] **Step 6: Commit + push**

```bash
git add v2/src/server/bb v2/scripts
git commit -m "feat(v2): BB website session module (plain-HTTP ASP.NET login) + market fixtures"
git push
```

---

### Task 2: Card parser (TDD on fixtures)

**Files:**
- Create: `v2/src/server/bb/card-parser.ts`
- Test: `v2/src/server/bb/card-parser.test.ts`

- [ ] **Step 1: Failing tests** — `v2/src/server/bb/card-parser.test.ts`. Read the fixture ONCE at module level. Exact expected values below come from the first card of `transferlist-pot6-p1.html` (verified during research — if a value doesn't match, inspect the fixture and correct the TEST to the fixture's actual content, then re-verify the parser):

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parsePlayerCards, parsePageHeader, parseResultsTotal } from './card-parser';

const p1 = readFileSync(new URL('./__fixtures__/transferlist-pot6-p1.html', import.meta.url), 'utf8');
const p2 = readFileSync(new URL('./__fixtures__/transferlist-pot6-p2.html', import.meta.url), 'utf8');

describe('parsePageHeader', () => {
  it('parses the as-of timestamp', () => {
    const asOf = parsePageHeader(p1);
    expect(asOf.getMonth()).toBe(6); // July (0-based)
    expect(asOf.getDate()).toBe(10);
    expect(asOf.getFullYear()).toBe(2026);
    expect(asOf.getHours()).toBe(17); // 5:43 PM
    expect(asOf.getMinutes()).toBe(43);
  });
});

describe('parseResultsTotal', () => {
  it('reads the total from the Showing line', () => expect(parseResultsTotal(p1)).toBe(842));
});

describe('parsePlayerCards — first card of page 1', () => {
  const cards = parsePlayerCards(p1);
  const c = cards[0];
  it('parses 10 cards per page', () => expect(cards.length).toBe(10));
  it('identity', () => {
    expect(c.bbPlayerId).toBe(54971768);
    expect(c.name).toBe('Giovanbattista Lischi'); // &nbsp; normalized
    expect(c.position).toBe('PG'); // "Point Guard"
  });
  it('meta', () => {
    expect(c.age).toBe(21);
    expect(c.heightCm).toBe(185);
    expect(c.potential).toBe(7); // title attr of the potential link
    expect(c.gameShape).toBe(9);
    expect(c.salary).toBe(15843);
    expect(c.experience).not.toBeNull();
  });
  it('market fields', () => {
    expect(c.price).toBe(365000); // "Current Bid: $ 365 000"
    expect(c.ownerTeamId).toBe(45370);
    expect(c.ownerTeamName).toBe('3L Arredamenti');
    expect(c.auctionEnds).toBeInstanceOf(Date);
    // ends ~3 minutes after the page asOf (5:45:55 PM vs 5:43:11 PM)
    expect(c.auctionEnds!.getTime() - parsePageHeader(p1).getTime()).toBeGreaterThan(0);
    expect(c.auctionEnds!.getTime() - parsePageHeader(p1).getTime()).toBeLessThan(10 * 60 * 1000);
  });
  it('skills from title attrs', () => {
    expect(c.skills.jump_shot).toBe(14);
    expect(c.skills.jump_range).toBe(10);
    expect(c.skills.outside_def).toBe(13);
    expect(c.skills.handling).toBe(10);
    expect(c.skills.driving).toBe(14);
    // remaining 7 skills: assert non-null and within 1..20
    for (const v of Object.values(c.skills)) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(20);
    }
  });
  it('tsp', () => expect(c.tsp).toBe(56 + 0 || c.tsp)); // replace with the card's actual TSP from the fixture — research saw "TSP: <b>56</b>" on ANOTHER card; assert the real first-card value after inspecting
  it('all cards have 12 skills', () => {
    for (const card of cards) expect(Object.keys(card.skills).length).toBe(12);
  });
  it('page 2 parses too and differs', () => {
    const cards2 = parsePlayerCards(p2);
    expect(cards2.length).toBe(10);
    expect(cards2[0].bbPlayerId).not.toBe(c.bbPlayerId);
  });
});
```

(The `tsp` test line is a placeholder guard — Step 2 REQUIRES you to open the fixture, read the first card's actual `TSP: <b>N</b>` value and nationality flag markup, and finalize BOTH that assertion and a nationality assertion `expect(c.nationality).toBe('<actual>')` before implementing. No `|| c.tsp` self-comparisons may remain.)

- [ ] **Step 2: Fixture inspection.** Open `__fixtures__/transferlist-pot6-p1.html`, locate the first card (`hlPlayerDetails_0`), record: exact TSP value, the flag img markup (id/title/alt pattern) and country name, whether a Rookie badge exists anywhere in either fixture (search "Rookie"). Finalize the tests. Run `npm test` → new tests FAIL (module missing).

- [ ] **Step 3: Implement** — `v2/src/server/bb/card-parser.ts`:

```ts
// Parser for BB player cards (transfer list results; NT roster page uses the same
// denomination markup — Phase 4 reuses this). Numeric skill values live in the
// title="" attribute of each denomination link.

export interface ParsedCard {
  bbPlayerId: number;
  name: string;
  nationality: string | null; // flag title, BB local name
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

/** "7/10/2026 5:43:11 PM" (page-local clock) → Date in that same local frame. */
export function parseBbDateTime(s: string): Date {
  const m = s.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) throw new Error(`Unparseable BB datetime: ${s}`);
  let h = Number(m[4]) % 12;
  if (/pm/i.test(m[7])) h += 12;
  return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]), h, Number(m[5]), Number(m[6]));
}

export function parsePageHeader(html: string): Date {
  const m = html.match(/Transfer Listed Players as of\s*<[^>]*>?\s*([\d/]+\s+[\d:]+\s*[AP]M)/i)
    ?? html.match(/as of\s*([\d/]+\s+[\d:]+\s*[AP]M)/i);
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
  const anchors = [...html.matchAll(/<a id="cphContent_rpt\w+_hlPlayerDetails_\d+" href="[^"]*\/player\/(\d+)\/overview\.aspx">([\s\S]*?)<\/a>/g)];
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
    const flag = prefix.match(/<img[^>]*(?:nationalFlag|flags)[^>]*title="([^"]+)"/i)?.[1]
      ?? prefix.match(/<img[^>]*title="([^"]+)"[^>]*(?:nationalFlag|flags)/i)?.[1] ?? null;

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
      auctionEnds: block.match(/Auction ends:\s*([\d/]+\s+[\d:]+\s*[AP]M)/i)
        ? parseBbDateTime(block.match(/Auction ends:\s*([\d/]+\s+[\d:]+\s*[AP]M)/i)![1]) : null,
      ownerTeamId: block.match(/Owner:\s*<a[^>]*\/team\/(\d+)\//) ? Number(block.match(/Owner:\s*<a[^>]*\/team\/(\d+)\//)![1]) : null,
      ownerTeamName: block.match(/Owner:\s*<a[^>]*>([^<]+)<\/a>/) ? clean(block.match(/Owner:\s*<a[^>]*>([^<]+)<\/a>/)![1]) : null,
    });
  }
  return cards;
}
```

Regexes above were written against the researched markup but MUST be reconciled with the fixture during Step 2/4 — where the fixture disagrees, the fixture wins (adjust code, keep tests asserting fixture truths).

- [ ] **Step 4:** `npm test` → all card tests pass against both fixture pages. If any assertion fails, debug against the fixture (it is ground truth), fix the parser (or a wrong expected value), and re-run.

- [ ] **Step 5: Commit + push**

```bash
git add v2/src/server/bb
git commit -m "feat(v2): shared BB player-card parser, fixture-tested against live transfer pages"
git push
```

---

### Task 3: Market sweep job + live run

**Files:**
- Create: `v2/src/server/sync/market.ts`
- Test: `v2/src/server/sync/market.test.ts`

- [ ] **Step 1: Failing tests** for the pure stop-condition helper — `v2/src/server/sync/market.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { listedAgoHours, pageIsStale } from './market';

const asOf = new Date('2026-07-10T17:43:11');

describe('listedAgoHours', () => {
  it('a listing ending in 3 minutes was listed ~72h ago', () => {
    const ends = new Date('2026-07-10T17:45:55');
    expect(listedAgoHours(ends, asOf)).toBeGreaterThan(71);
  });
  it('a listing ending in 71h was listed ~1h ago', () => {
    const ends = new Date(asOf.getTime() + 71 * 3600_000);
    expect(listedAgoHours(ends, asOf)).toBeLessThan(2);
  });
});

describe('pageIsStale', () => {
  const fresh = { auctionEnds: new Date(asOf.getTime() + 70 * 3600_000) };
  const stale = { auctionEnds: new Date(asOf.getTime() + 10 * 3600_000) };
  it('stale only when ALL cards are older than the threshold', () => {
    expect(pageIsStale([stale, stale] as never, asOf, 30)).toBe(true);
    expect(pageIsStale([stale, fresh] as never, asOf, 30)).toBe(false);
  });
  it('cards without auction end are treated as fresh (never stop on them)', () => {
    expect(pageIsStale([{ auctionEnds: null }] as never, asOf, 30)).toBe(false);
  });
});
```

- [ ] **Step 2:** FAIL, then implement — `v2/src/server/sync/market.ts`:

```ts
import { db, players, snapshots, syncLog } from '@/db';
import { BbWebSession, collectHiddenFields, collectFormFields } from '@/server/bb/web-session';
import { parsePlayerCards, parsePageHeader, parseResultsTotal, type ParsedCard } from '@/server/bb/card-parser';
import { getCountriesCatalog } from './countries';
import { getCurrentSeasonId } from '@/queries/players';
import { utcDayKey } from './players';
import { sql, inArray, and, eq, gte } from 'drizzle-orm';

// Sweep scope — tune here.
const MIN_AGE = '18';
const MAX_AGE = '21';
const MIN_POTENTIAL = '6'; // allstar; below is NT-irrelevant (spec §6)
const SORT_NEWEST_FIRST = '2'; // "Auction Time Reversed" — fixed 72h auctions ⇒ newest listings end last
const STALE_AFTER_HOURS = 30; // seen by yesterday's sweep
const MAX_PAGES = Number(process.env.MARKET_MAX_PAGES ?? 90);

export function listedAgoHours(auctionEnds: Date, asOf: Date): number {
  const hoursLeft = (auctionEnds.getTime() - asOf.getTime()) / 3600_000;
  return 72 - hoursLeft;
}

export function pageIsStale(cards: Pick<ParsedCard, 'auctionEnds'>[], asOf: Date, thresholdHours: number): boolean {
  if (cards.length === 0) return true;
  return cards.every((c) => c.auctionEnds !== null && listedAgoHours(c.auctionEnds, asOf) > thresholdHours);
}

export interface MarketSweepCounts {
  pagesRead: number;
  totalListed: number;
  cardsParsed: number;
  newPlayers: number;
  snapshotsInserted: number;
  snapshotsUpdated: number;
  stoppedEarly: boolean;
  hitPageCap: boolean;
}

export async function runMarketSweep(opts: { fullSweep?: boolean } = {}): Promise<MarketSweepCounts> {
  const [logRow] = await db.insert(syncLog).values({ jobType: 'market' }).returning({ id: syncLog.id });
  try {
    const session = new BbWebSession();
    await session.login();

    // search
    const formPage = await session.get('/manage/transferlist.aspx');
    const fields = collectFormFields(formPage);
    fields['ctl00$cphContent$tbMinAge'] = MIN_AGE;
    fields['ctl00$cphContent$tbMaxAge'] = MAX_AGE;
    fields['ctl00$cphContent$ddlPotentialMin'] = MIN_POTENTIAL;
    fields['ctl00$cphContent$ddlsortBy'] = SORT_NEWEST_FIRST;
    let page = await session.post('/manage/transferlist.aspx', {
      ...collectHiddenFields(formPage),
      ...fields,
      'ctl00$cphContent$btnSearch': 'Search',
    });

    const totalListed = parseResultsTotal(page);
    const counts: MarketSweepCounts = {
      pagesRead: 0, totalListed, cardsParsed: 0, newPlayers: 0,
      snapshotsInserted: 0, snapshotsUpdated: 0, stoppedEarly: false, hitPageCap: false,
    };

    const allCards = new Map<number, { card: ParsedCard; asOf: Date }>();
    let staleStreak = 0;
    for (let p = 0; p < MAX_PAGES; p++) {
      const asOf = parsePageHeader(page);
      const cards = parsePlayerCards(page);
      counts.pagesRead++;
      counts.cardsParsed += cards.length;
      for (const c of cards) allCards.set(c.bbPlayerId, { card: c, asOf });

      const reachedEnd = counts.pagesRead * 10 >= totalListed || cards.length === 0;
      if (reachedEnd) break;
      if (!opts.fullSweep && pageIsStale(cards, asOf, STALE_AFTER_HOURS)) {
        staleStreak++;
        if (staleStreak >= 2) { counts.stoppedEarly = true; break; } // 1 overlap page after the first stale one
      } else {
        staleStreak = 0;
      }

      page = await session.post('/manage/transferlist.aspx', {
        ...collectHiddenFields(page),
        ...collectFormFields(page),
        'ctl00$cphContent$btnNextPage': 'Next Page',
      });
      await new Promise((r) => setTimeout(r, 400)); // polite pacing
    }
    if (counts.pagesRead >= MAX_PAGES) counts.hitPageCap = true;

    // persist
    const catalog = await getCountriesCatalog();
    const countryIdOf = new Map(catalog.map((c) => [c.name, c.id]));
    const season = await getCurrentSeasonId();
    const ids = [...allCards.keys()];
    if (ids.length > 0) {
      const existing = await db.select({ id: players.bbPlayerId }).from(players).where(inArray(players.bbPlayerId, ids));
      const existingIds = new Set(existing.map((e) => e.id));
      counts.newPlayers = ids.length - existingIds.size;

      // new players: full identity from card; existing: refresh owner only
      const newRows = [...allCards.values()].filter(({ card }) => !existingIds.has(card.bbPlayerId)).map(({ card }) => ({
        bbPlayerId: card.bbPlayerId,
        name: card.name,
        countryId: card.nationality ? countryIdOf.get(card.nationality) ?? null : null,
        nationality: card.nationality,
        heightCm: card.heightCm,
        bestPosition: card.position,
        ownerTeamId: card.ownerTeamId,
        ownerTeamName: card.ownerTeamName,
      }));
      for (const chunk of chunks(newRows, 500)) await db.insert(players).values(chunk).onConflictDoNothing();
      for (const { card } of [...allCards.values()].filter(({ card }) => existingIds.has(card.bbPlayerId))) {
        if (card.ownerTeamId != null) {
          await db.update(players)
            .set({ ownerTeamId: card.ownerTeamId, ownerTeamName: card.ownerTeamName })
            .where(and(eq(players.bbPlayerId, card.bbPlayerId), sql`owner_team_id is distinct from ${card.ownerTeamId}`));
        }
      }

      // market snapshots — one per player per UTC day (delete+bulk-reinsert)
      const todayStart = new Date(`${utcDayKey(new Date())}T00:00:00Z`);
      const todays = await db.select({ id: snapshots.id }).from(snapshots)
        .where(and(eq(snapshots.source, 'market'), gte(snapshots.capturedAt, todayStart), inArray(snapshots.playerId, ids)));
      if (todays.length > 0) await db.delete(snapshots).where(inArray(snapshots.id, todays.map((t) => t.id)));
      counts.snapshotsUpdated = todays.length;

      const snapRows = [...allCards.values()].map(({ card, asOf }) => ({
        playerId: card.bbPlayerId,
        source: 'market' as const,
        season,
        age: card.age,
        gameShape: card.gameShape,
        salary: card.salary,
        potential: card.potential,
        experience: card.experience,
        jumpShot: card.skills.jump_shot ?? null, jumpRange: card.skills.jump_range ?? null,
        outsideDef: card.skills.outside_def ?? null, handling: card.skills.handling ?? null,
        driving: card.skills.driving ?? null, passing: card.skills.passing ?? null,
        insideShot: card.skills.inside_shot ?? null, insideDef: card.skills.inside_def ?? null,
        rebounding: card.skills.rebounding ?? null, shotBlocking: card.skills.shot_blocking ?? null,
        stamina: card.skills.stamina ?? null, freeThrow: card.skills.free_throw ?? null,
        tsp: card.tsp,
        ownerTeamId: card.ownerTeamId,
        ownerTeamName: card.ownerTeamName,
        startingPrice: card.price,
        auctionEndsAt: card.auctionEnds ? new Date(Date.now() + (card.auctionEnds.getTime() - asOf.getTime())) : null,
        isRookieListing: card.isRookie,
      }));
      for (const chunk of chunks(snapRows, 500)) await db.insert(snapshots).values(chunk);
      counts.snapshotsInserted = snapRows.length - counts.snapshotsUpdated;
    }

    await db.update(syncLog).set({ finishedAt: new Date(), ok: true, counts }).where(sql`id = ${logRow.id}`);
    return counts;
  } catch (e) {
    await db.update(syncLog).set({ finishedAt: new Date(), ok: false, error: String(e) }).where(sql`id = ${logRow.id}`);
    throw e;
  }
}

function chunks<T>(arr: T[], n: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
}
```

- [ ] **Step 3:** `npm test` (98 + 4 = 102 or per actual) green; `npm run build` clean.

- [ ] **Step 4: LIVE full sweep (writes real data — intended).** Temp script (dotenv + dynamic import pattern) calling `runMarketSweep({ fullSweep: true })` with `console.time`. Expected: pagesRead ≈ ceil(total/10) (≈85), cardsParsed ≈ totalListed, several hundred `newPlayers`, snapshotsInserted ≈ totalListed, duration well under 300s (~1-2 min with 400ms pacing — if it exceeds ~4 min, note it for the cron maxDuration discussion). Then run `runMarketSweep()` (incremental) — expect stoppedEarly=true and pagesRead low (2-5), snapshotsUpdated covering re-seen listings. Post-check (temp script, delete after): `select count(*) from snapshots where source='market'` ≈ totalListed; sample 3 market snapshots joined to players — sane names/skills; `select count(*) from players where bb_player_id in (select player_id from snapshots where source='market') and country_id is null` (how many flags didn't match the catalog — report the number and 3 sample nationality strings if > 0).
- [ ] **Step 5: Commit + push**

```bash
git add v2/src/server/sync
git commit -m "feat(v2): daily market sweep — full-skill capture from transfer listings"
git push
```

---

### Task 4: Cron + Settings + World market indicator

**Files:**
- Modify: `v2/src/app/api/cron/daily/route.ts`, `v2/src/app/settings/actions.ts`, `v2/src/components/settings/SyncButtons.tsx`, `v2/src/queries/players.ts`, `v2/src/components/PlayerTable.tsx`

- [ ] **Step 1: Cron route.** In `route.ts`: `export const maxDuration = 300;` (was 60). Extend the dispatcher:

```ts
  const force = req.nextUrl.searchParams.get('force'); // 'players' | 'market' | 'all'
  const results: Record<string, unknown> = {};
  results.seasons = await runSeasonsSync();
  results.market = await runMarketSweep(); // incremental daily
  if (new Date().getUTCDay() === 1 || force === 'players' || force === 'all') {
    results.players = await runPlayersSync();
  }
```

(import `runMarketSweep`; keep CRON_SECRET auth unchanged. `force=market` needs no special branch — market always runs; document that in a comment.)

- [ ] **Step 2: Settings.** `actions.ts`: extend `syncNow(job: 'players' | 'seasons' | 'market')` with `job === 'market' ? await runMarketSweep() : ...`. `SyncButtons.tsx`: third button "Sync market now" (amber-outline style like seasons).

- [ ] **Step 3: World market indicator.** In `queries/players.ts` add a third CTE and fields:

```sql
    latest_market as (
      select distinct on (player_id) player_id, auction_ends_at, starting_price, is_rookie_listing
      from snapshots where source = 'market'
      order by player_id, captured_at desc
    )
```

join `left join latest_market m on m.player_id = p.bb_player_id`, select `m.auction_ends_at, m.starting_price, m.is_rookie_listing`, and extend `PlayerListRow` with `onMarketUntil: Date | null` (only set when `auction_ends_at > now` — compute in the mapper), `lastListedPrice: number | null`, `isRookie: boolean`. In `PlayerTable.tsx`: when `showCountry` (World variant), add a "Market" column: if `onMarketUntil` in the future → amber chip `on market · ends in Xh` (compute hours client-side); else if `isRookie` → subtle `rookie` chip; else dash. Rows keep working on Slovenia variant (column hidden).

- [ ] **Step 4:** `npm test` green, `npm run build` clean. Local dev check with curl + session cookie: `/world` HTML contains at least one "on market" chip (there are hundreds of active listings just swept). `/api/cron/daily` with CRON_SECRET locally → 200 with seasons + market counts (market incremental: stoppedEarly true).
- [ ] **Step 5: Commit + push**

```bash
git add v2/src
git commit -m "feat(v2): market sweep in daily cron, settings button, on-market indicator on World"
git push
```

---

### Task 5: Deploy + production verification (controller-led)

- [ ] **Step 1 (controller):** Add `BB_WEB_USERNAME` (if present in .env.local) and `BB_WEB_PASSWORD` to Vercel env via the REST API pattern; confirm deploy of Task 4's push is READY.
- [ ] **Step 2 (controller):** Production: `curl /api/cron/daily` with CRON_SECRET → 200 including `market` counts (incremental, stoppedEarly likely true, snapshotsUpdated > 0). Verify `maxDuration: 300` didn't break the build (if Vercel rejected it, logs will show; fallback per plan decision).
- [ ] **Step 3 (controller):** `npm run e2e` (the Phase-2 smoke script) still 22/22. Spot-check World page for market chips via curl.
- [ ] **Step 4:** Update CLAUDE.md v2 section (Phase 3 shipped: market sweep daily, web-session module, card parser, World market chips; env additions) and the user memory. Commit + push.

---

## Self-Review (done at write time)

- **Spec coverage:** §4.1b market sweep (daily, transfer search, full-skill cards, starting price/auction end/owner/rookie, dedup) → Tasks 2/3; website session module reusable by census → Task 1; Players-API-isForSale-as-cross-check consciously NOT implemented (redundant with direct search; noted); "on market now" World indicator + rookie flag (spec §7) → Task 4; cron + sync-now → Task 4.
- **Deviation from spec:** spec's tracked-countries scope for the sweep replaced by all-countries + potential ≥ 6 (transfer search made it cheap; user approved store-everything; potential floor per domain rules §6).
- **Type consistency:** ParsedCard flows parser → market.ts mappings; `utcDayKey` imported from sync/players; counts object keys match Settings display (JSON.stringify of counts).
- **Placeholder scan:** the deliberate Step-2 fixture-reconciliation instructions in Task 2 replace two placeholder assertions (tsp/nationality) — that is explicit work, not a TBD. All other steps carry complete code.
- **Risk note:** ASP.NET `__EVENTVALIDATION` may reject POSTs missing rarely-collected fields (e.g. radio `ddlInjury1` handled as select? it IS a select — collected). If search POST returns the form without results in Task 3's live run, diff the submitted field set against a browser capture. Research already proved the exact submitted set works.
