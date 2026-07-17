// Parser for BB traininghistory.aspx (own-team players only — the page 404s/blanks for
// foreign players). Shared by the scrape-training-history CLI and the self-trainer cron
// job so both run identical extraction. Extracted 2026-07-17 from
// scripts/training/scrape-training-history.mts.
import type { SkillKey } from '@/lib/training/types';

// BB training label + positions -> catalog id (see src/lib/training/catalog.ts)
export const TRAINING_IDS: Record<string, number> = {
  'Jump Shot|PG/SG': 1, 'Jump Shot|SF/PF': 2, 'Jump Shot|SG/SF': 3, 'Jump Shot|TEAM': 4,
  'Outside Shooting|SG': 5, 'Outside Shooting|PG/SG': 6, 'Outside Shooting|SG/SF': 7, 'Outside Shooting|TEAM': 8,
  'Outside Defense|PG': 9, 'Outside Defense|PG/SG': 10, 'Outside Defense|PG/SG/SF': 11,
  'Ball Handling|PG': 12, 'Ball Handling|PG/SG': 13, 'Ball Handling|PG/SG/SF': 14,
  'One on One|PG/SG': 15, 'One on One|SF/PF': 16, 'One on One|TEAM': 17,
  'Passing|PG': 18, 'Passing|PG/SG': 19, 'Passing|TEAM': 20,
  'Inside Scoring|C': 21, 'Inside Scoring|PF/C': 22, 'Inside Scoring|SF/PF/C': 23,
  'Inside Defense|C': 24, 'Inside Defense|PF/C': 25, 'Inside Defense|SF/PF/C': 26,
  'Rebounding|PF/C': 27, 'Rebounding|TEAM': 28,
  'Shot Blocking|C': 29, 'Shot Blocking|PF/C': 30, 'Shot Blocking|SF/PF/C': 31,
};

export const SKILL_NAME_TO_KEY: Record<string, SkillKey | 'stamina' | 'free_throw'> = {
  'Jump Shot': 'js', 'Jump Range': 'jr', 'Outside Def.': 'od', 'Handling': 'ha',
  'Driving': 'dr', 'Passing': 'pa', 'Inside Shot': 'is', 'Inside Def.': 'id',
  'Rebounding': 'rb', 'Shot Blocking': 'sb', 'Stamina': 'stamina', 'Free Throw': 'free_throw',
};

/** Normalize BB's position labels ("C / PF", "Forwards", "Guards") to the catalog's
 *  canonical order (PG/SG, SF/PF, PF/C, …). */
export function canonicalPositions(raw: string): string {
  const s = raw.replace(/\s*\/\s*/g, '/').trim().toUpperCase();
  if (s === 'GUARDS') return 'PG/SG';
  if (s === 'WINGMEN' || s === 'WINGS') return 'SG/SF';
  if (s === 'FORWARDS') return 'SF/PF';
  if (s === 'BIG MEN' || s === 'BIGS') return 'PF/C';
  if (s === 'TEAM' || s === 'ALL') return 'TEAM';
  const ORDER = ['PG', 'SG', 'SF', 'PF', 'C'];
  const parts = s.split('/').filter(Boolean);
  if (parts.every((p) => ORDER.includes(p))) {
    return parts.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).join('/');
  }
  return s;
}

export interface TrainingWeekRow {
  date: string; // M/D/YYYY as shown
  label: string; positions: string; minutes: number | null; trainingId: number | null;
  pops: Array<{ skill: string; key: string | null; from: number; to: number }>;
  ageEvent?: string;
}

/** Parse traininghistory.aspx HTML into week rows, newest-first (page order). */
export function parseTrainingHistory(html: string): TrainingWeekRow[] {
  const rows: TrainingWeekRow[] = [];
  let current: TrainingWeekRow | null = null;
  // iterate repeater rows in document order
  const rowRe = /<tr id="cphContent_rptTrainingHistory_trItemRow_\d+">([\s\S]*?)<\/tr>/g;
  for (const m of html.matchAll(rowRe)) {
    const cell = m[1];
    const date = cell.match(/<td align="center">\s*([0-9/]+)\s*<\/td>/)?.[1] ?? null;
    const training = cell.match(/lblTrainingText_\d+"><b>([^<]+)<\/b>(?:\s*for\s*<b>([^<]+)<\/b>)?\s*\(([^)]*?)\+?\s*minutes?\)/);
    const age = cell.match(/lblAgeIncrease_\d+">([^<]+)</)?.[1];
    const pop = cell.match(/lblPlayerSkill_\d+">([^<]+)<[\s\S]*?lblPlayerOldLevel_\d+" class="lev(\d+)"[\s\S]*?lblPlayerNewLevel_\d+" class="lev(\d+)"/);

    if (date && training) {
      if (current) rows.push(current);
      const label = training[1].trim();
      const positions = canonicalPositions(training[2] ?? 'TEAM');
      current = {
        date, label, positions,
        minutes: training[3] === '' ? null : Number(training[3]),
        trainingId: TRAINING_IDS[`${label}|${positions}`] ?? null,
        pops: [],
      };
    } else if (age) {
      if (current) rows.push(current);
      current = { date: date ?? '', label: 'AGE', positions: '', minutes: null, trainingId: null, pops: [], ageEvent: age.trim() };
    } else if (pop && current) {
      const skill = pop[1].trim();
      current.pops.push({ skill, key: SKILL_NAME_TO_KEY[skill] ?? null, from: Number(pop[2]), to: Number(pop[3]) });
    }
  }
  if (current) rows.push(current);
  return rows;
}

/** M/D/YYYY (as shown on the page) → UTC date. */
export function parseUsDate(s: string): Date {
  const [m, d, y] = s.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
