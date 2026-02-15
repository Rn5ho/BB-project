# BB Scout - BuzzerBeater NT Player Tracker

## Overview
A Chrome Extension + Web App tool for BuzzerBeater National Team managers. Auto-captures player skills from the game's web UI and stores them in an online database for tracking, comparing, and scouting players across seasons. Built for Slovenia U-21 management.

## Tech Stack
- **Web App:** Next.js 16 (React) + TypeScript + Tailwind CSS
- **Database + Auth + API:** Supabase (PostgreSQL + Auth + auto-generated REST API)
- **Chrome Extension:** Vanilla JavaScript, Manifest V3
- **Hosting:** Vercel (web app) + Supabase Cloud (database)
- **Repo:** GitHub `Rn5ho/BB-project` (private)

## Project Structure
```
BB-project/
  CLAUDE.md
  supabase/
    schema.sql               # Database schema (run in Supabase SQL Editor)
  extension/
    manifest.json            # Chrome extension config (Manifest V3)
    content-scripts/
      common.js              # Skill mappings, constants, Supabase config, color maps
      player-parser.js       # DOM parser for BB player profile pages (/player/*)
      roster-parser.js       # DOM parser for NT roster pages (/national/*, /country/*/jnt/*)
      market-parser.js       # DOM parser for transfer market search results (/manage/transferlist*)
      overlay.css            # Extension overlay + floating mini button styles
    popup/
      popup.html             # Extension popup UI (login, sync, show overlay, dashboard link)
      popup.js               # Popup logic (login, sync, show overlay, clear local data)
    background/
      service-worker.js      # Auth token refresh, retry sync
    icons/                   # Extension icons (16, 48, 128px)
  web/
    app/
      page.tsx               # Home / landing page
      layout.tsx             # Root layout
      globals.css            # Global styles (dark theme)
      login/page.tsx         # Auth page
      players/page.tsx       # Player list with filters, sorting, bulk delete
      players/[id]/page.tsx  # Player detail + skill history + editable position
      compare/page.tsx       # Side-by-side player comparison
      manual-entry/page.tsx  # Manual skill data entry form
    components/
      Navbar.tsx             # Navigation bar
      SkillBadge.tsx         # Skill display with color coding
      SkillDelta.tsx         # Skill change indicator (+N green, -N red)
    lib/
      supabase.ts            # Supabase client config
      constants.ts           # Skill levels, potentials, BB color maps, helper functions
      types.ts               # TypeScript interfaces
    .env.local               # Supabase credentials (not committed)
    .env.local.example       # Template for env vars
```

## Development Commands
```bash
# Web app - development
cd web && npm run dev

# Web app - build (also validates TypeScript)
cd web && npm run build

# Web app - lint
cd web && npm run lint

# Chrome extension - load in browser
# Go to chrome://extensions > Enable Developer Mode > Load Unpacked > select extension/ folder
# After code changes: click the reload icon on the extension card
```

## Configuration
1. Create a Supabase project at https://supabase.com
2. Run `supabase/schema.sql` in the Supabase SQL Editor
3. Copy `web/.env.local.example` to `web/.env.local` and fill in Supabase URL + anon key
4. Supabase credentials are hardcoded in 3 extension files (no build step):
   - `extension/content-scripts/common.js` — SUPABASE_URL, SUPABASE_ANON_KEY
   - `extension/popup/popup.js` — SUPABASE_URL, SUPABASE_ANON_KEY, DASHBOARD_URL
   - `extension/background/service-worker.js` — SUPABASE_URL, SUPABASE_ANON_KEY

**Current Supabase instance:** `https://zhywajswbpdmhpeqyczc.supabase.co`
**Dashboard URL (popup.js):** Update to Vercel URL after deploy (currently `http://localhost:3000`)

## Coding Conventions
- Use TypeScript for all web app code
- Keep components focused and under ~200 lines
- Store skill values as integers (1-20), convert to text for display using SKILL_LEVELS map
- Store potential as integers (0-11), convert to text using POTENTIAL_LEVELS map
- Supabase queries use the auto-generated REST API via `@supabase/supabase-js` (web) or direct fetch (extension)
- Extension uses vanilla JS (no build step, no bundler)
- Dark theme throughout: `var(--accent)` = #e94560, `var(--card-bg)` = #1a1a2e, `var(--background)` = #0f0f23

