// Census-corpus hypothesis tests (2026-07-18): use the snapshot-pop corpus of ALL
// tracked clubs to arbitrate the rate-cell conflicts surfaced by the community-paste
// investigation (user-notes/community-paste-2026-07.md) — no own-club schedule needed.
//
// Method per docs/research/training/README.md "Recalibration loop": restrict to
// club-windows whose inferred training is unambiguous (confidence 'high', with a
// sensitivity pass at high+medium), then compare OBSERVED pop counts on a contested
// skill against EXPECTED pops under each hypothesis. Expected pops per player-window =
// predicted sublevel gain (uniform sublevel prior => E[integer crossings] = gain).
//
// Circularity note: windows were classified by inferClubTraining USING bbscout rates,
// and a contested-skill pop contributes (a little) to choosing the training family —
// this biases observed counts UPWARD in selected windows, i.e. TOWARD the higher-rate
// hypothesis. A result clearly below the high hypothesis is therefore decisive against
// it; a result at/above it is only suggestive.
//
// Run from v2/ on a machine with DATABASE_URL (Hetzner box):
//   npx tsx scripts/training/census-hypothesis-tests.mts
import { config } from 'dotenv';
config({ path: '.env.local' });

// Dynamic imports AFTER dotenv (repo convention for box-run scripts): static imports
// hoist above config(), and src/db reads DATABASE_URL at module scope.
const { asc, isNotNull, sql } = await import('drizzle-orm');
const { db, players, seasons, snapshots } = await import('../../src/db/index');
const { playerStateFromSnapshot, minutesAtPositions } = await import('../../src/lib/training/bridge');
const { inferClubTraining } = await import('../../src/lib/training/infer');
const { detectPops } = await import('../../src/lib/training/pops');
const { weekStep } = await import('../../src/lib/training/engine');
const { BBSCOUT, BBSCOUT_HA_FLAT } = await import('../../src/lib/training/models/bbscout');
const { SKILL_KEYS } = await import('../../src/lib/training/types');
type PlayerWindowEvidence = import('../../src/lib/training/infer').PlayerWindowEvidence;
type FullSnap = import('../../src/lib/training/pops').FullSnap;
type PopEvent = import('../../src/lib/training/pops').PopEvent;
type PlayerState = import('../../src/lib/training/engine').PlayerState;
type ModelParams = import('../../src/lib/training/types').ModelParams;
type SkillKey = import('../../src/lib/training/types').SkillKey;
type WeekMinutes = import('../../src/queries/minutes').WeekMinutes;

type SnapRow = typeof snapshots.$inferSelect;
const WEEK_MS = 7 * 86_400_000;
const ASSUMED_COACH_LEVEL = 5; // same neutral assumption as inference

// ─── hypothesis variants (contested cells only) ──────────────────────────────
function withRates(id: string, patch: Record<number, Partial<Record<SkillKey, number>>>): ModelParams {
  const v = structuredClone(BBSCOUT);
  v.id = id as ModelParams['id'];
  const rates = structuredClone(v.rates.value);
  for (const [tid, row] of Object.entries(patch)) rates[Number(tid)] = { ...rates[Number(tid)], ...row };
  v.rates = { ...v.rates, value: rates };
  return v;
}
const JR_DOUBLED = withRates('jr-doubled', { 1: { jr: 0.2 }, 2: { jr: 0.15 } });
const ISID_DOUBLED = withRates('isid-doubled', { 21: { id: 0.1 }, 24: { is: 0.1 } });

// ─── evidence building (mirrors src/server/sync/inference.ts) ────────────────
function toFullSnap(s: SnapRow): FullSnap {
  return {
    capturedAt: s.capturedAt,
    skills: {
      js: s.jumpShot, jr: s.jumpRange, od: s.outsideDef, ha: s.handling, dr: s.driving,
      pa: s.passing, is: s.insideShot, id: s.insideDef, rb: s.rebounding, sb: s.shotBlocking,
      st: s.stamina, ft: s.freeThrow,
    },
  };
}
function stateFromSnapRow(s: SnapRow, heightCm: number, potential: number): PlayerState {
  return playerStateFromSnapshot({
    skills: {
      jump_shot: s.jumpShot, jump_range: s.jumpRange, outside_def: s.outsideDef,
      handling: s.handling, driving: s.driving, passing: s.passing,
      inside_shot: s.insideShot, inside_def: s.insideDef, rebounding: s.rebounding,
      shot_blocking: s.shotBlocking,
    },
    age: s.age ?? 18, heightCm, potential,
    stamina: s.stamina, freeThrow: s.freeThrow,
  });
}
const SKILL_COLS = [
  'jumpShot', 'jumpRange', 'outsideDef', 'handling', 'driving', 'passing',
  'insideShot', 'insideDef', 'rebounding', 'shotBlocking', 'stamina', 'freeThrow',
] as const;
function collapseSameDayRows(snaps: SnapRow[]): SnapRow[] {
  const out: SnapRow[] = [];
  for (const s of snaps) {
    const last = out[out.length - 1];
    if (last && (s.capturedAt.getTime() - last.capturedAt.getTime()) / 86_400_000 < 0.5) {
      const merged = { ...s };
      const fill = merged as Record<(typeof SKILL_COLS)[number], number | null>;
      for (const k of SKILL_COLS) if (fill[k] == null && last[k] != null) fill[k] = last[k];
      merged.ownerTeamId ??= last.ownerTeamId;
      merged.potential ??= last.potential;
      merged.age ??= last.age;
      out[out.length - 1] = merged;
    } else out.push(s);
  }
  return out;
}

