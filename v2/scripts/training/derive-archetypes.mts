// Derive market archetypes + training plans from the season-end flood (spec:
// docs/superpowers/specs/2026-08-04-market-archetypes-design.md).
// Usage (from v2/): npm run training:archetypes            -- part 1 (cohort/clusters/rules)
//                   npm run training:archetypes -- --plans -- + plans/tiers/Slovenia (Tasks 9-11)
//                   npm run training:archetypes -- --plans --coach 6 --yt 6 [--gym 1] [--tc 1]
//                     -- adds a THIRD "custom" staff scenario next to neutral (5/5) and elite
//                     (7/7/gym2/tc2), same as picking staff levels in the training planner.
// Read-only: SELECT statements only. Report goes to docs/research/market-archetypes/REPORT.md.
import { config } from 'dotenv';
config({ path: '.env.local' });
import path from 'node:path';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';

// ---- tunables (spec Global Constraints) ----
const SEASON = 72;
const AGE_REF = 21;
const WINDOW_START = '2026-07-10';
const DELTA = 1.0;
const POT_FLOOR = { outside: 7, wing: 7, inside: 8, appendix: 7 } as const;
const K_RANGE = { outside: [2, 5], wing: [2, 5], inside: [2, 4] } as const;
const SIL_MIN = 0.12; // silhouette runs structurally low in 10-dim shape space; 0.22 over-collapsed to k=1
const JACCARD_MIN = 0.6;
const SEED = 72;
const PLANS = process.argv.includes('--plans');
// Optional custom staff levels (--coach/--yt/--gym/--tc): appended as a third scenario so the
// report shows feasibility under what the owner can actually request from clubs.
function argNum(name: string): number | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || i === process.argv.length - 1) return undefined;
  const v = Number(process.argv[i + 1]);
  return Number.isFinite(v) ? v : undefined;
}
const CUSTOM_STAFF = (() => {
  const coach = argNum('coach'), yt = argNum('yt'), gym = argNum('gym'), tc = argNum('tc');
  if (coach === undefined && yt === undefined && gym === undefined && tc === undefined) return null;
  return {
    coachLevel: coach ?? 5, youthTrainerLevel: yt ?? 5,
    gymLevel: gym ?? 0, trainingCourtLevel: tc ?? 0,
  };
})();

// Dynamic imports AFTER dotenv (repo convention): src/db reads DATABASE_URL at module scope.
const { sql } = await import('drizzle-orm');
const { db } = await import('../../src/db/index');
const { SKILL_KEYS, SKILL_DB_NAMES } = await import('../../src/lib/training/types');
const { assignGroup } = await import('../../src/lib/archetypes/derive/groups');
const { quantile, mean, median, histogram } = await import('../../src/lib/archetypes/derive/stats');
const { shapeVector, wardCluster, kmeans, chooseK, agreement, bootstrapJaccard } =
  await import('../../src/lib/archetypes/derive/cluster');
const { defenseFloorFor, eliteMembers, deriveArchetype, selfMatchRate } =
  await import('../../src/lib/archetypes/derive/rules');
const { mdTable, fmtSkills } = await import('../../src/lib/archetypes/derive/md');
const { capUsagePct } = await import('../../src/lib/training/salary');
const { parseGreekTidy, lastWeekRoster, nearestCluster } =
  await import('../../src/lib/archetypes/derive/greece');
const { STAFF_SCENARIOS, planForCluster } = await import('../../src/lib/archetypes/derive/plans');
const { getTrainingType } = await import('../../src/lib/training/catalog');
type CohortPlayer = import('../../src/lib/archetypes/derive/groups').CohortPlayer;
type Group = import('../../src/lib/archetypes/derive/groups').Group;
type SkillKey = import('../../src/lib/training/types').SkillKey;
type ClusterPlanResult = import('../../src/lib/archetypes/derive/plans').ClusterPlanResult;

const OUT_DIR = path.resolve(process.cwd(), '..', 'docs', 'research', 'market-archetypes');
mkdirSync(OUT_DIR, { recursive: true });

// ---- cohort fetch (latest full-skill market snapshot per player, season+age pinned) ----
const rows = await db.execute(sql`
  with latest as (
    select distinct on (s.player_id)
      s.player_id, s.jump_shot, s.jump_range, s.outside_def, s.handling, s.driving,
      s.passing, s.inside_shot, s.inside_def, s.rebounding, s.shot_blocking,
      s.stamina, s.free_throw, s.tsp, s.potential, s.salary, s.starting_price,
      s.owner_team_name, s.captured_at
    from snapshots s
    where s.source = 'market' and s.season = ${SEASON} and s.age = ${AGE_REF}
      and s.captured_at >= ${WINDOW_START}
      and coalesce(s.is_rookie_listing, false) = false
      and s.jump_shot is not null and s.jump_range is not null and s.outside_def is not null
      and s.handling is not null and s.driving is not null and s.passing is not null
      and s.inside_shot is not null and s.inside_def is not null and s.rebounding is not null
      and s.shot_blocking is not null
    order by s.player_id, s.captured_at desc
  )
  select l.*, p.name, p.height_cm, p.nationality
  from latest l
  join players p on p.bb_player_id = l.player_id
  where p.is_utopian = false and p.height_cm is not null
  order by l.player_id
`);

