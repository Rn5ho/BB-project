// Source: docs/research/training/buzzeriq/API-MAP.md (ID table, verified vs the real
// BB dropdown) + docs/research/training/coachparrot/training_rate_matrix.csv (names).
import { ALL_POSITIONS, type Position, type SkillKey, type TrainingType } from './types';

const P = (digits: string): Position[] =>
  digits === 'team' ? [...ALL_POSITIONS] : [...digits].map((d) => ALL_POSITIONS[Number(d) - 1]);

function t(id: number, name: string, primary: SkillKey, digits: string): TrainingType {
  return { id, name, primary, positions: P(digits), kind: 'skill' };
}

export const TRAINING_CATALOG: TrainingType[] = [
  t(1, 'JS for 12', 'js', '12'),
  t(2, 'JS for 34', 'js', '34'),
  t(3, 'JS for 23', 'js', '23'),
  t(4, 'JS for team', 'js', 'team'),
  t(5, 'JR for 2', 'jr', '2'),
  t(6, 'JR for 12', 'jr', '12'),
  t(7, 'JR for 23', 'jr', '23'),
  t(8, 'JR for team', 'jr', 'team'),
  t(9, 'OD for 1', 'od', '1'),
  t(10, 'OD for 12', 'od', '12'),
  t(11, 'OD for 123', 'od', '123'),
  t(12, 'HA for 1', 'ha', '1'),
  t(13, 'HA for 12', 'ha', '12'),
  t(14, 'HA for 123', 'ha', '123'),
  t(15, 'DR for 12', 'dr', '12'),
  t(16, 'DR for 34', 'dr', '34'),
  t(17, 'DR for team', 'dr', 'team'),
  t(18, 'PA for 1', 'pa', '1'),
  t(19, 'PA for 12', 'pa', '12'),
  t(20, 'PA for team', 'pa', 'team'),
  t(21, 'IS for 5', 'is', '5'),
  t(22, 'IS for 45', 'is', '45'),
  t(23, 'IS for 345', 'is', '345'),
  t(24, 'ID for 5', 'id', '5'),
  t(25, 'ID for 45', 'id', '45'),
  t(26, 'ID for 345', 'id', '345'),
  t(27, 'RB for 45', 'rb', '45'),
  t(28, 'RB for team', 'rb', 'team'),
  t(29, 'SB for 5', 'sb', '5'),
  t(30, 'SB for 45', 'sb', '45'),
  t(31, 'SB for 345', 'sb', '345'),
  { id: 32, name: 'Stamina', primary: null, positions: [...ALL_POSITIONS], kind: 'stamina' },
  { id: 33, name: 'Free Throw', primary: null, positions: [...ALL_POSITIONS], kind: 'freethrow' },
];

export function getTrainingType(id: number): TrainingType {
  const tt = TRAINING_CATALOG[id - 1];
  if (!tt || tt.id !== id) throw new Error(`unknown training type id ${id}`);
  return tt;
}