## Data Flow
```
BuzzerBeater Page (player or roster)
  → Extension content script parses DOM (player-parser.js or roster-parser.js)
  → Saves locally to chrome.storage.local (key: bb_scout_player_${bbPlayerId})
  → Upserts player to Supabase /rest/v1/players (on_conflict=bb_player_id)
  → Inserts skill snapshot to Supabase /rest/v1/skill_snapshots
  → Web dashboard displays data with history, colors, and comparisons
```

## Extension Architecture

### Content Scripts
Both parsers share `common.js` (loaded first via manifest) which provides:
- `SKILL_LEVELS` / `SKILL_LEVELS_REVERSE` — number↔text mapping (1-20)
- `POTENTIAL_LEVELS` / `POTENTIAL_LEVELS_REVERSE` — number↔text mapping (0-11)
- `SKILLS` array — 12 skills with `name`, `dbKey`, `parseKey` properties
- `SKILL_COLORS` — exact hex codes from BuzzerBeater's HTML for each skill level
- `getSkillColor(level)` — returns hex color for a skill level
- `parseSkillText(text)` / `parsePotentialText(text)` — text→number converters
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — API credentials

### Player Parser (`player-parser.js`)
Runs on `/player/*` pages. Parses single player profiles.

**4 skill parsing strategies (tried in order, stops when all 12 found):**
1. Regex on innerText: `"Jump Shot: strong (8)"` with 4 sub-patterns (colon, newline, tab, text-only)
2. ASP.NET element IDs: searches for `ctl00_cphContent_*` style IDs
3. Colored links scan: finds `<a>` tags whose text matches known skill level names
4. Brute force: for each missing skill, scans all text for skill name + nearby skill level word

**Name parsing** uses `[ ]` literal space (not `\s`) to avoid matching across lines/tabs. Limited to 2-4 word names. Fallback: if >4 words, takes last 2 words.

**Position parsing** is best-effort from page text (not reliable — BB auto-classifies).

**TSP fallback**: if `Skill points:` regex fails, sums all individual skill values.

**Auth token refresh**: checks 60-second expiry buffer before saving, calls `/auth/v1/token?grant_type=refresh_token`.

### Roster Parser (`roster-parser.js`)
Runs on `/national/*` and `/country/*/jnt/*` pages. Batch-parses all players on roster page.

**Player detection**: Finds all `(6+ digit ID)` patterns in page text, validates each by checking for 3+ skill keywords in the next 800 characters. Position is NOT required (parsed best-effort only).

**Skill keywords for validation**: Jump Shot, Jump Range, Handling, Driving, Passing, Inside Shot, Rebounding, Shot Blocking, Stamina, Free Throw, DMI

**Batch save**: saves all locally first, then upserts each to Supabase with progress tracking. Shows `firstError` in overlay if any fail.

### Overlay Minimize/Restore
Both parsers support minimize/restore:
- **Close button (×)**: hides overlay (`display: none`), shows floating "BB" mini button (bottom-right corner)
- **Mini button click**: re-shows overlay, or re-runs `init()` if overlay was lost
- **Popup "Show Overlay on Page" button**: sends `chrome.tabs.sendMessage({action: 'showOverlay'})` to content script
- Both parsers have `chrome.runtime.onMessage` listener for `showOverlay` action

### Popup (`popup.html` + `popup.js`)
**Buttons available when logged in:**
- Sync Pending Data (primary) — syncs unsynced local players to Supabase
- Show Overlay on Page — sends message to content script to reshow overlay
- Clear Local Data (red) — deletes all `bb_scout_player_*` keys from chrome.storage.local
- Open Dashboard → — link to web app (Vercel URL, set in popup.js DASHBOARD_URL)
- Log Out

**Stats shown**: "Saved Locally" count, "Pending Sync" count

### Manifest URL Patterns
Uses `*://` prefix (matches both HTTP and HTTPS) because BB may serve over either:
- Player pages: `*://www.buzzerbeater.com/player/*`, `*://buzzerbeater.com/player/*`
- Roster pages: `*://www.buzzerbeater.com/national/*`, `*://buzzerbeater.com/national/*`, `*://www.buzzerbeater.com/country/*/jnt/*`, `*://buzzerbeater.com/country/*/jnt/*`

## Web Dashboard Features

### Player List (`/players`)
**Columns**: Checkbox, Name (with BB link ↗), Age, Position, Potential (colored), DMI, TSP, OSP (outside skill points), ISP (inside skill points), Tags, Updated
**OSP** = jump_shot + jump_range + outside_def + handling + driving + passing
**ISP** = inside_shot + inside_def + rebounding + shot_blocking
**Sorting**: all columns sortable, toggle asc/desc
**Filters**: name search, age checkboxes (18-21), position dropdown, potential dropdown
**Bulk delete**: with RLS failure detection — if 0 rows deleted, shows SQL to add DELETE policy

