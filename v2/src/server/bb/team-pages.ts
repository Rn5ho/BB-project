// Parsers for own-team pages: staff.aspx (staff skill levels) and arena.aspx
// (infrastructure levels). Used by the self-trainer to auto-sync coach/YT/gym/TC
// each run instead of trusting a hand-maintained config. Markup verified against
// live team pages 2026-07-18 (fixtures: __fixtures__/staff.html, arena.html).

export interface StaffLevels {
  trainer: number | null;          // = the training engine's coachLevel (1–7)
  youthTrainer: number | null;     // 0–7 (null when the club employs none)
  doctor: number | null;
  prManager: number | null;
  sportsPsychologist: number | null;
}

/** Each staff item renders its role name, then "Skill Level:" with the numeric level
 *  in the display span's title attribute. Non-greedy window stops at the item's own
 *  level span; "Youth Trainer" must precede "Trainer" in the alternation. */
export function parseStaffLevels(html: string): StaffLevels {
  const out: StaffLevels = { trainer: null, youthTrainer: null, doctor: null, prManager: null, sportsPsychologist: null };
  const re = />(Youth Trainer|Trainer|Doctor|PR-Manager|Sports Psychologist)<[\s\S]{0,6000}?lblStaffSkillLevelDisplay_\d+" title="(\d+)"/g;
  const KEY: Record<string, keyof StaffLevels> = {
    'Youth Trainer': 'youthTrainer', Trainer: 'trainer', Doctor: 'doctor',
    'PR-Manager': 'prManager', 'Sports Psychologist': 'sportsPsychologist',
  };
  for (const m of html.matchAll(re)) {
    const key = KEY[m[1]];
    if (out[key] == null) out[key] = Number(m[2]);
  }
  return out;
}

export interface InfrastructureLevels {
  gym: number | null;           // 0–3
  trainingCourt: number | null; // 0–3
}

/** arena.aspx inlines the infrastructure levels as JS vars: `var lvlGym = 3; var lvlTC = 2;`. */
export function parseInfrastructure(html: string): InfrastructureLevels {
  const num = (name: string): number | null => {
    const m = html.match(new RegExp(`var\\s+${name}\\s*=\\s*(\\d+)`));
    return m ? Number(m[1]) : null;
  };
  return { gym: num('lvlGym'), trainingCourt: num('lvlTC') };
}
