# BB Scout v2 — Player Archetypes Design

**Date:** 2026-07-10
**Status:** Draft — pending user review
**Scope:** A user-defined archetype engine: named, age-progressive skill-threshold profiles that automatically badge matching players and act as a filter. Slovenia-focused (the precision tool).

---

## 1. Motivation

The Slovenia page shows every U-21 candidate, but the manager still has to eyeball 12 skills per player to judge what each one *is* — a defensive center, a playmaker, a sharpshooter — and whether a young player is developing toward a useful build. Archetypes encode that judgment once as rules, then apply it to every player automatically.

Key domain insight (from the manager): a build is driven by **starting skills + potential at draft**, and by **age 19–20 the final archetype is usually clear**. A player training toward a build shows *lower but proportional* skills earlier and grows into the thresholds. So an archetype is not a single set of thresholds — it is a **progression across ages 18→21**.

---

## 2. What an archetype is

An **archetype** is:
- a **name** (e.g. "Defensive Center") and optional description,
- a small set of **condition rows** the user chooses — only the skills/attributes that matter; unlisted fields are never checked,
- each row: a **field** + an **operator** (`≥` or `≤`) + a **threshold per age** (18, 19, 20, 21), where any age cell may be **blank** (= no requirement at that age).

Conceptually a grid the user fills in (rows they add, columns 18–21):

```
Condition        18     19     20     21
Inside Def   (≥)  6      9      12     15
Shot Blocking(≥)  6      10     13     14
Rebounding   (≥)  6      8      11     13
Inside Shot  (≤)  3      4      5      6
Potential    (≥)  7      7      7      7
```

**Fields available in a row:**
- Any of the 12 skills: Jump Shot, Jump Range, Outside Def, Handling, Driving, Passing, Inside Shot, Inside Def, Rebounding, Shot Blocking, Stamina, Free Throw.
- Potential (0–11), Height (cm), TSP.
- Position (a special row: `is` / `is not` one of PG/SG/SF/PF/C — evaluated the same at all ages; no per-age columns).

**Operator per row:** `≥` (min) or `≤` (max). One operator per row; a field like Inside Shot uses `≤` to cap it for a defensive specialist. (If the user needs both a floor and a ceiling on the same skill, they add two rows.)

---

## 3. How matching works

For a given player:
1. Determine the player's **current age** (`ageNow`, already computed season-aware). If age is unknown (null), the player matches **no** archetype.
2. For each archetype, read the **column for that age**. Every condition row that has a **non-blank cell** for that age must pass (`skill ≥/≤ threshold`). Position rows (no age columns) must always pass.
3. If **all applicable cells pass**, the player **matches** that archetype.
4. If an archetype has **no cell set for the player's age** across all its rows (e.g. it's only defined 20–21 and the player is 18), it simply does not match at that age — not an error.

A player can match multiple archetypes (rare but allowed).

**Match evaluator** is a pure function — `evaluateArchetype(player, archetype, ageNow) → { matches: boolean, checks: {field, op, threshold, actual, pass}[] }` — unit-tested independently of the DB and UI. The `checks` array powers the "why does/doesn't this player qualify" view.

---

## 4. Where matches surface

- **Slovenia table:** a compact **Archetype badge** per matching player (archetype name; if multiple, show the primary/first with a "+N" hint). Colored chip, dark-theme.
- **Player profile:** an "Archetypes" section listing matched archetypes; for the top matches (and any near-miss the user expands), show the **per-condition pass/fail** for the player's current age tier (green tick / red cross with actual vs threshold) — so the manager sees exactly why a player qualifies or narrowly misses.
- **Filter:** the Slovenia filter bar gains an **"Archetype"** dropdown (All / one of the defined archetypes). Selecting one shows only players matching it. Client-side, like the existing filters, and persisted with the other table settings.

Scope: **Slovenia page + player profile** in this build. World (opponents) can reuse the same engine later; out of scope here.

---

## 5. Storage & the default library (the "keep me updated without overwriting me" model)

Two layers:

- **Default library — in code.** A curated array of starter archetypes (see §7) with age progressions pre-filled. Versioned in the app; the developer can add/improve defaults over time.
- **User archetypes — in the database.** A `archetypes` table holding the user's working set: their edits to a default, brand-new custom archetypes, and any defaults they've hidden.

**Merge rule (what the app shows):**
- A default archetype appears automatically **unless** the user has an override or a hide for it.
- Editing a default creates a **DB override** keyed to that default's stable `key`; from then the user's version wins and code changes to that default never overwrite it. **"Reset to default"** deletes the override, restoring the code version.
- **Custom** archetypes (user-created) live only in the DB; code never touches them.
- **Hiding** a default sets a hidden flag; it disappears from the effective list until un-hidden.
- A newly shipped default (a `key` the user has never seen) simply appears as another starting option.

