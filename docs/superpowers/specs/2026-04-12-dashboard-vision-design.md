# BB Scout Dashboard Vision

**Date:** 2026-04-12
**Status:** Draft — pending user review
**Scope:** Dashboard-wide information architecture and redesign direction. Each page gets its own detailed design spec later.

---

## 1. Context

BB Scout is a scouting tool for the Slovenia U-21 NT manager in BuzzerBeater. An MVP was shipped a while back; since then only the Slovenia page has been actively improved. The rest of the dashboard (Opponents, Compare, Training, Scout, Manual Entry, Player detail) is largely untouched and in varying states of unfinished.

Current phase of the user's work: pre-season market scouting ahead of an approaching Euro championship. The user is broadly collecting international players (97+ tracked and growing) in preparation for opponents they don't yet know.

This spec defines the target vision for the dashboard, the role each page plays, cross-cutting features, and the priority order for page-level redesigns.

---

## 2. Target Information Architecture

Five user-facing pages plus Player detail:

| Page | Role | Primary user |
|------|------|-------------|
| **Slovenia** | Precision tool for NT management — roster selection + prospect development | The user, daily/weekly |
| **World** (rename of Opponents) | Historical record — broad multi-country scouting, DMI trajectory, any-age snapshots | The user, market-scouting phase + in-season opponent prep |
| **Compare** | Side-by-side comparison of 2–N players | Ad-hoc, entered via direct nav OR multi-select from Slovenia/World |
| **Manual Entry** | Fast ingestion of coach-submitted skill reports (BB-Mail / Discord) | In-season, when coaches send updates |
| **Player detail** | Deep view on one player — skill history, DMI-in-context, notes | Drilled into from any list |

**Removed from navbar:**
- **Scout** (BB API manual fetch) — user never used it; API routes retained for future automation work but page is dropped.
- **Training** (simulator) — ambitious unfinished project; hidden until the simulator is reliable enough to trust. Revisited as a standalone future project. The data the user has collected for it is not discarded.

**Kept routes but de-emphasized:**
- API routes under `/api/scout/*` stay — they may power a future Automation page (scheduled DMI refresh, season tick-over job) but that's out of scope here.

---

## 3. Mental Models

Two distinct scouting mental models drive the dashboard's shape:

**Slovenia = Precision tool.** Every player matters individually. The user needs surgical filters ("min OD=15, PA=12, HA=14, JS=13"), archetype detection ("defensive center = low IS, ID≥15, SB≥15, RB≥13"), and training-pathway thresholds for 18–19y/o prospects. Data is fresh and complete because the user cycles them through NT roster to scrape full skills.

**World = Historical record.** Most players have only DMI snapshots; some have full skills (captured opportunistically via market scans). Skills are often 1–2 seasons stale. The user's domain expertise — turning old skill data + position history + DMI trajectory + game-shape context into educated build inferences — is what makes this view useful. The tool's job is to *display* that data well, not filter on it.

→ Advanced per-skill filters and archetype detection are **Slovenia-only**. World gets simpler filters (country multi-select, age bracket, potential tier, Euro region, has-full-skills flag).

---

## 4. Cross-Cutting Features

Features that touch multiple pages and should be designed once, reused everywhere:

### 4.1 Season tick-over / player aging
Slovenia already handles player aging when a new season ticks over. World currently does not — this is a hard requirement per user (players in the tracked set must age alongside the game). Extract the existing aging logic into a shared mechanism that applies to all tracked players (Slovenia + World + any nationality).

### 4.2 Multi-select → Compare
Slovenia and World both show player tables. Both should support multi-select → "Compare selected" action that routes to the Compare page with selected IDs pre-loaded. Compare persists its set (URL state or localStorage) so the user can add players from one page, navigate, and continue adding.

### 4.3 Country multi-select + Euro region preset
Currently the Opponents page shows 60+ country pills in a wrapping list. Replace with:
- A searchable country multi-select (type to filter)
- A saved "Europe" preset (hard-coded list of European BB countries) for championship prep
- An "Include Slovenia" toggle (default off on World, always on in a future unified "All players" mode)

### 4.4 Age filter semantics
`is_nt_player` flag is manual and populated only for Slovenia (per user memory). Age-based filter (18/19/20/21) is the reliable way to scope U-21 views on World. "U-21 only" toggle on World should be equivalent to age ∈ {18,19,20,21}, not the `is_nt_player` flag.

