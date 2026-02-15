// Training simulator type definitions

// The 10 skills affected by regular training (excludes stamina/free_throw)
export type TrainableSkillKey =
  | 'jump_shot'
  | 'jump_range'
  | 'outside_def'
  | 'handling'
  | 'driving'
  | 'passing'
  | 'inside_shot'
  | 'inside_def'
  | 'rebounding'
  | 'shot_blocking';

// All 12 skills
export type AllSkillKey = TrainableSkillKey | 'stamina' | 'free_throw';

// Training types from BB's dropdown
export type TrainingType =
  | 'Pressure'
  | 'Shot Blocking'
  | 'Inside Defense'
  | 'Rebounding'
  | 'Inside Scoring'
  | 'One on One'
  | 'Outside Shooting'
  | 'Jump Shot'
  | 'Ball Handling'
  | 'Passing';

// Position combos used in the training matrix
export type TrainingPosition =
  | 'PG' | 'SG' | 'SF' | 'PF' | 'C'
  | 'PG/SG' | 'SG/SF' | 'SF/PF' | 'PF/C'
  | 'PG/SG/SF' | 'SG/SF/PF' | 'SF/PF/C'
  | 'PG/SG (Guards)' | 'SG/SF (Wingmen)' | 'SF/PF (Forwards)'
  | 'C/PF' | 'PF/SF' | 'SF/SG' | 'SG/PG'
  | 'C/PF/SF' | 'PF/SF/SG' | 'SF/SG/PG'
  | 'Team';

export type TrainerLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Player's skill state with decimal values (internal representation)
export interface SkillState {
  jump_shot: number;
  jump_range: number;
  outside_def: number;
  handling: number;
  driving: number;
  passing: number;
  inside_shot: number;
  inside_def: number;
  rebounding: number;
  shot_blocking: number;
  stamina: number;
  free_throw: number;
}

// Configuration for a single training week
export interface TrainingWeekConfig {
  trainingType: TrainingType;
  trainingPosition: TrainingPosition;
  trainerLevel: TrainerLevel;
  youthTrainerLevel: number; // 0 = none, 1-7
  gymLevel: 0 | 1 | 2 | 3;
  trainingCourtLevel: 0 | 1 | 2 | 3;
  minutesPlayed: number;
}

// Player parameters (fixed for a simulation run)
export interface PlayerParams {
  age: number;
  heightCm: number;
  potential: number; // 0-11 integer
  currentSkills: SkillState;
  potentialResistance: 'low' | 'medium' | 'high'; // used when potentialModel === 'on'
  potentialModel: 'off' | 'on';
}

// Skill gains broken down by source
export interface SkillGainBreakdown {
  base: number;
  elastic: number;
  crossTraining: number;
  total: number;
}

// Result for a single week of training
export interface WeeklyTrainingResult {
  gains: Record<AllSkillKey, SkillGainBreakdown>;
  newSkills: SkillState; // resulting decimal values
  newDisplayedSkills: Record<AllSkillKey, number>; // ceil-rounded for display
  levelUps: Partial<Record<AllSkillKey, boolean>>; // which skills crossed an integer boundary
  multipliers: {
    age: number;
    trainer: number;
    youthTrainer: number;
    minutes: number;
  };
  // Salary info for display (populated when potentialModel === 'on')
  salaryInfo?: {
    salary: number;
    position: string;
  };
}

// Multi-week plan entry
export interface TrainingPlanWeek {
  weekNumber: number;
  config: TrainingWeekConfig;
}

// Result for multi-week projection
export interface TrainingProjection {
  weeks: WeeklyProjectionEntry[];
  summary: ProjectionSummary;
}

export interface WeeklyProjectionEntry {
  weekNumber: number;
  age: number;
  config: TrainingWeekConfig;
  result: WeeklyTrainingResult;
}

export interface ProjectionSummary {
  totalGains: Record<AllSkillKey, number>;
  displayedGains: Record<AllSkillKey, number>;
  weeksSimulated: number;
  startAge: number;
  endAge: number;
}
