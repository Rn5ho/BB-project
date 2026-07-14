# BuzzerIQ Training API Map (recorded 2026-07-14)

Oracle for differential-testing our engine. 37 fixture pairs in `probes/`.
Both endpoints unauthenticated. Backend is FastAPI (422 validation errors).

## Endpoints

### `POST https://buzzeriq.com/api/tools/training/simulate`

Request:

```json
{
  "player": {
    "skills": [7,7,7,7,7,7,7,7,7,7],
    "age": 18, "height": 200, "potential": 9,
    "coach_level": 5, "youth_trainer_level": 0, "training_court_level": 0,
    "ft_skill": 5, "training_model": "open_source" | "coach_parrot"
  },
  "training_schedule": [1, 1, 1],
  "start_season": 1, "start_week": 1
}
```

UI-validated ranges: skills 1–20, age 15–40, height 170–235, potential 0–11,
coach 1–7, youth trainer 0–7, court 0–3, start_week 1–14, schedule ≤140 weeks.

Response: `weeks[] {week, training_id, skills_before[10], skills_after[10],
gains[10], pops[10], ft_gain, ft_skill_after, estimated_salary(+min/max),
estimated_cap_usage_pct(+min/max)}`, plus `final_skills`, `total_gains`,
`estimated_salary(+min/max)`, `best_position`, `salary_per_position`,
`is_capped`, `milestones[]` (week 0 + each 14-week season boundary),
`final_ft_skill`, `total_ft_gain`.

### `POST /api/tools/training/solve`

Same request but `target_skills:[10 ints]` replaces `training_schedule`.
Returns `{schedule: [ids], result: <simulate response>}`.
WARNING: semantics unclear — our probe (HA/DR target 9) returned a 30-week
schedule overshooting to HA 16.8/DR 17.2 with unrelated trainings mixed in.
Do not rely on solve; build our own optimizer.

## Skill array order (verified twice)

`[JS, JR, OD, HA, DR, PA, IS, ID, RB, SB]` — from bundle label array and
empirical probes.

## Training-type IDs (1–33; 34+ → 422)

| ID | Name | ID | Name | ID | Name |
|----|------|----|------|----|------|
| 1 | JS for 12 | 12 | HA for 1 | 23 | IS for 345 |
| 2 | JS for 34 | 13 | HA for 12 | 24 | ID for 5 |
| 3 | JS for 23 | 14 | HA for 123 | 25 | ID for 45 |
| 4 | JS for team | 15 | DR for 12 | 26 | ID for 345 |
| 5 | JR for 2 | 16 | DR for 34 | 27 | RB for 45 |
| 6 | JR for 12 | 17 | DR for team | 28 | RB for team |
| 7 | JR for 23 | 18 | PA for 1 | 29 | SB for 5 |
| 8 | JR for team | 19 | PA for 12 | 30 | SB for 45 |
| 9 | OD for 1 | 20 | PA for team | 31 | SB for 345 |
| 10 | OD for 12 | 21 | IS for 5 | 32 | Stamina |
| 11 | OD for 123 | 22 | IS for 45 | 33 | Free Throw |

Position digits: 1=PG 2=SG 3=SF 4=PF 5=C.

## Parameter behavior (probed)

- **coach_level**: exactly the community trainer table — 1:0.88, 2:0.91, 3:0.94,
  4:0.97, 5:1.00, 6:1.03, 7:1.06 (both models).
- **youth_trainer_level**: NO effect in open_source. In coach_parrot, boosts
  non-uniformly per skill (age 18, yt5: HA ×1.08, DR ×1.10, OD ×1.40).
- **training_court_level**: no effect on gains in either model (cosmetic).
- **Near cap** (all skills 19, potential 5): `is_capped: true` in both;
  open_source gains ×0.8 (its skill≥16 slowdown; potential only drives the flag),
  coach_parrot gains ×1/3.
- **Age curve**: open_source age 21 → ×0.80 (NOT community 0.78!); coach_parrot
  age 21 → ×0.78. Models disagree at 21.
- **Stamina/FT (32/33)**: complete no-ops in both models (`ft_gain` always 0).
  BuzzerIQ is not an oracle for ST/FT/game-shape.

## open_source deployed ≠ sergiu-logic.js (GitHub)

Observed deviations (equal-skills probes, age 18, coach 5): HA-for-1 gives
HA 0.50/DR 0.38 (file: DR 0.5/HA 0.4 — primary swapped); JS-for-12 JS 0.52
(file 0.6); IS-for-5 JS 0.13/IS 0.525/ID 0.10 (file 0.1/0.5/0.05); height
table differs at 175 and 201 cm (e.g. DR ×0.95, IS ×1.05 at 201). The live
API responses in `probes/` are the ground truth for this model.