### 4.5 DMI-in-context display
DMI is state-dependent (game-shape-modulated, skill-level-modulated). Wherever DMI is displayed alongside other player data, Game Shape should be adjacent or visually linked so the user can instantly mentally normalize ("that's 3m at GS9 → elite build" vs "1.7m at GS8 → same build on poor form"). Applies to table rows on Slovenia/World and to Player detail.

### 4.6 Data-completeness indicators
DMI-only vs full-skills is a real distinction that changes what the user can do with a player. Show it consistently (badge or column) across World and Player detail.

---

## 5. Per-Page Redesign Briefs

Each brief is a one-paragraph intent statement. Full designs come in separate per-page spec sessions.

### 5.1 World (rename of Opponents) — Priority 1
Replaces the current flat 97-player table. Country pills → searchable multi-select + Europe preset + optional Include Slovenia. Filters: age bracket (18/19/20/21), position, potential tier, has-full-skills. Fix the DMI default sort (currently empty for most rows). Table columns: player + country, age, position, potential, DMI (with GS adjacent), most-recent skills snapshot age, data-completeness badge. Multi-select → Compare. Season aging applied to all rows. No archetype detection, no advanced per-skill filters — this view is a historical record, not a precision tool.

### 5.2 Slovenia — Priority 2
Stays focused as the precision tool. New capabilities: (a) **advanced per-skill filters** — min/exact thresholds on any skill, combinable (e.g. OD≥15 AND PA≥12 AND HA≥14 AND JS≥13 → matching playmakers); (b) **player archetype detection** — user-defined profiles (e.g. "defensive center", "playmaker") that match players by skill-threshold rules, displayed as labels/badges on matching players; (c) **training-pathway hints** for 18–19y/o based on early skill patterns. These are advanced and may split into smaller shippable slices — the archetype rule engine is reused by training-pathway hints.

### 5.3 Manual Entry — Priority 3
Redesigned for speed on coach-submitted reports. Two input modes, text-paste first:
- **Paste BB-Mail text** (multi-language: Portuguese, Slovenian, etc.) → parser maps localized skill names and level names to canonical values → match existing player (by name or BB player ID in link) or create new. Requires a multi-language BB skill-name dictionary.
- **Screenshot upload** (Discord-sent BB player box images) — later enhancement, uses vision AI. Ships after the paste flow proves out.
Deterministic paste parser is the main build; screenshot is a follow-up.

### 5.4 Player detail — Priority 4
Adds: (a) **skill progression chart** — per-skill lines across snapshots over time, so the user can see what the player was trained on; (b) **DMI-in-context** — DMI shown with Game Shape inline, visually linked; (c) **notes field** — freeform text per player for scouting memory. Drops the idea of a season-by-season DMI chart (DMI isn't a growth curve — skills are). Archetype label and training-pathway suggestions are dependent on Slovenia work; they land here once that ships.

---

## 6. Priority Order & Rollout

Ship small incremental commits to main (Vercel auto-deploys; user tests live between changes). Each numbered redesign gets its own brainstorm → spec → implementation plan cycle.

1. **World** — blocks current market-scouting work; biggest leverage today.
2. **Slovenia advanced filters + archetypes** — needed for pre-season roster selection (the 18 players for the upcoming season).
3. **Manual Entry** — becomes critical once the season starts and coach reports flow in; not urgent during market phase.
4. **Player detail** — ongoing nice-to-have; skill progression chart adds most value once the pages above exist.

Cross-cutting features land alongside whichever page needs them first:
- Season aging / multi-select / country picker / data-completeness badges → with World (priority 1)
- Archetype rule engine → with Slovenia (priority 2); reused by Player detail later
- Compare persistence → with Compare updates triggered by multi-select

---

## 7. Out of Scope

- **Training simulator** — standalone future project. Keeps its collected data; revisited when reliability can be guaranteed.
- **Scout page (manual BB API fetch)** — dropped from navbar. API routes stay.
- **Automation / scheduled refresh** — possible future "Automation" page powered by existing `/api/scout/*` routes. Not in this rework.
- **Opponent NT prediction / championship opponent draws** — outside scouting tool scope.
- **Full vision-AI OCR for screenshots** — shipped after text-paste Manual Entry proves the flow.

---

## 8. Open Questions

*(none blocking — reconfirm with user during per-page brainstorms)*

- Exact Euro-region country list (use BB's region classification if available, else hard-code).
- Archetype rule format: user-editable UI, or code-defined rules the user tweaks via PR? (Ask during Slovenia brainstorm.)
- Compare persistence mechanism: URL state vs localStorage vs DB-backed saved sets. (Ask during Compare/multi-select brainstorm.)
