// BB Scout - Common utilities and skill mappings

// Skill level number → text mapping (BuzzerBeater's scale)
const SKILL_LEVELS = {
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
  20: 'legendary'
};

// Reverse mapping: text → number
const SKILL_LEVELS_REVERSE = {};
for (const [num, text] of Object.entries(SKILL_LEVELS)) {
  SKILL_LEVELS_REVERSE[text.toLowerCase()] = parseInt(num);
}

// Potential level mapping
const POTENTIAL_LEVELS = {
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
  11: 'all-time great'
};

const POTENTIAL_LEVELS_REVERSE = {};
for (const [num, text] of Object.entries(POTENTIAL_LEVELS)) {
  POTENTIAL_LEVELS_REVERSE[text.toLowerCase()] = parseInt(num);
}

// The 12 skills we track, with their display names and DB column names
const SKILLS = [
  { name: 'Jump Shot',      dbKey: 'jump_shot',      parseKey: 'JumpShot' },
  { name: 'Jump Range',     dbKey: 'jump_range',     parseKey: 'JumpRange' },
  { name: 'Outside Def.',   dbKey: 'outside_def',    parseKey: 'OutsideDef' },
  { name: 'Handling',       dbKey: 'handling',        parseKey: 'Handling' },
  { name: 'Driving',        dbKey: 'driving',         parseKey: 'Driving' },
  { name: 'Passing',        dbKey: 'passing',         parseKey: 'Passing' },
  { name: 'Inside Shot',    dbKey: 'inside_shot',    parseKey: 'InsideShot' },
  { name: 'Inside Def.',    dbKey: 'inside_def',     parseKey: 'InsideDef' },
  { name: 'Rebounding',     dbKey: 'rebounding',      parseKey: 'Rebounding' },
  { name: 'Shot Blocking',  dbKey: 'shot_blocking',  parseKey: 'ShotBlocking' },
  { name: 'Stamina',        dbKey: 'stamina',         parseKey: 'Stamina' },
  { name: 'Free Throw',     dbKey: 'free_throw',     parseKey: 'FreeThrow' }
];

// Position mapping
const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

// Exact BuzzerBeater color scheme for skill levels (1-20)
// Extracted from BB's HTML source - Black → Dark Blue → Purple → Red → Orange → Gold → Green/Teal
const SKILL_COLORS = {
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

function getSkillColor(level) {
  return SKILL_COLORS[level] || '#808080';
}

// Parse a skill text value to its numeric equivalent
function parseSkillText(text) {
  if (!text) return null;
  const cleaned = text.trim().toLowerCase();
  return SKILL_LEVELS_REVERSE[cleaned] || null;
}

// Parse potential text to numeric
function parsePotentialText(text) {
  if (!text) return null;
  const cleaned = text.trim().toLowerCase();
  return POTENTIAL_LEVELS_REVERSE[cleaned] || null;
}

// Supabase configuration - UPDATE THESE with your project values
const SUPABASE_URL = 'https://zhywajswbpdmhpeqyczc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IHc1rsVvj_jhP5dozauCcw_ITYxRerW';
