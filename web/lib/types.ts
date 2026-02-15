export interface Player {
  id: number;
  bb_player_id: number;
  name: string;
  nationality: string | null;
  height: string | null;
  position: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillSnapshot {
  id: number;
  player_id: number;
  captured_by: string | null;
  captured_at: string;
  source: 'extension' | 'manual' | 'api';
  bb_season: number | null;

  // Metadata
  age: number | null;
  salary: number | null;
  experience: number | null;
  skill_points: number | null;
  game_shape: number | null;
  potential: number | null;
  dmi: number | null;

  // Skills
  jump_shot: number | null;
  jump_range: number | null;
  outside_def: number | null;
  handling: number | null;
  driving: number | null;
  passing: number | null;
  inside_shot: number | null;
  inside_def: number | null;
  rebounding: number | null;
  shot_blocking: number | null;
  stamina: number | null;
  free_throw: number | null;

  // Team context
  owner_team_name: string | null;
  owner_team_id: number | null;
}

export interface PlayerNote {
  id: number;
  player_id: number;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerTag {
  id: number;
  player_id: number;
  user_id: string;
  tag: string;
  created_at: string;
}

// Combined player data for list view
export interface PlayerWithLatestSnapshot extends Player {
  latest_snapshot: SkillSnapshot | null;
  tags: PlayerTag[];
}