**Table shape** (`archetypes`):
- `id` (serial pk)
- `key` (text, nullable) — the stable id of the default this row overrides; `null` for custom archetypes
- `name` (text)
- `description` (text, nullable)
- `rules` (jsonb) — the condition rows (see §6)
- `hidden` (boolean, default false) — for a default the user wants gone (row carries the `key`, empty/ignored rules)
- `updated_at` (timestamptz)

The **effective archetype list** = code defaults, each replaced by its DB override (matched on `key`) or dropped if hidden, plus all custom DB rows. Computed in one place (`getEffectiveArchetypes()`).

---

## 6. Rule data shape

```ts
type ArchetypeField =
  | 'jump_shot' | 'jump_range' | 'outside_def' | 'handling' | 'driving' | 'passing'
  | 'inside_shot' | 'inside_def' | 'rebounding' | 'shot_blocking' | 'stamina' | 'free_throw'
  | 'potential' | 'height_cm' | 'tsp';

interface SkillCondition {
  kind: 'field';
  field: ArchetypeField;
  op: '>=' | '<=';
  // threshold per age; omit/undefine an age to leave it blank (no requirement)
  byAge: { 18?: number; 19?: number; 20?: number; 21?: number };
}

interface PositionCondition {
  kind: 'position';
  op: 'is' | 'isNot';
  positions: ('PG' | 'SG' | 'SF' | 'PF' | 'C')[];   // no age columns; applies at all ages
}

type ArchetypeCondition = SkillCondition | PositionCondition;

interface ArchetypeRules { conditions: ArchetypeCondition[] }
```

`potential`/`height_cm` are constant across a season; the editor still shows their age columns for consistency, with a **"fill across all ages"** convenience so the user sets one value that populates 18–21. Match logic treats them identically to skills.

---

## 7. Starter default library (code)

Ship ~8 as editable examples (age progressions pre-filled from BB meta; exact numbers finalized during implementation and tunable by the user):

1. **Defensive Center** — ID, SB, RB ramping to 15/14/13; IS capped low; Pot ≥ 7; height tall.
2. **Scoring Center / Post** — IS, RB up; ID moderate; height tall; Pot ≥ 8.
3. **Two-Way Big** — IS, ID, RB, SB all moderate-high; height tall.
4. **Playmaker (PG)** — Passing, Handling, Driving high; some JS/JR.
5. **Scoring Guard** — JS, JR, Driving high.
6. **3&D Wing** — JS/JR + Outside Def; moderate rest.
7. **Slasher** — Driving, Handling high; IS moderate.
8. **Sharpshooter** — JS, JR very high; FT high.

Each is just a starting point — the whole value is that the user edits them to their own read of the game.

---

## 8. Components (isolation & testing)

- `lib/archetypes/types.ts` — the types above.
- `lib/archetypes/defaults.ts` — the code default library.
- `lib/archetypes/evaluate.ts` — **pure** `evaluateArchetype(player, archetype, ageNow)` + `matchingArchetypes(player, ageNow, archetypes)`. Unit-tested: age-tier selection, blank cells, `≥`/`≤`, position rows, unknown age, multi-match, "no tier for this age".
- `queries/archetypes.ts` — `getEffectiveArchetypes()` (merge code + DB) and CRUD used by the editor actions.
- `app/archetypes/page.tsx` + `actions.ts` — the editor tab (list, create, edit, reset-to-default, hide, delete-custom).
- `components/archetypes/ArchetypeEditor.tsx` — the grid editor (add/remove condition rows, per-age cells, fill-across).
- `components/ArchetypeBadge.tsx` — the chip.
- Slovenia page + PlayerTable + filter bar + player profile — wired to consume matches (client-side, using the effective archetype list passed from the server).

Schema adds one `archetypes` table (Drizzle migration).

---

## 9. Out of scope (future)

- Archetypes on the World/opponents view.
- Training-path *recommendations* ("to become X, train Y next") — this design detects/labels, it doesn't prescribe. The per-condition pass/fail hints at gaps, which is most of the value.
- OR / nested logic, derived stats beyond TSP.
- Sharing/exporting archetype sets.

---

## 10. Open questions

*(none blocking)*
- Exact default thresholds per age — finalized in implementation, fully user-tunable afterward.
- Badge display when a player matches 3+ archetypes — show first + "+N", full list on profile (assumed; trivial to adjust).