### Player Detail (`/players/[id]`)
- **Editable position dropdown** (PG/SG/SF/PF/C or blank) — saves immediately to Supabase
- **Current skills** in 2-column grid with colored text and background
- **Skill history table** with deltas (+N green, -N red) comparing snapshots
- **BB link**: "View on BuzzerBeater ↗" → `https://www.buzzerbeater.com/player/${bb_player_id}/overview.aspx`

## BuzzerBeater Color Scheme
Exact hex codes extracted from BB's HTML source. Gradient: Black → Dark Blue → Purple → Red → Orange → Gold → Green/Teal.

### Skill Colors (1-20)
```
 1 atrocious:   #000000 (black)
 2 pitiful:     #121263 (dark navy)
 3 awful:       #221385 (dark blue)
 4 inept:       #30139F (blue)
 5 mediocre:    #700BA2 (dark purple)
 6 average:     #910B9D (purple)
 7 respectable: #AD0B88 (magenta-purple)
 8 strong:      #B70B5A (crimson)
 9 proficient:  #9C0B32 (dark red)
10 prominent:   #A70B00 (red)
11 prolific:    #BD2600 (red-orange)
12 sensational: #CB3100 (orange-red)
13 tremendous:  #D93C00 (dark orange)
14 wondrous:    #DB6E04 (orange)
15 marvelous:   #E5A64B (gold)
16 prodigious:  #AC860A (dark gold)
17 stupendous:  #8E9800 (olive-green)
18 phenomenal:  #498E00 (green)
19 colossal:    #0EAE28 (bright green)
20 legendary:   #0EB366 (teal-green)
```

### Potential Colors (0-11)
```
 0 announcer:         #700BA2 (dark purple)
 1 bench warmer:      #910B9D (purple)
 2 role player:       #AD0B88 (magenta-purple)
 3 6th man:           #B70B5A (crimson)
 4 starter:           #9C0B32 (dark red)
 5 star:              #A70B00 (red)
 6 allstar:           #BD2600 (red-orange)
 7 perennial allstar: #CB3100 (orange-red)
 8 superstar:         #D93C00 (dark orange)
 9 MVP:               #E5A64B (gold)
10 hall of famer:     #AC860A (dark gold)
11 all-time great:    #8E9800 (olive-green)
```

Colors are stored in:
- `web/lib/constants.ts` — `SKILL_COLORS`, `POTENTIAL_COLORS`, `getSkillColor()`, `getPotentialColor()`, `getSkillBgColor()`
- `extension/content-scripts/common.js` — `SKILL_COLORS`, `getSkillColor()`

## Database Schema (Supabase)
**Tables**: `profiles`, `players`, `skill_snapshots`, `player_notes`, `player_tags`

### Key RLS Policies
- All tables: authenticated users can SELECT
- `players`: authenticated users can INSERT, UPDATE, and DELETE (DELETE policy was added manually — must run SQL in Supabase if missing)
- `skill_snapshots`: INSERT restricted to `captured_by = auth.uid()`
- `player_notes`/`player_tags`: users manage their own records

### Important: DELETE Policy
If bulk delete silently fails (returns success but 0 rows), the DELETE RLS policy is missing. Run:
```sql
CREATE POLICY "Anyone can delete players" ON players FOR DELETE TO authenticated USING (true);
```

### Upsert Pattern
Extension uses PostgREST upsert: `POST /rest/v1/players?on_conflict=bb_player_id` with header `Prefer: resolution=merge-duplicates,return=representation`

## Known Issues & Gotchas
1. **BB positions are unreliable** — the game auto-classifies based on skills, not how managers use players. Position is editable on the dashboard for manual override.
2. **Auth token expiration** — if saves fail with 401/403, the extension auto-refreshes the token. If that fails, user needs to log out and back in via the popup.
3. **"Saved Locally" count stale after DB delete** — use "Clear Local Data" button in popup to reset local cache.
4. **Dev server dies** — if `npm run dev` stops responding, kill the process on port 3000 and restart. On Windows: `taskkill //PID <pid> //F` then `cd web && npm run dev`.
5. **Snapshot dedup** — same player captured multiple times on the same day updates the existing snapshot instead of creating duplicates. Requires UPDATE RLS policy on `skill_snapshots` (see schema.sql). Run this SQL if policy is missing: `CREATE POLICY "Users update own snapshots" ON skill_snapshots FOR UPDATE TO authenticated USING (captured_by = auth.uid());`
6. **BB serves HTTP sometimes** — manifest uses `*://` patterns to match both HTTP and HTTPS.