const cohort: CohortPlayer[] = (rows.rows as Record<string, unknown>[]).map((r) => {
  const skills = {
    js: Number(r.jump_shot), jr: Number(r.jump_range), od: Number(r.outside_def),
    ha: Number(r.handling), dr: Number(r.driving), pa: Number(r.passing),
    is: Number(r.inside_shot), id: Number(r.inside_def), rb: Number(r.rebounding),
    sb: Number(r.shot_blocking),
  };
  const tsp = Object.values(skills).reduce((a, b) => a + b, 0);
  return {
    playerId: Number(r.player_id), name: String(r.name), heightCm: Number(r.height_cm),
    potential: Number(r.potential ?? 0), salary: r.salary === null ? null : Number(r.salary),
    startingPrice: r.starting_price === null ? null : Number(r.starting_price),
    ownerTeamName: (r.owner_team_name as string | null) ?? null,
    nationality: (r.nationality as string | null) ?? null,
    skills, stamina: r.stamina === null ? null : Number(r.stamina),
    freeThrow: r.free_throw === null ? null : Number(r.free_throw), tsp,
  };
});

// ---- group + potential floor ----
const groups: Record<Group, CohortPlayer[]> = { outside: [], inside: [], wing: [], appendix: [] };
for (const p of cohort) groups[assignGroup(p, DELTA)].push(p);
const pools: Record<'outside' | 'inside' | 'wing', CohortPlayer[]> = {
  outside: groups.outside.filter((p) => p.potential >= POT_FLOOR.outside),
  inside: groups.inside.filter((p) => p.potential >= POT_FLOOR.inside),
  wing: groups.wing.filter((p) => p.potential >= POT_FLOOR.wing),
};

// ---- cluster each pool ----
interface GroupResult {
  group: 'outside' | 'inside' | 'wing';
  k: number; silhouetteScores: Record<number, number>; kmeansAgreement: number;
  jaccard: number[]; noStructure: boolean;
  collapsedByStability: boolean; collapsedFromK: number | null;
  clusters: Array<{
    index: number; members: CohortPlayer[]; centroid: Record<string, number>;
    eliteN: number; derived: ReturnType<typeof deriveArchetype>;
  }>;
}
function centroidOf(ms: CohortPlayer[]): Record<string, number> {
  const c: Record<string, number> = {};
  for (const k of SKILL_KEYS) c[k] = ms.length ? mean(ms.map((m) => m.skills[k])) : 0;
  return c;
}
const groupResults: GroupResult[] = [];
for (const g of ['outside', 'inside', 'wing'] as const) {
  const pool = pools[g];
  const vectors = pool.map((p) => shapeVector(p.skills));
  const [kMin, kMax] = K_RANGE[g];
  const { k, scores } = chooseK(vectors, kMin, kMax);
  const noStructure = Math.max(...Object.values(scores)) < SIL_MIN;
  let useK = noStructure ? 1 : k;
  let labels = useK === 1 ? vectors.map(() => 0) : wardCluster(vectors, useK);
  let km = useK === 1 ? labels : kmeans(vectors, useK, SEED).labels;
  let jac = useK === 1 ? [1] : bootstrapJaccard(vectors, useK, 100, SEED);
  // Stability gate: silhouette only flags candidate structure; bootstrap Jaccard (Hennig,
  // >=0.6) is the trust gate. A candidate k that doesn't survive resampling collapses to
  // a single (still meaningful, post-fix) profile rather than reporting noisy sub-clusters.
  let collapsedByStability = false;
  let collapsedFromK: number | null = null;
  if (useK >= 2 && Math.min(...jac) < JACCARD_MIN) {
    collapsedByStability = true;
    collapsedFromK = useK;
    useK = 1;
    labels = vectors.map(() => 0);
    km = labels;
    jac = [1];
  }
  const clusters = Array.from({ length: useK }, (_, ci) => {
    const members = pool.filter((_, i) => labels[i] === ci);
    const centroid = centroidOf(members);
    const derived = deriveArchetype(
      { group: g, index: ci, members, centroid: centroid as Record<SkillKey, number> },
    );
    return { index: ci, members, centroid, eliteN: derived.eliteN, derived };
  });
  groupResults.push({
    group: g, k: useK, silhouetteScores: scores,
    kmeansAgreement: agreement(labels, km), jaccard: jac, noStructure,
    collapsedByStability, collapsedFromK, clusters,
  });
}