/** Predicted per-skill sublevel gains over a window under `model` (inference semantics:
 *  observed minutes weeks extrapolated to the window length; no minutes data = full). */
function predictedGains(ev: PlayerWindowEvidence, tid: number, model: ModelParams): Record<SkillKey, number> {
  const total = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as Record<SkillKey, number>;
  if (ev.weeks.length === 0) {
    const r = weekStep(ev.state, { trainingId: tid, coachLevel: ASSUMED_COACH_LEVEL }, model);
    for (const k of SKILL_KEYS) total[k] = r.gains[k] * ev.windowWeeks;
    return total;
  }
  for (const w of ev.weeks) {
    const minutes = minutesAtPositions(w, tid);
    const r = weekStep(ev.state, { trainingId: tid, coachLevel: ASSUMED_COACH_LEVEL, minutes }, model);
    for (const k of SKILL_KEYS) total[k] += r.gains[k];
  }
  const scale = ev.windowWeeks / ev.weeks.length;
  for (const k of SKILL_KEYS) total[k] *= scale;
  return total;
}

// ─── main ────────────────────────────────────────────────────────────────────
const [fullSnaps, playerRows, seasonRows, minutesRows] = await Promise.all([
  db.select().from(snapshots).where(isNotNull(snapshots.jumpShot))
    .orderBy(asc(snapshots.playerId), asc(snapshots.capturedAt)),
  db.select({ id: players.bbPlayerId, heightCm: players.heightCm }).from(players),
  db.select().from(seasons),
  db.execute(sql`
    select pmm.player_id, m.season, m.season_week,
      sum(pmm.min_pg)::int as min_pg, sum(pmm.min_sg)::int as min_sg, sum(pmm.min_sf)::int as min_sf,
      sum(pmm.min_pf)::int as min_pf, sum(pmm.min_c)::int as min_c, count(*)::int as games
    from player_match_minutes pmm
    join matches m using (match_id)
    where m.season_week is not null
    group by 1, 2, 3
  `),
]);
const playerById = new Map(playerRows.map((p) => [p.id, p]));
const seasonById = new Map(seasonRows.map((s) => [s.id, s]));
const minutesByPlayer = new Map<number, Array<WeekMinutes & { range: [Date, Date] }>>();
for (const r of minutesRows.rows as Record<string, unknown>[]) {
  const seasonRow = seasonById.get(Number(r.season));
  if (!seasonRow) continue;
  const wk: WeekMinutes = {
    season: Number(r.season), seasonWeek: Number(r.season_week),
    minPg: Number(r.min_pg), minSg: Number(r.min_sg), minSf: Number(r.min_sf),
    minPf: Number(r.min_pf), minC: Number(r.min_c), games: Number(r.games),
  };
  const start = new Date(seasonRow.start.getTime() + (wk.seasonWeek - 1) * WEEK_MS);
  const list = minutesByPlayer.get(Number(r.player_id)) ?? [];
  list.push({ ...wk, range: [start, new Date(start.getTime() + WEEK_MS)] });
  minutesByPlayer.set(Number(r.player_id), list);
}