## Pending / Future Work
- **Training simulator / path optimizer** — The most valuable planned feature. Given a player's current skills, age, height, potential, and a target build, calculate the optimal weekly training path. See "BuzzerBeater Training Mechanics" section below for all known formulas and data. Ultimate goal: user sets a desired final build → tool outputs week-by-week training plan.
- **Training history parser** — BB has training history pages showing per-week skill changes. Could be parsed to enrich player data and validate training simulator accuracy.
- ~~**Duplicate snapshot detection**~~ — DONE. Same player + same day = update existing snapshot. Implemented in all 3 extension parsers + API scout routes.
- ~~**Vercel deployment**~~ — DONE. Deployed via GitHub (`Rn5ho/BB-project`) → Vercel. Root directory set to `web/`. Env vars configured in Vercel dashboard.
- **Multi-country support** — currently hardcoded to 'Slovenia'. Schema supports nationality field.

## BuzzerBeater Training Mechanics
All data below sourced from BB community research and forum posts. This is the foundation for the training simulator feature.

### Training Formula
```
weekly_skill_gain = base_training_points
  × age_multiplier[player_age]
  × height_multiplier[player_height][skill]
  × trainer_multiplier[trainer_level]
  × minutes_factor (0.0-1.0, based on playing time in relevant position)
  × potential_slowdown_factor (diminishes as skills approach potential cap)
  + elastic_training_bonus
```

### Age Multiplier
Young players train MUCH faster. This is why U-21 scouting/development is critical.
```
Age  Multiplier
18   1.00
19   0.95
20   0.88
21   0.78
22   0.70
23   0.60
24   0.51
25   0.42
26   0.35
27   0.27
28   0.21
29   0.16
30   0.11
31   0.07
32   0.05
33   0.03
34   0.02
35   0.01
36   0.00
```

### Height Multiplier (per skill)
Height affects training speed differently per skill. Short players train outside skills faster, tall players train inside skills faster. JS/DR/PA are height-independent.
```
Height  JS    JR    OD    HA    DR    PA    IS    ID    RB    SB
175     1     1.5   1.5   1.5   1     1     0.5   0.5   0.5   0.5
178     1     1.45  1.45  1.45  1     1     0.55  0.55  0.55  0.55
180     1     1.4   1.4   1.4   1     1     0.6   0.6   0.6   0.6
183     1     1.35  1.35  1.35  1     1     0.65  0.65  0.65  0.65
185     1     1.3   1.3   1.3   1     1     0.7   0.7   0.7   0.7
188     1     1.25  1.25  1.25  1     1     0.75  0.75  0.75  0.75
190     1     1.2   1.2   1.2   1     1     0.8   0.8   0.8   0.8
193     1     1.15  1.15  1.15  1     1     0.85  0.85  0.85  0.85
196     1     1.1   1.1   1.1   1     1     0.9   0.9   0.9   0.9
198     1     1.05  1.05  1.05  1     1     0.95  0.95  0.95  0.95
201     1     1     1     1     1     1     1     1     1     1
203     1     0.95  0.95  0.95  1     1     1.05  1.05  1.05  1.05
206     1     0.9   0.9   0.9   1     1     1.1   1.1   1.1   1.1
208     1     0.85  0.85  0.85  1     1     1.15  1.15  1.15  1.15
211     1     0.8   0.8   0.8   1     1     1.2   1.2   1.2   1.2
213     1     0.75  0.75  0.75  1     1     1.25  1.25  1.25  1.25
216     1     0.7   0.7   0.7   1     1     1.3   1.3   1.3   1.3
218     1     0.65  0.65  0.65  1     1     1.35  1.35  1.35  1.35
221     1     0.6   0.6   0.6   1     1     1.4   1.4   1.4   1.4
224     1     0.55  0.55  0.55  1     1     1.45  1.45  1.45  1.45
226     1     0.5   0.5   0.5   1     1     1.5   1.5   1.5   1.5
229     1     0.45  0.45  0.45  1     1     1.55  1.55  1.55  1.55
```

### Trainer Quality Multiplier
```
Level             Multiplier
1. minimal        0.88
2. basic          0.91
3. competent      0.94
4. advanced       0.97
5. superior       1.00
6. exceptional    1.03
7. world-renowned 1.06
```