// ---- draftee profiles (age-18 Slovenian universe; --plans only, read-only) ----
// Census/API/manual roster — NOT market-censored: per-group p25/p50/p75 skill profiles used
// as the starting state for the training-path search (spec §7).
async function fetchRookies(): Promise<CohortPlayer[]> {
  const rookieRows = await db.execute(sql`
    with latest_full as (
      select distinct on (s.player_id)
        s.player_id, s.jump_shot, s.jump_range, s.outside_def, s.handling, s.driving,
        s.passing, s.inside_shot, s.inside_def, s.rebounding, s.shot_blocking, s.potential
      from snapshots s
      where s.season = ${SEASON} and s.age = 18
        and s.jump_shot is not null and s.inside_shot is not null and s.shot_blocking is not null
        and s.jump_range is not null and s.outside_def is not null and s.handling is not null
        and s.driving is not null and s.passing is not null and s.inside_def is not null
        and s.rebounding is not null
      order by s.player_id, s.captured_at desc
    )
    select lf.*, p.height_cm
    from latest_full lf join players p on p.bb_player_id = lf.player_id
    where (p.country_id = 66 or p.nationality in ('Slovenia', 'Slovenija'))
      and p.is_utopian = false and p.height_cm is not null
    order by lf.player_id
  `);
  return (rookieRows.rows as Record<string, unknown>[]).map((r) => {
    const skills = {
      js: Number(r.jump_shot), jr: Number(r.jump_range), od: Number(r.outside_def),
      ha: Number(r.handling), dr: Number(r.driving), pa: Number(r.passing),
      is: Number(r.inside_shot), id: Number(r.inside_def), rb: Number(r.rebounding),
      sb: Number(r.shot_blocking),
    };
    return { playerId: Number(r.player_id), name: '', heightCm: Number(r.height_cm),
      potential: Number(r.potential ?? 7), salary: null, startingPrice: null, ownerTeamName: null,
      nationality: null, skills, stamina: null, freeThrow: null,
      tsp: Object.values(skills).reduce((a, b) => a + b, 0) };
  });
}
const rookies: CohortPlayer[] = PLANS ? await fetchRookies() : [];
function drafteesFor(g: 'outside' | 'inside' | 'wing') {
  // group rookies by the same balance/height gates; wing draftees = the between band
  const members = rookies.filter((r) => assignGroup(r, DELTA) === g);
  // Nobody trains a below-floor-potential draftee toward a floored build, and potential
  // drives the training cap model — so the profile's own potential must clear the
  // archetype group's potential floor (POT_FLOOR) for "feasibility" to mean anything.
  const eligible = members.filter((r) => r.potential >= POT_FLOOR[g]);
  let src: CohortPlayer[];
  let fallback: string | null;
  if (eligible.length >= 8) {
    src = eligible;
    fallback = null;
  } else if (members.length >= 8) {
    src = members; // too few pot-eligible rookies -> fall back to the whole group (ignores floor)
    fallback = `only ${eligible.length} pot>=${POT_FLOOR[g]}; fell back to all ${members.length} ${g} rookies`;
  } else {
    src = rookies; // group itself is thin -> whole universe fallback
    fallback = `only ${members.length} ${g} rookies; fell back to whole ${rookies.length}-player universe`;
  }
  const heights = src.map((m) => m.heightCm);
  const pots = src.map((m) => m.potential);
  const profiles = (['p25', 'p50', 'p75'] as const).map((label) => ({
    label,
    skills: Object.fromEntries(SKILL_KEYS.map((k) => [k,
      Math.max(1, Math.round(quantile(src.map((m) => m.skills[k]), { p25: 0.25, p50: 0.5, p75: 0.75 }[label])))])) as Record<SkillKey, number>,
    heightCm: Math.round(median(heights)),
    potential: Math.round(median(pots)),
  }));
  const provenance = fallback
    ? `${g} from ${src.length} Slovenian 18yos (${fallback})`
    : `${g} from ${eligible.length} pot>=${POT_FLOOR[g]} Slovenian 18yos`;
  return { profiles, provenance };
}

