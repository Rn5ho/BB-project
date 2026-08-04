// v2/scripts/training/journey.mts
// Per-player U-21 journey planner: loads a real tracked player's latest full-skill snapshot,
// resolves a chosen build's targets, and runs the STAGED milestone search (planJourney, in
// src/lib/archetypes/derive/plans.ts) from his CURRENT age/season-week to end of U-21.
//
// Usage: npm run training:journey -- --player <bbPlayerId> --build <archetype name or key>
//   [--coach 6 --yt 6 --gym 1 --tc 1] [--save]
//
// Milestones (owner U-21 calendar): M1 = entering age-21 season week 1, the build must be
// PLAYABLE (squad selection, relaxed targets). M2 = entering age-21 season week FINALIZE_WEEK
// (group stage ends, playoffs begin), the build must be FINALIZED (full targets). After M2,
// only polish.
//
// Read-only unless --save, which deactivates the player's existing active plan(s) and inserts
// this journey's composed blocks as the new active plan (same write path as the planner
// board's savePlan action) — the ONLY write path in this script.
import { config } from 'dotenv';
config({ path: '.env.local' });

function arg(name: string, fallback?: string): string {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing --${name}`);
  }
  const value = process.argv[i + 1];
  if (value === undefined || value.startsWith('--')) throw new Error(`missing --${name}`);
  return value;
}
function argNum(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || i === process.argv.length - 1) return fallback;
  const v = Number(process.argv[i + 1]);
  return Number.isFinite(v) ? v : fallback;
}
const SAVE = process.argv.includes('--save');

const playerId = Number(arg('player'));
if (!Number.isInteger(playerId)) throw new Error('--player <bbPlayerId> must be an integer');
const buildQuery = arg('build');
const coachLevel = argNum('coach', 5);
const youthTrainerLevel = argNum('yt', 5);
const gymLevel = argNum('gym', 0);
const trainingCourtLevel = argNum('tc', 0);

// Dynamic imports AFTER dotenv (repo convention): src/db reads DATABASE_URL at module scope.
const { sql, eq } = await import('drizzle-orm');
const { db, seasons, trainingPlans } = await import('../../src/db/index');
const { seasonWeekOf } = await import('../../src/server/sync/minutes');
const { currentAge } = await import('../../src/lib/domain');
const { getCurrentSeasonId } = await import('../../src/queries/players');
const { getPopAnchors } = await import('../../src/queries/training');
const { getEffectiveArchetypes } = await import('../../src/queries/archetypes');
const { archetypeTargets } = await import('../../src/lib/archetypes/targets');
const { playerStateFromSnapshot, boundsFromAnchors, applyAnchors } = await import('../../src/lib/training/bridge');
const { planJourney, FINALIZE_WEEK } = await import('../../src/lib/archetypes/derive/plans');
const { SKILL_KEYS } = await import('../../src/lib/training/types');
const { getTrainingType } = await import('../../src/lib/training/catalog');
const { displayed } = await import('../../src/lib/training/engine');
type SkillKey = import('../../src/lib/training/types').SkillKey;
type SkillTarget = import('../../src/lib/training/optimize').SkillTarget;
type PlanBlock = { trainingId: number; weeks: number };

// ---- resolve current season + week (src/server/census/candidate-rows.ts currentSeasonWeek pattern) ----
const currentSeason = await getCurrentSeasonId();
const [seasonRow] = await db.select().from(seasons).where(eq(seasons.id, currentSeason));
const currentWeek = seasonRow ? Math.min(14, Math.max(1, seasonWeekOf(new Date(), seasonRow.start))) : 1;

// ---- resolve player + latest full-skill snapshot (any source) ----
const SKILL_COLS = [
  'jump_shot', 'jump_range', 'outside_def', 'handling', 'driving', 'passing',
  'inside_shot', 'inside_def', 'rebounding', 'shot_blocking', 'stamina', 'free_throw',
] as const;
const rows = await db.execute(sql`
  with latest_full as (
    select distinct on (player_id) *
    from snapshots
    where jump_shot is not null and jump_range is not null and outside_def is not null
      and handling is not null and driving is not null and passing is not null
      and inside_shot is not null and inside_def is not null and rebounding is not null
      and shot_blocking is not null and stamina is not null and free_throw is not null
    order by player_id, captured_at desc
  )
  select p.bb_player_id, p.name, p.height_cm, f.age as snap_age, f.season as snap_season,
    f.potential, f.stamina, f.free_throw, f.captured_at,
    f.jump_shot, f.jump_range, f.outside_def, f.handling, f.driving, f.passing,
    f.inside_shot, f.inside_def, f.rebounding, f.shot_blocking,
    coalesce(f.tsp, f.jump_shot + f.jump_range + f.outside_def + f.handling + f.driving + f.passing
           + f.inside_shot + f.inside_def + f.rebounding + f.shot_blocking) as tsp
  from players p
  join latest_full f on f.player_id = p.bb_player_id
  where p.bb_player_id = ${playerId}
`);
const row = (rows.rows as Record<string, unknown>[])[0];
if (!row) throw new Error(`no full-skill snapshot (all 12 skills) on file for player ${playerId} — is he tracked?`);
if (row.height_cm == null) throw new Error(`player ${playerId} has no height_cm on file — cannot project`);

const snapAge = row.snap_age as number | null;
const snapSeason = row.snap_season as number | null;
const ageNow = currentAge(snapAge, snapSeason, currentSeason);
if (ageNow == null) throw new Error(`player ${playerId}'s latest full snapshot is missing age/season`);
if (ageNow > 21) throw new Error(`${row.name as string} (id ${playerId}) is age ${ageNow} — U-21 journey is over`);

const skillsDb = Object.fromEntries(SKILL_COLS.map((c) => [c, Number(row[c])])) as Record<string, number>;
const potential = row.potential == null ? null : Number(row.potential);
if (potential == null) throw new Error(`player ${playerId} has no potential on file — cannot project`);

let state = playerStateFromSnapshot({
  skills: skillsDb, age: ageNow, heightCm: Number(row.height_cm), potential,
  stamina: skillsDb.stamina, freeThrow: skillsDb.free_throw,
});

// ---- sublevels: tighten with known pops (same as the planner board — src/queries/planner.ts) ----
const anchorRows = await getPopAnchors(playerId);
const anchors = anchorRows
  .filter((a) => (SKILL_KEYS as readonly string[]).includes(a.skill))
  .map((a) => ({
    skill: a.skill as SkillKey, toDisplayed: a.toDisplayed,
    windowStart: a.windowStart, windowEnd: a.windowEnd,
  }));
const bounds = boundsFromAnchors(skillsDb, anchors, new Date());
state = applyAnchors(state, bounds);

// ---- resolve build ----
const archetypes = await getEffectiveArchetypes();
const q = buildQuery.trim().toLowerCase();
const matches = archetypes.filter((a) =>
  a.name.toLowerCase().includes(q) || (a.key !== null && a.key.toLowerCase() === q));
if (matches.length !== 1) {
  const available = archetypes.map((a) => `${a.name}${a.key ? ` (${a.key})` : ' (custom)'}`).sort();
  throw new Error(
    `${matches.length === 0 ? 'no' : `${matches.length} ambiguous`} archetype match for --build "${buildQuery}".\n`
    + `Available:\n${available.map((n) => `  - ${n}`).join('\n')}`,
  );
}
const build = matches[0];

const targetMap = archetypeTargets(build);
const hasCond = (field: string) =>
  build.rules.conditions.some((c) => c.kind === 'field' && c.op === '>=' && c.field === field);
const floorSkill: SkillKey | null = hasCond('outside_def') ? 'od' : hasCond('inside_def') ? 'id' : null;
const targets: SkillTarget[] = SKILL_KEYS
  .filter((k) => targetMap[k] !== undefined)
  .map((k) => ({ skill: k, displayed: targetMap[k]!, priority: (k === 'od' || k === 'id') ? 'high' : 'normal' }));
if (targets.length === 0) throw new Error(`build "${build.name}" has no rate-skill '>=' conditions — nothing to train toward`);
// Display-only mirror of plans.ts's M1 ("playable") relaxation, used purely to annotate the
// M1 checkpoint table below — planJourney applies the authoritative version internally.
const m1Targets: SkillTarget[] = targets.map((t) => ({
  ...t, displayed: Math.max(1, t.displayed - (t.skill === floorSkill ? 2 : 1)),
}));

// ---- staff ----
const staff = { name: 'journey', coachLevel, youthTrainerLevel, gymLevel, trainingCourtLevel };

// ---- run ----
const result = planJourney(state, { age: ageNow, week: currentWeek }, targets, floorSkill, staff);

// ---- print ----
const tspNow = SKILL_KEYS.reduce((a, k) => a + displayed(state.skills[k]), 0);
console.log(`${row.name as string} (id ${playerId}) — age ${ageNow}, season ${currentSeason} week ${currentWeek} — TSP ${tspNow} · potential ${potential}`);
console.log(
  `Build: ${build.name}${build.key ? ` [${build.key}]` : ' [custom]'} — targets: `
  + targets.map((t) => `${t.skill.toUpperCase()}>=${t.displayed}${t.priority === 'high' ? '*' : ''}`).join(' ')
  + (floorSkill ? ` (floor ${floorSkill.toUpperCase()})` : ''),
);
console.log(`Staff: coach ${coachLevel} / YT ${youthTrainerLevel} / gym ${gymLevel} / TC ${trainingCourtLevel}`);
console.log('');

if (result.phases.length === 0) {
  console.log('No training phases — already past every U-21 milestone with nothing left to plan.');
}
for (const phase of result.phases) {
  const weeks = phase.blocks.reduce((a: number, b: PlanBlock) => a + b.weeks, 0);
  const blockStr = phase.blocks.map((b) => `${getTrainingType(b.trainingId).label} x${b.weeks}`).join(' -> ')
    || '(no active targets — already met)';
  console.log(`[${phase.label}] ${weeks}wk: ${blockStr}`);
}
console.log('');

// Checkpoint table: displayed skills at each milestone, with a trailing "*" flagging misses
// against that checkpoint's own target bar (relaxed M1 targets at M1, full targets at M2/end).
function fmtRow(name: string, cp: Record<SkillKey, number> | null, bar: SkillTarget[] | null) {
  const cells = Object.fromEntries(SKILL_KEYS.map((k) => {
    if (!cp) return [k.toUpperCase(), '—'];
    const t = bar?.find((x) => x.skill === k);
    const miss = t !== undefined && cp[k] < t.displayed;
    return [k.toUpperCase(), `${cp[k]}${miss ? '*' : ''}`];
  }));
  return { milestone: name, ...cells };
}
const nowDisplayed = Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(state.skills[k])])) as Record<SkillKey, number>;
const targetRow = { milestone: 'target (M2/end)', ...Object.fromEntries(SKILL_KEYS.map((k) => {
  const t = targets.find((x) => x.skill === k);
  return [k.toUpperCase(), t ? t.displayed : ''];
})) };
console.log('Checkpoints (displayed skills; * = below that milestone\'s target bar):');
console.table([
  fmtRow('now', nowDisplayed, m1Targets),
  fmtRow(`M1 (entering 21 wk1)`, result.checkpoints.m1, m1Targets),
  fmtRow(`M2 (entering 21 wk${FINALIZE_WEEK})`, result.checkpoints.m2, targets),
  fmtRow('end (entering 22 wk1)', result.checkpoints.end, targets),
  targetRow,
]);

