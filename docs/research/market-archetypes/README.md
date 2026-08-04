# Market Archetypes (season-end flood analysis)

What the world's best U-21 training programs produce, learned from the season-72 season-end
transfer flood, benchmarked against the Greek U-21 bronze roster, with optimized training
paths per build and a Slovenian prospect gap analysis.

- `REPORT.md` — the generated report (plain-language summary first; regenerate, don't edit)
- `proposed-defaults.snippet.ts` — paste-ready `DefaultArchetype[]` for
  `v2/src/lib/archetypes/defaults.ts`, adopted only after owner review of REPORT.md
- `greece-s72/` — the Greek coach's weekly workbook + parsed CSVs (see its README)

Regenerate: from `v2/`, `npm run training:archetypes -- --plans` (SELECT-only; ~minutes due to
beam searches). For the season-73 flood: bump `SEASON` in
`v2/scripts/training/derive-archetypes.mts` and re-run; diff the two reports.

Spec: `docs/superpowers/specs/2026-08-04-market-archetypes-design.md`
Plan: `docs/superpowers/plans/2026-08-04-market-archetypes.md`