// ---- report ----
// header is a handful of lines emitted first; the exec summary (summaryLines) is assembled
// LAST (after the analysis + --plans loops below) so its numeric lines can report real
// counts, but is still emitted second — right after header, before the rest of `lines`.
const header: string[] = [];
header.push(`# Market Archetypes — Season ${SEASON} (age-${AGE_REF} flood)`);
header.push('');
header.push(`Generated: ${new Date().toISOString()} · window start ${WINDOW_START} · seed ${SEED}`);
header.push(`Re-run: \`npm run training:archetypes\` from v2/ (bump SEASON for next season's flood).`);
header.push('');
const lines: string[] = [];
// funnel
lines.push('## Cohort funnel');
lines.push('');
lines.push(mdTable(['step', 'n'], [
  ['age-21 full-skill market listings (deduped)', cohort.length],
  ['outside (b>=+1, <=201cm)', groups.outside.length],
  ['inside (b<=-1, >=203cm)', groups.inside.length],
  ['wing/forward (between)', groups.wing.length],
  ['appendix: short inside-leaning', groups.appendix.length],
  ['outside pool after pot>=7', pools.outside.length],
  ['inside pool after pot>=8', pools.inside.length],
  ['wing pool after pot>=7', pools.wing.length],
]));
lines.push('');
lines.push('Coverage caveat: Jul 23–Aug 2 captures were suppressed by BB\'s 1000-result search cap');
lines.push('(fixed 2026-08-03 by per-age sweeps); the cohort skews toward Aug 3+ captures.');
for (const gr of groupResults) {
  lines.push('');
  lines.push(`## ${gr.group} group — k=${gr.k}${gr.noStructure ? ' (no clear structure; single profile)' : ''}${gr.collapsedByStability ? ` (k=${gr.collapsedFromK} unstable under bootstrap; collapsed)` : ''}`);
  lines.push('');
  lines.push(`Silhouette by k: ${JSON.stringify(gr.silhouetteScores)} · ward-vs-kmeans agreement ${gr.kmeansAgreement.toFixed(2)} · bootstrap Jaccard ${gr.jaccard.map((j) => j.toFixed(2)).join(', ')}`);
  for (const c of gr.clusters) {
    const floor = defenseFloorFor(gr.group, c.centroid as Record<SkillKey, number>, c.members);
    const elite = eliteMembers(c.members, floor);
    const floorPass = c.members.filter((m) => m.skills[floor.skill] >= floor.min).length;
    const nearCap = c.members.filter((m) => {
      const subl = Object.fromEntries(SKILL_KEYS.map((k) => [k, m.skills[k] - 0.5])) as Record<SkillKey, number>;
      return capUsagePct(subl, m.potential) >= 90;
    }).length;
    const sellers = new Set(c.members.map((m) => m.ownerTeamName)).size;
    lines.push('');
    lines.push(`### ${c.derived.archetype.name} (${c.derived.archetype.key})${c.derived.provisional ? ' — PROVISIONAL (thin elite sample)' : ''}`);
    lines.push('');
    const gateNotes = [
      ...(c.derived.gateMet ? [] : ['BELOW 70% gate after full relaxation']),
      ...(c.derived.relaxed.length ? [`relaxed: ${c.derived.relaxed.join(',')}`] : []),
    ];
    const selfMatchNote = `self-match ${(c.derived.selfMatchRate * 100).toFixed(0)}%${gateNotes.length ? ` (${gateNotes.join('; ')})` : ''}`;
    lines.push(`${c.members.length} members · ${c.eliteN} elite · floor ${floor.skill.toUpperCase()}>=${floor.min} passed by ${floorPass}/${c.members.length} · near-cap ${nearCap} · ${sellers} distinct sellers · ${selfMatchNote}`);
    lines.push('');
    const qrow = (q: number) => SKILL_KEYS.map((k) => quantile(c.members.map((m) => m.skills[k]), q).toFixed(0));
    lines.push(mdTable(['', ...SKILL_KEYS.map((k) => k.toUpperCase())], [
      ['p25', ...qrow(0.25)], ['median', ...qrow(0.5)], ['p75', ...qrow(0.75)],
      ['elite median', ...(elite.length ? SKILL_KEYS.map((k) => median(elite.map((m) => m.skills[k])).toFixed(0)) : SKILL_KEYS.map(() => '–'))],
    ]));
    lines.push('');
    lines.push(`Typical: height ${median(c.members.map((m) => m.heightCm)).toFixed(0)}cm · TSP ${median(c.members.map((m) => m.tsp)).toFixed(0)} · potential ${JSON.stringify(histogram(c.members.map((m) => m.potential)))} · ST p50 ${c.members.some((m) => m.stamina !== null) ? median(c.members.filter((m) => m.stamina !== null).map((m) => m.stamina!)).toFixed(0) : '–'} · FT p50 ${c.members.some((m) => m.freeThrow !== null) ? median(c.members.filter((m) => m.freeThrow !== null).map((m) => m.freeThrow!)).toFixed(0) : '–'}`);
    const examples = [...c.members].sort((a, b) => b.tsp - a.tsp).slice(0, 3);
    lines.push('');
    lines.push(`Examples: ${examples.map((e) => `[${e.name}](https://www.buzzerbeater.com/player/${e.playerId}/overview.aspx) (${fmtSkills(e.skills)})`).join(' · ')}`);
  }
}
// specificity: every derived archetype vs every cluster's members
lines.push('');
lines.push('## Specificity (match rates across clusters)');
lines.push('');
lines.push('Note: self-match % elsewhere in this report is measured over each build\'s threshold');
lines.push('population (its floor-passing elite); this table\'s diagonal is measured over the full');
lines.push('cluster — the two intentionally differ.');
lines.push('');
const allDerived = groupResults.flatMap((g) => g.clusters.map((c) => c.derived));
const specRows = allDerived.map((d) => [
  d.archetype.key,
  ...groupResults.flatMap((g) => g.clusters.map((c) =>
    `${Math.round(selfMatchRate(c.members, d.archetype) * 100)}%`)),
]);
lines.push(mdTable(['archetype \\ cluster', ...groupResults.flatMap((g) => g.clusters.map((c) => c.derived.archetype.key))], specRows));
lines.push('');
// ---- Greece external benchmark (benchmark, not ceiling — spec §2/§8) ----
const greeceCsvPath = path.join(OUT_DIR, 'greece-s72', 'greek_tidy.csv');
const greekRows = parseGreekTidy(readFileSync(greeceCsvPath, 'utf8'));
const roster = lastWeekRoster(greekRows);
const centroids = groupResults.flatMap((g) => g.clusters.map((c) => ({
  key: c.derived.archetype.key, centroid: c.centroid as Record<SkillKey, number>,
})));
lines.push('', '## External benchmark: Greece U-21 (Euro bronze, S72)', '');
lines.push('Benchmark, not ceiling: Greek outside starters sit ~p60–p75 of the elite market pool;');
lines.push('thresholds derive from the market cohort. This section validates shapes and floors.');
lines.push('');
lines.push(mdTable(
  ['player', 'pos', 'wk', 'skills', 'TSP10', 'nearest build', 'dist'],
  roster.sort((a, b) => b.tsp10 - a.tsp10).map((p) => {
    const n = nearestCluster(p, centroids);
    return [p.player, p.position ?? '–', p.week, fmtSkills(p.skills), p.tsp10, n.key, n.distance.toFixed(1)];
  }),
));
// above-bronze share per cluster: members strictly above Greece's position-equivalent starters
lines.push('');
const greekBest = { outside: Math.max(...roster.filter((r) => ['PG', 'SG', 'SF'].includes(r.position ?? '')).map((r) => r.tsp10)),
                    inside: Math.max(...roster.filter((r) => ['PF', 'C'].includes(r.position ?? '')).map((r) => r.tsp10)) };
lines.push(mdTable([`cluster`, `members above Greek best (outside ${greekBest.outside} / inside ${greekBest.inside})`],
  groupResults.flatMap((g) => g.clusters.map((c) => [
    c.derived.archetype.key,
    c.members.filter((m) => m.tsp > (g.group === 'inside' ? greekBest.inside : greekBest.outside)).length,
  ]))));
lines.push('');
lines.push('Caveats: n=17, one federation; coach-recorded levels (two SB=21 above display cap);');
lines.push('wk14 censored; ages came from our DB (all 21), not the workbook.');
lines.push('');
lines.push('## Proposed rules (paste-ready)');
lines.push('');
lines.push('See `proposed-defaults.snippet.ts` next to this report. Younger byAge tiers are added by the --plans run.');
lines.push('');
const belowGate = allDerived.filter((d) => !d.gateMet);
if (belowGate.length) {
  lines.push(mdTable(['archetype', 'status'], belowGate.map((d) => [
    d.archetype.key, 'below gate — review thresholds before adopting',
  ])));
  lines.push('');
}
// ---- plans (Tasks 9-11): per-build training paths, byAge tiers patched into the derived
// archetypes' rules, Slovenia gap analysis. Kept as one block so neutralTiersByKey stays in
// scope for the Slovenia section appended here later. ----
const neutralTiersByKey = new Map<string, ClusterPlanResult['tiers']>();
const planSummaries: Array<{ key: string; scenario: string; reachable: boolean; fullRule: boolean }> = [];
// Scenarios for this run: the fixed neutral/elite bracket + an optional CLI-provided custom
// scenario (--coach/--yt/--gym/--tc), same knobs as the training planner UI.
const scenarios = CUSTOM_STAFF
  ? [...STAFF_SCENARIOS, {
      name: `custom (coach ${CUSTOM_STAFF.coachLevel}/YT ${CUSTOM_STAFF.youthTrainerLevel}/gym ${CUSTOM_STAFF.gymLevel}/TC ${CUSTOM_STAFF.trainingCourtLevel})`,
      ...CUSTOM_STAFF,
    }]
  : [...STAFF_SCENARIOS];
if (PLANS) {
  lines.push('', '## Training paths (per build)', '');
  lines.push('Anchor: the build must be USABLE entering age 21 (WC squad selection); the age-21');
  lines.push('season is a finishing phase. Feasibility shown under: ' + scenarios
    .map((s) => `${s.name} (coach ${s.coachLevel}/YT ${s.youthTrainerLevel}/gym ${s.gymLevel}/TC ${s.trainingCourtLevel})`)
    .join(' · ') + '.');
  lines.push('Week-14s are near-zero training weeks in reality');
  lines.push('(clubs switch to Game Shape) — treat final-week pops as bonus, not plan.');
  lines.push('Finishing deltas describe the age-21 season under the plan\'s final block extended to');
  lines.push('season end; large deltas on a secondary skill mean the searcher finished its targets');
  lines.push('early and the extension repeats its last block — treat those weeks as owner-discretionary');
  lines.push('(e.g. swap for defense polish), not a recommendation.');
  const drafteesByGroup = new Map(
    (['outside', 'inside', 'wing'] as const).map((g) => [g, drafteesFor(g)] as const),
  );
  lines.push(`Draftee profiles: ${(['outside', 'inside', 'wing'] as const)
    .map((g) => drafteesByGroup.get(g)!.provenance).join('; ')}.`);
  for (const gr of groupResults) {
    const draftees = drafteesByGroup.get(gr.group)!.profiles;
    for (const c of gr.clusters) {
      const floor = defenseFloorFor(gr.group, c.centroid as Record<SkillKey, number>, c.members);
      lines.push('', `### Path to ${c.derived.archetype.name}`, '');
      // Run planForCluster ONCE per scenario per cluster; results[0] is neutral (scenarios[0]).
      const results = scenarios.map((s) => planForCluster(c.derived.archetype, floor, draftees, s));
      for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        const r = results[i];
        const blockStr = r.blocks.map((b) => `${getTrainingType(b.trainingId).label}×${b.weeks}`).join(' → ');
        lines.push(`**${scenario.name}**: ${r.feasibleEntering21 ? 'REACHABLE entering 21' : 'NOT reachable entering 21'} · full-rule end check ${r.fullRuleMatch ? 'PASS' : `FAIL (${r.failingChecks.map((f) => `${f.field} ${f.op} ${f.threshold} got ${f.actual}`).join('; ')})`} · pop rate ${r.weeklyPopRate.toFixed(2)}/wk`);
        lines.push('');
        lines.push(`Plan: ${blockStr || '(no plan found)'}`);
        lines.push('');
        lines.push(`Finishing deltas during age-21 season: ${Object.entries(r.finishingDeltas).map(([k, d]) => `${k.toUpperCase()}+${d}`).join(' ') || 'none'}`);
        lines.push('');
        planSummaries.push({ key: c.derived.archetype.key, scenario: scenario.name,
          reachable: r.feasibleEntering21, fullRule: r.fullRuleMatch });
      }
      // Patch byAge 19/20/21 tiers into the proposed rules from the NEUTRAL scenario (results[0] —
      // Slovenian prescription). 18 stays blank — draft-day skills are noise.
      const neutral = results[0];
      for (const cond of c.derived.archetype.rules.conditions) {
        if (cond.kind !== 'field' || cond.op !== '>=') continue;
        const t21 = cond.byAge[21];
        if (t21 === undefined) continue;
        const key = SKILL_KEYS.find((k) => SKILL_DB_NAMES[k] === cond.field);
        if (key) {
          // F1: clamp the simulated 19/20 tiers so they never overshoot the (possibly
          // relaxed) age-21 threshold — the optimizer's path can exceed a relaxed target
          // via cross-training on other skills, which would otherwise make a 20yo need to
          // clear a HIGHER bar than a 21yo for the same archetype.
          const sim19 = neutral.tiers[19][key];
          const sim20 = neutral.tiers[20][key];
          if (sim19 === undefined || sim20 === undefined) continue;
          const t20 = Math.min(sim20, t21);
          const t19 = Math.min(sim19, t20);
          cond.byAge = { 19: t19, 20: t20, 21: t21 };
        } else if (cond.field === 'potential' || cond.field === 'height_cm') {
          // F2: age-invariant floors — no derived rule (or simulation) varies these by age,
          // so copy the age-21 threshold down to 19/20 rather than leaving them unenforced.
          cond.byAge = { 19: t21, 20: t21, 21: t21 };
        }
      }
      neutralTiersByKey.set(c.derived.archetype.key, neutral.tiers);
      lines.push(`byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):`);
      lines.push('');
      lines.push(mdTable(['age', ...SKILL_KEYS.map((k) => k.toUpperCase())],
        ([19, 20, 21] as const).map((a) => [a, ...SKILL_KEYS.map((k) => neutral.tiers[a][k] ?? null)])));
    }
  }
  // spec §6: back-projected age-20 defense must sit BELOW the age-21 floors — anything else is
  // an optimizer error, not a target.
  for (const gr of groupResults) for (const c of gr.clusters) {
    const floor = defenseFloorFor(gr.group, c.centroid as Record<SkillKey, number>, c.members);
    const odCond = c.derived.archetype.rules.conditions.find(
      (x) => x.kind === 'field' && x.field === floor.field);
    if (odCond?.kind === 'field' && (odCond.byAge[20] ?? 0) >= floor.min)
      console.error(`WARN ${c.derived.archetype.key}: age-20 ${floor.field} tier ${odCond.byAge[20]} >= floor ${floor.min} (optimizer-optimistic)`);
  }
  // ---- Slovenia gap analysis (Task 11): age-conditional at-risk grading of every tracked
  // Slovenian 18-21 prospect against the derived builds' neutral-staff tiers. ----
  const { getPlannerData } = await import('../../src/queries/planner');
  const { gradeProspect } = await import('../../src/lib/archetypes/derive/gap');
  const planner = await getPlannerData();
  const gapClusters = groupResults.flatMap((gr) => gr.clusters.map((c) => ({
    key: c.derived.archetype.key, group: gr.group,
    centroid: c.centroid as Record<SkillKey, number>,
    tiers: neutralTiersByKey.get(c.derived.archetype.key)!, // Map filled in Task 10's loop
    floor: defenseFloorFor(gr.group, c.centroid as Record<SkillKey, number>, c.members),
  })));
  lines.push('', '## Slovenia gap analysis', '');
  lines.push('Every tracked Slovenian 18–21 prospect vs the nearest derived build. Status logic is');
  lines.push('age-aware: at 18/19 we grade the elastic FEEDERS (HA/DR), not defense; at 20 we check the');
  lines.push('defense season is actually happening; at 21 we check the floor is still closable.');
  lines.push('');
  const rows21 = planner.players.map((bp) => {
    const skills = Object.fromEntries(SKILL_KEYS.map((k, i) => [k, bp.displayedSkills[i]])) as Record<SkillKey, number>;
    const g = gradeProspect({
      age: bp.age, heightCm: bp.heightCm, potential: bp.potential, skills,
      inferredTrainingId: bp.inferred?.trainingId ?? null,
      currentSeasonWeek: bp.currentSeasonWeek,
    }, gapClusters);
    return { bp, g };
  }).sort((a, b) => (a.g.status === 'at-risk' ? 0 : a.g.status === 'watch' ? 1 : 2)
    - (b.g.status === 'at-risk' ? 0 : b.g.status === 'watch' ? 1 : 2) || a.bp.age - b.bp.age
    || a.bp.bbPlayerId - b.bp.bbPlayerId);
  // Base-rate + season-timing context so AT-RISK/WATCH volumes read correctly (spec §8.6 polish).
  const onTrackCount = rows21.filter(({ g }) => g.status === 'on-track').length;
  lines.push(`The universe here is every tracked Slovenian 18–21 prospect (${rows21.length}), most of`);
  lines.push('whom were never elite-track candidates; WATCH is therefore the expected mode, and the');
  lines.push(`ON-TRACK list (${onTrackCount}) is the actual elite pipeline.`);
  lines.push('');
  const age21Weeks = rows21.filter(({ bp }) => bp.age >= 21).map(({ bp }) => bp.currentSeasonWeek);
  const seasonWeek = age21Weeks.length ? Math.max(...age21Weeks) : null;
  if (seasonWeek !== null && seasonWeek >= 14) {
    lines.push(`At season week ${seasonWeek}, every age-21 floor gap is unclosable by definition ("0`);
    lines.push('weeks left"), so the age-21 AT-RISK block below is a graduating-class artifact right');
    lines.push('now — re-run early next season for actionable age-21 grading.');
    lines.push('');
  }
  lines.push(mdTable(['player', 'age', 'nearest build', 'status', 'gaps (next tier)', 'why'],
    rows21.map(({ bp, g }) => [
      `[${bp.name}](https://www.buzzerbeater.com/player/${bp.bbPlayerId}/overview.aspx)`, bp.age,
      g.nearestKey, g.status.toUpperCase(),
      g.gaps.map((x) => `${x.skill.toUpperCase()} ${x.have}->${x.need}`).join(' ') || '–',
      g.reasons.join('; ') || '–',
    ])));
} else {
  lines.push('', '## Plans', '');
  lines.push('_Run with `-- --plans` to add training paths, byAge tiers, and the Slovenia gap analysis._');
}

// ---- caveats & provenance (spec §8.7): always emitted, regardless of --plans ----
lines.push('', '## Caveats & provenance', '');
lines.push('- **Cohort, not population:** this report describes what top U-21 programs SOLD at age-21');
lines.push('  eligibility end; senior-NT-track builds that never reach the market are deliberately absent.');
lines.push('- **Age-18/19/20 tiers are simulated:** market listings at those ages are survivorship-censored');
lines.push('  (on-track players are held, not sold), so young byAge tiers come from forward-simulated');
lines.push('  training + the Slovenian rookie census — never from young market listings.');
lines.push('- **Coverage gap:** Jul 23–Aug 2 captures were suppressed by BB\'s 1000-result search cap');
lines.push('  (fixed 2026-08-03 by per-age sweeps); the cohort skews toward Aug 3+ captures.');
lines.push('- **Greece is a benchmark, not a ceiling:** validates cluster shapes/floors against one');
lines.push('  federation\'s U-21 Euro-bronze roster (n=17); it is not a pass/fail target.');
lines.push(`- **Season pin:** SEASON=${SEASON}, age-${AGE_REF} flood. Re-run next season with`);
lines.push('  `npm run training:archetypes -- --plans` from v2/ after bumping SEASON.');
lines.push('- **Data sources:** market snapshot sweep (`snapshots`, source=\'market\'), Slovenian 18yo');
lines.push('  census (`snapshots`+`players`, country_id=66), and the Greek workbook at');
lines.push('  `docs/research/market-archetypes/greece-s72/greek_tidy.csv`.');

// ---- exec summary (assembled LAST so per-group + plan-reachability counts are real numbers;
// emitted FIRST via [...header, ...summaryLines, ...lines] below) ----
const summaryLines: string[] = [];
summaryLines.push('## What this says, in plain language');
summaryLines.push('');
summaryLines.push(`We looked at ${cohort.length} finished 21-year-old players that top U-21 training`);
summaryLines.push(`programs sold at the end of season ${SEASON}, split them into outside / inside / wing-forward`);
summaryLines.push('groups, and let the data reveal which distinct builds exist in each group. Each build below');
summaryLines.push('comes with: how common it is, what the typical skills look like, how much defense the elite');
summaryLines.push('versions carry, and (with --plans) the optimized week-by-week training path to reach it.');
summaryLines.push('');
for (const gr of groupResults) {
  summaryLines.push(`- ${gr.group}: ${pools[gr.group].length} candidates -> ${gr.k} distinct build${gr.k > 1 ? 's' : ''}${gr.noStructure ? ' (weak separation — treat as one profile)' : ''}`);
}
if (PLANS) {
  const scenarioCount = new Set(planSummaries.map((p) => p.scenario)).size || 1;
  summaryLines.push(`- ${planSummaries.filter((p) => p.scenario === 'neutral' && p.reachable).length} of ${planSummaries.length / scenarioCount} builds are reachable by a Slovenian-club draftee entering age 21 under neutral staff`);
  const customName = planSummaries.find((p) => p.scenario.startsWith('custom'))?.scenario;
  if (customName) {
    summaryLines.push(`- ${planSummaries.filter((p) => p.scenario === customName && p.reachable).length} of ${planSummaries.length / scenarioCount} builds are reachable under the requested ${customName} staff`);
  }
}
summaryLines.push('');

writeFileSync(path.join(OUT_DIR, 'REPORT.md'), [...header, ...summaryLines, ...lines].join('\n') + '\n');
writeFileSync(
  path.join(OUT_DIR, 'proposed-defaults.snippet.ts'),
  `// Paste-ready DefaultArchetype[] additions derived ${new Date().toISOString().slice(0, 10)} (season ${SEASON}).\n` +
  `// Target: v2/src/lib/archetypes/defaults.ts — review REPORT.md before adopting.\n` +
  `export const MARKET_ARCHETYPES = ${JSON.stringify(allDerived.map((d) => d.archetype), null, 2)};\n`,
);
console.log(JSON.stringify({
  cohort: cohort.length,
  groups: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])),
  clusters: groupResults.map((g) => ({ group: g.group, k: g.k, sizes: g.clusters.map((c) => c.members.length) })),
  plans: planSummaries,
}));
process.exit(0);
