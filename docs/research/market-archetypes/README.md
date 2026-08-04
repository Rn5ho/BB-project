# Market Archetypes (season-end flood analysis)

What the world's best U-21 training programs produce, learned from the season-72 season-end
transfer flood, benchmarked against the Greek U-21 bronze roster, with optimized training
paths per build and a Slovenian prospect gap analysis.

- `REPORT.md` — the generated report (plain-language summary first; regenerate, don't edit)
- `proposed-defaults.snippet.ts` — paste-ready `DefaultArchetype[]` for
  `v2/src/lib/archetypes/defaults.ts`, adopted only after owner review of REPORT.md
- `greece-s72/` — the Greek coach's weekly workbook + parsed CSVs (see its README)

## Regenerating

From `v2/` (all SELECT-only; the beam searches take a few minutes):

```
npm run training:archetypes                      # part 1: cohort, clusters, rules
npm run training:archetypes -- --plans           # + training paths, byAge tiers, Greece, Slovenia
npm run training:archetypes -- --plans --stress --coach 6 --yt 6 --gym 1 --tc 1
```

`--coach/--yt/--gym/--tc` add a third "custom" staff scenario next to neutral (5/5) and elite
(7/7/gym2/tc2) — use the club ask you can actually make (coach 5-6 / YT 6 in practice).
`--stress` adds a feasibility FLOOR beside each ceiling: the same plan re-simulated from
worst-case hidden sublevels at degraded minutes. Ceilings assume full minutes and midpoint
sublevels; reality sits between the two, and only a live trainee settles where.

For the season-73 flood: bump `SEASON` in `v2/scripts/training/derive-archetypes.mts` and re-run;
the queries are season-pinned and deterministic, so the two reports diff cleanly.

## Per-player planning

```
npm run training:journey -- --player <bbPlayerId> --build "Market: wing #1" --coach 6 --yt 6
npm run training:journey -- ... --save        # writes it as his active plan (shows on his page)
```

Takes a real tracked player's current state and returns the staged path to the chosen build:
**M1** = playable entering age 21 (selection gate) → **M2** = finalized by playoff week 7 →
polish. Works mid-journey (a 20yo gets the remaining phases). Any archetype works, including
DB customs — the five derived builds were added as customs on 2026-08-04 and are deletable from
`/archetypes` at any time.

## Reading the results honestly

- Feasibility verdicts are **ceilings**, not promises: full minutes, midpoint sublevels, one
  trainee optimised in isolation, perfect weekly decisions. `--stress` gives the opposite bound.
- Timing is good to ±1-2 weeks at best (hidden sublevels — see
  `docs/research/training/calibration-cases/centri-u21/`), so read "week 30" as "≈week 30".
- Two derived archetypes ship **below the 70% self-match gate** and are flagged in REPORT.md;
  they need a human decision before adoption.

Spec: `docs/superpowers/specs/2026-08-04-market-archetypes-design.md`
Plan: `docs/superpowers/plans/2026-08-04-market-archetypes.md`
Related: `docs/research/training/calibration-cases/centri-u21/` (inside-skill validation)
