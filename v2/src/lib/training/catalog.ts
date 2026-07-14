// Source: docs/research/training/buzzeriq/API-MAP.md (ID table, verified vs the real
// BB dropdown) + docs/research/training/coachparrot/training_rate_matrix.csv (names).
import { ALL_POSITIONS, type Position, type SkillKey, type TrainingType } from './types';

const P = (digits: string): Position[] =>
  digits === 'team' ? [...ALL_POSITIONS] : [...digits].map((d) => ALL_POSITIONS[Number(d) - 1]);

// label = the in-game training name (BB "Choose Training" dropdown) + trained positions.
// name = the primary-skill key the community research sources use for the same row.
function t(id: number, name: string, label: string, primary: SkillKey, digits: string): TrainingType {
  return { id, name, label, primary, positions: P(digits), kind: 'skill' };
}

export const TRAINING_CATALOG: TrainingType[] = [
  t(1, 'JS for 12', 'Jump Shot (PG/SG)', 'js', '12'),
  t(2, 'JS for 34', 'Jump Shot (SF/PF)', 'js', '34'),
  t(3, 'JS for 23', 'Jump Shot (SG/SF)', 'js', '23'),
  t(4, 'JS for team', 'Jump Shot (Team)', 'js', 'team'),
  t(5, 'JR for 2', 'Outside Shooting (SG)', 'jr', '2'),
  t(6, 'JR for 12', 'Outside Shooting (PG/SG)', 'jr', '12'),
  t(7, 'JR for 23', 'Outside Shooting (SG/SF)', 'jr', '23'),
  t(8, 'JR for team', 'Outside Shooting (Team)', 'jr', 'team'),
  t(9, 'OD for 1', 'Outside Defense (PG)', 'od', '1'),
  t(10, 'OD for 12', 'Outside Defense (PG/SG)', 'od', '12'),
  t(11, 'OD for 123', 'Outside Defense (PG/SG/SF)', 'od', '123'),
  t(12, 'HA for 1', 'Ball Handling (PG)', 'ha', '1'),
  t(13, 'HA for 12', 'Ball Handling (PG/SG)', 'ha', '12'),
  t(14, 'HA for 123', 'Ball Handling (PG/SG/SF)', 'ha', '123'),
  t(15, 'DR for 12', 'One on One (PG/SG)', 'dr', '12'),
  t(16, 'DR for 34', 'One on One (SF/PF)', 'dr', '34'),
  t(17, 'DR for team', 'One on One (Team)', 'dr', 'team'),
  t(18, 'PA for 1', 'Passing (PG)', 'pa', '1'),
  t(19, 'PA for 12', 'Passing (PG/SG)', 'pa', '12'),
  t(20, 'PA for team', 'Passing (Team)', 'pa', 'team'),
  t(21, 'IS for 5', 'Inside Scoring (C)', 'is', '5'),
  t(22, 'IS for 45', 'Inside Scoring (PF/C)', 'is', '45'),
  t(23, 'IS for 345', 'Inside Scoring (SF/PF/C)', 'is', '345'),
  t(24, 'ID for 5', 'Inside Defense (C)', 'id', '5'),
  t(25, 'ID for 45', 'Inside Defense (PF/C)', 'id', '45'),
  t(26, 'ID for 345', 'Inside Defense (SF/PF/C)', 'id', '345'),
  t(27, 'RB for 45', 'Rebounding (PF/C)', 'rb', '45'),
  t(28, 'RB for team', 'Rebounding (Team)', 'rb', 'team'),
  t(29, 'SB for 5', 'Shot Blocking (C)', 'sb', '5'),
  t(30, 'SB for 45', 'Shot Blocking (PF/C)', 'sb', '45'),
  t(31, 'SB for 345', 'Shot Blocking (SF/PF/C)', 'sb', '345'),
  { id: 32, name: 'Stamina', label: 'Team Training: Stamina', primary: null, positions: [...ALL_POSITIONS], kind: 'stamina' },
  { id: 33, name: 'Free Throw', label: 'Team Training: Free Throws', primary: null, positions: [...ALL_POSITIONS], kind: 'freethrow' },
];

export function getTrainingType(id: number): TrainingType {
  const tt = TRAINING_CATALOG[id - 1];
  if (!tt || tt.id !== id) throw new Error(`unknown training type id ${id}`);
  return tt;
}
