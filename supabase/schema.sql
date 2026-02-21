-- BB Scout Database Schema
-- Run this in the Supabase SQL Editor to set up the database

-- ============================================
-- PROFILES (extends Supabase Auth users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bb_username TEXT,
  bb_team_id INTEGER,
  country TEXT DEFAULT 'Slovenia',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PLAYERS
-- ============================================
CREATE TABLE public.players (
  id SERIAL PRIMARY KEY,
  bb_player_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nationality TEXT DEFAULT 'Slovenia',
  height TEXT,
  position TEXT,
  is_nt_player BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read players" ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert players" ON players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON players FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Anyone can delete players" ON players FOR DELETE TO authenticated USING (true);

-- ============================================
-- SKILL SNAPSHOTS (core table)
-- ============================================
CREATE TABLE public.skill_snapshots (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  captured_by UUID REFERENCES auth.users(id),
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'extension' CHECK (source IN ('extension', 'manual', 'api')),
  bb_season INTEGER,

  -- Player metadata at time of capture
  age INTEGER,
  salary INTEGER,
  experience INTEGER,
  skill_points INTEGER,
  game_shape INTEGER,
  potential INTEGER,
  dmi INTEGER,

  -- The 12 skills (integers 1-20)
  jump_shot INTEGER,
  jump_range INTEGER,
  outside_def INTEGER,
  handling INTEGER,
  driving INTEGER,
  passing INTEGER,
  inside_shot INTEGER,
  inside_def INTEGER,
  rebounding INTEGER,
  shot_blocking INTEGER,
  stamina INTEGER,
  free_throw INTEGER,

  -- Team context
  owner_team_name TEXT,
  owner_team_id INTEGER
);

ALTER TABLE skill_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read snapshots" ON skill_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own snapshots" ON skill_snapshots FOR INSERT TO authenticated WITH CHECK (captured_by = auth.uid());
CREATE POLICY "Users update own snapshots" ON skill_snapshots FOR UPDATE TO authenticated USING (captured_by = auth.uid());

-- ============================================
-- PLAYER NOTES
-- ============================================
CREATE TABLE public.player_notes (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE player_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read notes" ON player_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own notes" ON player_notes FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users update own notes" ON player_notes FOR UPDATE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Users delete own notes" ON player_notes FOR DELETE TO authenticated USING (author_id = auth.uid());

-- ============================================
-- PLAYER TAGS
-- ============================================
CREATE TABLE public.player_tags (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, user_id, tag)
);

ALTER TABLE player_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tags" ON player_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own tags" ON player_tags FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own tags" ON player_tags FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_snapshots_player_id ON skill_snapshots(player_id);
CREATE INDEX idx_snapshots_captured_at ON skill_snapshots(captured_at DESC);
CREATE INDEX idx_snapshots_player_date ON skill_snapshots(player_id, captured_at DESC);
CREATE INDEX idx_players_bb_id ON players(bb_player_id);
CREATE INDEX idx_player_tags_player ON player_tags(player_id);
CREATE INDEX idx_player_tags_user_tag ON player_tags(user_id, tag);
CREATE INDEX idx_player_notes_player ON player_notes(player_id);