const snapsByPlayer = new Map<number, SnapRow[]>();
for (const s of fullSnaps) {
  const list = snapsByPlayer.get(s.playerId) ?? [];
  list.push(s);
  snapsByPlayer.set(s.playerId, list);
}
const groups = new Map<string, { teamId: number; evidence: PlayerWindowEvidence[] }>();
for (const [playerId, rawSnaps] of snapsByPlayer) {
  const player = playerById.get(playerId);
  const snaps = collapseSameDayRows(rawSnaps);
  for (let i = 1; i < snaps.length; i++) {
    const prev = snaps[i - 1];
    const cur = snaps[i];
    const events: PopEvent[] = detectPops([toFullSnap(prev), toFullSnap(cur)]);
    const teamId = cur.ownerTeamId ?? null;
    if (teamId == null || player?.heightCm == null) continue;
    if (prev.ownerTeamId != null && prev.ownerTeamId !== teamId) continue;
    const days = (cur.capturedAt.getTime() - prev.capturedAt.getTime()) / 86_400_000;
    if (days < 0.5) continue;
    const windowWeeks = Math.max(1, Math.round(days / 7));
    const weeks = (minutesByPlayer.get(playerId) ?? [])
      .filter((w) => w.range[0] < cur.capturedAt && w.range[1] > prev.capturedAt)
      .map(({ range: _range, ...wk }) => wk);
    const key = `${teamId}|${prev.capturedAt.toISOString().slice(0, 10)}|${cur.capturedAt.toISOString().slice(0, 10)}`;
    const group = groups.get(key) ?? { teamId, evidence: [] };
    group.evidence.push({
      playerId,
      state: stateFromSnapRow(prev, player.heightCm, cur.potential ?? prev.potential ?? 0),
      pops: events, weeks, windowWeeks,
    });
    groups.set(key, group);
  }
}
console.log(`corpus: ${snapsByPlayer.size} players, ${groups.size} club-windows`);

// ─── tests ───────────────────────────────────────────────────────────────────
interface Test {
  name: string;
  trainingIds: number[];           // window must be inferred as one of these
  skill: SkillKey;                 // contested skill
  hypoA: ModelParams; hypoB: ModelParams;
  labelA: string; labelB: string;
  playerFilter?: (ev: PlayerWindowEvidence) => boolean;
}
const TESTS: Test[] = [
  { name: 'JS→JR towing (ids 1/2)', trainingIds: [1, 2], skill: 'jr', hypoA: BBSCOUT, hypoB: JR_DOUBLED, labelA: 'jr 0.1/0.05 (bbscout)', labelB: 'jr 0.2/0.15 (BuzzerIQ)' },
  { name: 'IS(C)→ID cross (id 21)', trainingIds: [21], skill: 'id', hypoA: BBSCOUT, hypoB: ISID_DOUBLED, labelA: 'id 0.05 (bbscout)', labelB: 'id 0.10 (BuzzerIQ)' },
  { name: 'ID(C)→IS cross (id 24)', trainingIds: [24], skill: 'is', hypoA: BBSCOUT, hypoB: ISID_DOUBLED, labelA: 'is 0.05 (bbscout)', labelB: 'is 0.10 (BuzzerIQ)' },
  { name: 'HA height ≥206cm (1v1/HA drills)', trainingIds: [12, 13, 14, 15, 16, 17], skill: 'ha', hypoA: BBSCOUT, hypoB: BBSCOUT_HA_FLAT, labelA: 'ha declining (bbscout)', labelB: 'ha flat (BuzzerIQ)', playerFilter: (ev) => ev.state.heightCm >= 206 },
  { name: 'IS height ≤183cm (IS drills)', trainingIds: [21, 22, 23], skill: 'is', hypoA: BBSCOUT, hypoB: BBSCOUT, labelA: 'is curve (coverage probe only)', labelB: '—', playerFilter: (ev) => ev.state.heightCm <= 183 },
];

for (const minConf of ['high', 'medium'] as const) {
  console.log(`\n═══ windows at confidence ≥ ${minConf} ═══`);
  for (const t of TESTS) {
    let expA = 0, expB = 0, observed = 0, nWindows = 0, nPlayers = 0;
    for (const group of groups.values()) {
      const r = inferClubTraining(group.evidence);
      if (r.inferredTrainingId == null || !t.trainingIds.includes(r.inferredTrainingId)) continue;
      if (r.confidence === 'low' || (minConf === 'high' && r.confidence !== 'high')) continue;
      nWindows++;
      for (const ev of group.evidence) {
        if (t.playerFilter && !t.playerFilter(ev)) continue;
        nPlayers++;
        expA += Math.min(predictedGains(ev, r.inferredTrainingId, t.hypoA)[t.skill], ev.windowWeeks);
        expB += Math.min(predictedGains(ev, r.inferredTrainingId, t.hypoB)[t.skill], ev.windowWeeks);
        observed += ev.pops.filter((p) => p.skill === t.skill && p.delta > 0)
          .reduce((a, p) => a + p.delta, 0);
      }
    }
    const fmt = (x: number) => x.toFixed(1);
    console.log(`${t.name}: ${nWindows} windows, ${nPlayers} player-windows`);
    console.log(`  observed ${t.skill} pops: ${observed}  | expected: ${fmt(expA)} under ${t.labelA}, ${fmt(expB)} under ${t.labelB}` +
      (observed > 0 ? `  | ±${fmt(Math.sqrt(observed))} (Poisson)` : ''));
  }
}
