// Skill level number → text mapping (BuzzerBeater's scale)
export const SKILL_LEVELS: Record<number, string> = {
  1: 'atrocious',
  2: 'pitiful',
  3: 'awful',
  4: 'inept',
  5: 'mediocre',
  6: 'average',
  7: 'respectable',
  8: 'strong',
  9: 'proficient',
  10: 'prominent',
  11: 'prolific',
  12: 'sensational',
  13: 'tremendous',
  14: 'wondrous',
  15: 'marvelous',
  16: 'prodigious',
  17: 'stupendous',
  18: 'phenomenal',
  19: 'colossal',
  20: 'legendary',
};

export const POTENTIAL_LEVELS: Record<number, string> = {
  0: 'announcer',
  1: 'bench warmer',
  2: 'role player',
  3: '6th man',
  4: 'starter',
  5: 'star',
  6: 'allstar',
  7: 'perennial allstar',
  8: 'superstar',
  9: 'MVP',
  10: 'hall of famer',
  11: 'all-time great',
};

// The 12 skills with display names and database column keys
export const SKILLS = [
  { name: 'Jump Shot', dbKey: 'jump_shot' },
  { name: 'Jump Range', dbKey: 'jump_range' },
  { name: 'Outside Def.', dbKey: 'outside_def' },
  { name: 'Handling', dbKey: 'handling' },
  { name: 'Driving', dbKey: 'driving' },
  { name: 'Passing', dbKey: 'passing' },
  { name: 'Inside Shot', dbKey: 'inside_shot' },
  { name: 'Inside Def.', dbKey: 'inside_def' },
  { name: 'Rebounding', dbKey: 'rebounding' },
  { name: 'Shot Blocking', dbKey: 'shot_blocking' },
  { name: 'Stamina', dbKey: 'stamina' },
  { name: 'Free Throw', dbKey: 'free_throw' },
] as const;

export type SkillDbKey = (typeof SKILLS)[number]['dbKey'];

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;

// Exact BuzzerBeater color scheme for skill levels (1-20)
// Extracted from BB's HTML source - Black → Dark Blue → Purple → Red → Orange → Gold → Green/Teal
const SKILL_COLORS: Record<number, string> = {
  1:  '#000000', // atrocious - black
  2:  '#121263', // pitiful - dark navy
  3:  '#221385', // awful - dark blue
  4:  '#30139F', // inept - blue
  5:  '#700BA2', // mediocre - dark purple
  6:  '#910B9D', // average - purple
  7:  '#AD0B88', // respectable - magenta-purple
  8:  '#B70B5A', // strong - crimson
  9:  '#9C0B32', // proficient - dark red
  10: '#A70B00', // prominent - red
  11: '#BD2600', // prolific - red-orange
  12: '#CB3100', // sensational - orange-red
  13: '#D93C00', // tremendous - dark orange
  14: '#DB6E04', // wondrous - orange
  15: '#E5A64B', // marvelous - gold
  16: '#AC860A', // prodigious - dark gold
  17: '#8E9800', // stupendous - olive-green
  18: '#498E00', // phenomenal - green
  19: '#0EAE28', // colossal - bright green
  20: '#0EB366', // legendary - teal-green
};

export function getSkillColor(level: number | null): string {
  if (level === null) return '#6b7280';
  return SKILL_COLORS[level] || '#6b7280';
}

// Exact BuzzerBeater color scheme for potential levels (0-11)
// Extracted from BB's HTML source
const POTENTIAL_COLORS: Record<number, string> = {
  0:  '#700BA2', // announcer - dark purple
  1:  '#910B9D', // bench warmer - purple
  2:  '#AD0B88', // role player - magenta-purple
  3:  '#B70B5A', // 6th man - crimson
  4:  '#9C0B32', // starter - dark red
  5:  '#A70B00', // star - red
  6:  '#BD2600', // allstar - red-orange
  7:  '#CB3100', // perennial allstar - orange-red
  8:  '#D93C00', // superstar - dark orange
  9:  '#E5A64B', // MVP - gold
  10: '#AC860A', // hall of famer - dark gold
  11: '#8E9800', // all-time great - olive-green
};

export function getPotentialColor(potential: number | null): string {
  if (potential === null) return '#6b7280';
  return POTENTIAL_COLORS[potential] || '#6b7280';
}

export function getSkillBgColor(level: number | null): string {
  if (level === null) return 'bg-gray-500/10';
  if (level >= 16) return 'bg-green-500/10';   // green/teal
  if (level >= 11) return 'bg-orange-500/10';   // orange/gold
  if (level >= 8) return 'bg-red-500/10';       // red
  if (level >= 5) return 'bg-purple-500/10';    // purple
  return 'bg-blue-500/10';                      // black/dark blue
}
