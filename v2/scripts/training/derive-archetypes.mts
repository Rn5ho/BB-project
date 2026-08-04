// Derive market archetypes + training plans from the season-end flood (spec:
// docs/superpowers/specs/2026-08-04-market-archetypes-design.md).
// Usage (from v2/): npm run training:archetypes            -- part 1 (cohort/clusters/rules)
//                   npm run training:archetypes -- --plans -- + plans/tiers/Slovenia (Tasks 9-11)
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

// Dynamic imports AFTER dotenv (repo convention): src/db reads DATABASE_URL at module scope.
const { sql } = await import('drizzle-orm');
const { db } = await import('../../src/db/index');
const { SKILL_KEYS } = await import('../../src/lib/training/types');
const { assignGroup, balance } = await import('../../src/lib/archetypes/derive/groups');
const { quantile, mean, median, histogram } = await import('../../src/lib/archetypes/derive/stats');
const { shapeVector, wardCluster, kmeans, chooseK, silhouette, agreement, bootstrapJaccard } =
  await import('../../src/lib/archetypes/derive/cluster');
const { defenseFloorFor, eliteMembers, deriveArchetype, selfMatchRate, toEvalPlayer } =
  await import('../../src/lib/archetypes/derive/rules');
const { evaluateArchetype } = await import('../../src/lib/archetypes/evaluate');
const { mdTable, fmtSkills } = await import('../../src/lib/archetypes/derive/md');
const { capUsagePct } = await import('../../src/lib/training/salary');
type CohortPlayer = import('../../src/lib/archetypes/derive/groups').CohortPlayer;
type Group = import('../../src/lib/archetypes/derive/groups').Group;
type SkillKey = import('../../src/lib/training/types').SkillKey;

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
`);

const cohort: CohortPlayer[] = (rows.rows as any[]).map((r) => {
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
    ownerTeamName: r.owner_team_name ?? null, nationality: r.nationality ?? null,
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

// ---- report ----
const lines: string[] = [];
lines.push(`# Market Archetypes — Season ${SEASON} (age-${AGE_REF} flood)`);
lines.push('');
lines.push(`Generated: ${new Date().toISOString()} · window start ${WINDOW_START} · seed ${SEED}`);
lines.push(`Re-run: \`npm run training:archetypes\` from v2/ (bump SEASON for next season's flood).`);
lines.push('');
lines.push('## What this says, in plain language');
lines.push('');
lines.push(`We looked at ${cohort.length} finished 21-year-old players that top U-21 training`);
lines.push(`programs sold at the end of season ${SEASON}, split them into outside / inside / wing-forward`);
lines.push('groups, and let the data reveal which distinct builds exist in each group. Each build below');
lines.push('comes with: how common it is, what the typical skills look like, how much defense the elite');
lines.push('versions carry, and (with --plans) the optimized week-by-week training path to reach it.');
lines.push('');
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
    const floor = defenseFloorFor(gr.group, c.centroid as Record<SkillKey, number>);
    const elite = eliteMembers(c.members, floor);
    const floorPass = c.members.filter((m) => m.skills[floor.skill] >= floor.min).length;
    const nearCap = c.members.filter((m) => {
      const subl = Object.fromEntries(SKILL_KEYS.map((k) => [k, m.skills[k] - 0.5])) as any;
      return capUsagePct(subl, m.potential) >= 90;
    }).length;
    const sellers = new Set(c.members.map((m) => m.ownerTeamName)).size;
    lines.push('');
    lines.push(`### ${c.derived.archetype.name} (${c.derived.archetype.key})${c.derived.provisional ? ' — PROVISIONAL (thin elite sample)' : ''}`);
    lines.push('');
    lines.push(`${c.members.length} members · ${c.eliteN} elite · floor ${floor.skill.toUpperCase()}>=${floor.min} passed by ${floorPass}/${c.members.length} · near-cap ${nearCap} · ${sellers} distinct sellers · self-match ${(c.derived.selfMatchRate * 100).toFixed(0)}%${c.derived.relaxed.length ? ` (relaxed: ${c.derived.relaxed.join(',')})` : ''}`);
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
const allDerived = groupResults.flatMap((g) => g.clusters.map((c) => c.derived));
const specRows = allDerived.map((d) => [
  d.archetype.key,
  ...groupResults.flatMap((g) => g.clusters.map((c) =>
    `${Math.round(selfMatchRate(c.members, d.archetype) * 100)}%`)),
]);
lines.push(mdTable(['archetype \\ cluster', ...groupResults.flatMap((g) => g.clusters.map((c) => c.derived.archetype.key))], specRows));
lines.push('');
lines.push('## Proposed rules (paste-ready)');
lines.push('');
lines.push('See `proposed-defaults.snippet.ts` next to this report. Younger byAge tiers are added by the --plans run.');
lines.push('');
lines.push('## Plans');
lines.push('');
lines.push(PLANS ? '(plans sections below)' : '_Run with `-- --plans` to add training paths, byAge tiers, Greece benchmark, and the Slovenia gap analysis._');

writeFileSync(path.join(OUT_DIR, 'REPORT.md'), lines.join('\n') + '\n');
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
}));
process.exit(0);