### Elastic Training (Drag Coefficients)
When associated skills have a large gap, the lower skill gets a bonus when the higher one is trained. Formula: `bonus = coefficient × (higher_skill - lower_skill)`, added as percentage increase to training.
```
Trained Skill → Towed Skill → Drag Coefficient
JS → DR → 0.011
OD → HN → 0.007
HN → OD → 0.050  (big one!)
DR → HN → 0.005
PS → HN → 0.030
IS → ID → 0.001
ID → IS → 0.020
RB → IS and ID → 0.20 and 0.010
JR → JS → ?  (unknown coefficient)
SB → ID and RB → ?  (unknown coefficients)
```
Example: JS=5, DR=15 → coefficient 0.011 → drag = (15-5) × 0.011 = 0.11 (11% bonus to JS training)

### Training Types and Point Distribution
BB has many training types that distribute points across skills differently based on position. Key examples:
- **Pressure PG**: JS=0, JR=0, OD=430, HA=60, DR=40, PA=0, IS=0, ID=80, RB=0, SB=0 → Total=610
- **Shot Blocking C**: JS=30, JR=0, OD=0, HA=0, DR=0, PA=0, IS=0, ID=190, RB=80, SB=680 → Total=980
- **Inside Scoring PF**: JS=117, JR=0, OD=0, HA=0, DR=0, PA=0, IS=504, ID=45, RB=0, SB=0 → Total=666
- **Ball Handling PG**: JS=0, JR=0, OD=0, HA=100, DR=800, PA=350, IS=0, ID=0, RB=0, SB=0 → Total=1050
- **Passing PG**: JS=0, JR=0, OD=0, HA=0, DR=180, PA=190, IS=0, ID=720, RB=0, SB=0 → Total=1080
(Full training type × position matrix has ~100+ combinations — see forum data for complete table)

### Skill Rounding
BB stores skills as decimals internally but displays rounded-UP integers. A displayed "15" (marvelous) means the backend value is anywhere from 14.01 to 15.00. This means:
- Two players both showing "8" could differ by almost a full skill level internally
- A player at 14.01 displays as 15 but is dramatically weaker than 14.99 (also 15)
- Training gains may not show as visible level-ups for a while (accumulating decimals)

### Player Skill Ranges
- **Age 18 (drafted)**: Skills randomized between 1-7
- **Age 19 (drafted)**: Skills can be up to 10
- **Potential**: Acts as a soft cap — training slows dramatically (but never reaches zero) as skills approach the potential ceiling

### Key Insight for Training Optimizer
The optimal training path depends on:
1. **Age urgency** — training multiplier drops fast, so early seasons matter most
2. **Height advantage** — train skills where height gives a bonus first (more efficient)
3. **Elastic synergy** — training high-coefficient pairs first creates cascading bonuses
4. **Position requirements** — different positions need different skill distributions
5. **Minutes availability** — player must play the right position to get full training benefit

## Key Decisions
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-07 | Project created | Initial setup |
| 2026-02-07 | Next.js + Supabase + Chrome Extension | Best fit for non-web-dev maintainer: zero-config deploy, auto-generated API, no build step for extension |
| 2026-02-07 | Skills stored as integers 1-20 | Enables sorting, comparison, math. Text labels derived in UI |
| 2026-02-07 | Local-first extension storage | Saves to chrome.storage.local before network sync, preventing data loss during scouting |
| 2026-02-07 | Slovenia-specific for now | MVP scoped to one country, can expand later |
| 2026-02-07 | Position editable in dashboard | BB's auto-classified position is unreliable; managers override manually |
| 2026-02-07 | Skill keyword validation for roster parsing | Instead of requiring position near player ID, validate by checking for 3+ skill keywords in nearby text — more robust |
| 2026-02-07 | Overlay minimize instead of remove | Close button hides overlay + shows floating "BB" mini button. Can reopen via mini button or popup "Show Overlay" button |
| 2026-02-07 | Exact BB colors from HTML source | User extracted hex codes directly from BB's `<font color>` tags. Stored in constants.ts and common.js |
| 2026-02-07 | `*://` URL patterns in manifest | BB may serve over HTTP or HTTPS; wildcard protocol handles both |
| 2026-02-07 | Name regex uses literal space `[ ]` | `\s+` between name words matched across lines/tabs, pulling in nav text. Literal space prevents this |
| 2026-02-07 | Token auto-refresh in content scripts | Both parsers check 60-second expiry buffer and refresh via `/auth/v1/token?grant_type=refresh_token` before saving |