const m2Ref = result.checkpoints.m2 ?? result.checkpoints.end;
const misses = targets.filter((t) => m2Ref[t.skill] < t.displayed)
  .map((t) => `${t.skill.toUpperCase()} ${m2Ref[t.skill]}/${t.displayed}`);
console.log('');
console.log(`Playable (M1, entering age-21 wk1): ${result.playable ? 'YES' : 'no'}`);
console.log(`Finalized (M2, entering age-21 wk${FINALIZE_WEEK}): ${result.finalized ? 'YES' : `no — missing: ${misses.join(', ') || '(n/a)'}`}`);
console.log(`Weekly pop rate: ${result.weeklyPopRate.toFixed(2)}/wk`);

const composedBlocks: PlanBlock[] = result.phases.flatMap((p) => p.blocks);
console.log('');
console.log(JSON.stringify({
  player: playerId, name: row.name, build: build.name, ageNow, currentSeason, currentWeek,
  playable: result.playable, finalized: result.finalized,
  weeklyPopRate: Number(result.weeklyPopRate.toFixed(3)),
  phases: result.phases.map((p) => ({ label: p.label, weeks: p.blocks.reduce((a: number, b: PlanBlock) => a + b.weeks, 0) })),
  totalWeeks: composedBlocks.reduce((a, b) => a + b.weeks, 0),
}));

// ---- save (the ONLY write path, only under --save) ----
if (SAVE) {
  if (composedBlocks.length === 0) throw new Error('nothing to save — the composed journey has zero blocks');
  await db.update(trainingPlans).set({ isActive: false }).where(eq(trainingPlans.playerId, playerId));
  const planNotes = `Journey (${build.name}): playable(M1)=${result.playable ? 'yes' : 'no'}, `
    + `finalized(M2, entering 21 wk${FINALIZE_WEEK})=${result.finalized ? 'yes' : 'no'}. `
    + `Generated ${new Date().toISOString()} by training:journey.`;
  const [saved] = await db.insert(trainingPlans).values({
    playerId,
    name: `Journey: ${build.name}`,
    blocks: composedBlocks,
    coachLevel, youthTrainerLevel, gymLevel, trainingCourtLevel,
    horizonAge: 22, horizonWeek: 1,
    isActive: true,
    planNotes,
  }).returning({ id: trainingPlans.id, name: trainingPlans.name });
  console.log('');
  console.log(`Saved plan #${saved.id} "${saved.name}" as the active plan for player ${playerId} — visible (and deletable) on the player page.`);
} else {
  console.log('');
  console.log('(dry run — pass --save to write this as the active plan)');
}

process.exit(0);
