import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

/**
 * POST /api/scout/ingest
 *
 * Accepts pre-scraped player data (e.g., from a browser automation reading the DOM)
 * and upserts players + snapshots to the database. No BB API call needed.
 *
 * Body: { players: PlayerInput[] }
 *
 * PlayerInput: {
 *   bbPlayerId: number        — BB player ID (required)
 *   name: string              — Player name (required)
 *   nationality?: string      — Country name (e.g., "Slovenia")
 *   height?: string           — Height string (e.g., "6'8\" / 205 cm")
 *   position?: string         — Position (PG/SG/SF/PF/C)
 *   age?: number              — Player age
 *   salary?: number           — Weekly salary
 *   potential?: number        — Potential level (0-11)
 *   dmi?: number              — DMI value
 *   gameShape?: number        — Game shape (1-20)
 *   experience?: number       — Experience (1-20)
 *   skillPoints?: number      — Total skill points
 *   ownerTeamName?: string    — Club team name
 *   ownerTeamId?: number      — Club team ID
 *   skills?: {                — Individual skills (1-20 each)
 *     jump_shot?: number
 *     jump_range?: number
 *     outside_def?: number
 *     handling?: number
 *     driving?: number
 *     passing?: number
 *     inside_shot?: number
 *     inside_def?: number
 *     rebounding?: number
 *     shot_blocking?: number
 *     stamina?: number
 *     free_throw?: number
 *   }
 * }
 */

interface PlayerInput {
  bbPlayerId: number;
  name: string;
  nationality?: string;
  height?: string;
  position?: string;
  age?: number;
  salary?: number;
  potential?: number;
  dmi?: number;
  gameShape?: number;
  experience?: number;
  skillPoints?: number;
  ownerTeamName?: string;
  ownerTeamId?: number;
  skills?: Record<string, number | null>;
}

export async function POST(request: NextRequest) {
  let body: { players: PlayerInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { players } = body;

  if (!players || !Array.isArray(players) || players.length === 0) {
    return NextResponse.json({ error: 'players array is required' }, { status: 400 });
  }

  if (players.length > 50) {
    return NextResponse.json({ error: 'Maximum 50 players per request' }, { status: 400 });
  }

  // Validate required fields
  for (const p of players) {
    if (!p.bbPlayerId || !p.name) {
      return NextResponse.json(
        { error: `Each player needs bbPlayerId and name. Got: ${JSON.stringify(p)}` },
        { status: 400 }
      );
    }
  }

  // Fetch current season for snapshot tagging
  let currentSeasonId: number | null = null;
  try {
    const { bbApiLogin, bbApiLogout, fetchSeasons, getCurrentSeason } = await import('@/lib/bbapi');
    const username = process.env.BB_API_USERNAME;
    const securityCode = process.env.BB_API_SECURITY_CODE;
    if (username && securityCode) {
      const cookie = await bbApiLogin(username, securityCode);
      try {
        const seasons = await fetchSeasons(cookie);
        const current = getCurrentSeason(seasons);
        if (current) currentSeasonId = current.id;
      } finally {
        try { await bbApiLogout(cookie); } catch { /* ignore */ }
      }
    }
  } catch { /* non-fatal — snapshots just won't have bb_season */ }

  const supabase = getSupabaseServer();
  const results: Array<{ bbPlayerId: number; name: string; status: 'created' | 'updated' }> = [];
  const errors: Array<{ bbPlayerId: number; error: string }> = [];

  for (const p of players) {
    try {
      // Check if player exists
      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('bb_player_id', p.bbPlayerId)
        .single();

      const isNew = !existing;

      // Upsert player
      const { data: player, error: playerError } = await supabase
        .from('players')
        .upsert({
          bb_player_id: p.bbPlayerId,
          name: p.name,
          nationality: p.nationality || null,
          height: p.height || null,
          position: p.position || null,
        }, { onConflict: 'bb_player_id' })
        .select()
        .single();

      if (playerError) throw playerError;

      // Calculate skill_points from skills if not provided
      let skillPoints = p.skillPoints ?? null;
      if (!skillPoints && p.skills) {
        const sum = Object.values(p.skills).filter((v): v is number => typeof v === 'number').reduce((a, b) => a + b, 0);
        if (sum > 0) skillPoints = sum;
      }

      // Build snapshot
      const snapshotData: Record<string, unknown> = {
        player_id: player.id,
        source: 'api',
        bb_season: currentSeasonId,
        age: p.age ?? null,
        salary: p.salary ?? null,
        experience: p.experience ?? null,
        skill_points: skillPoints,
        game_shape: p.gameShape ?? null,
        potential: p.potential ?? null,
        dmi: p.dmi ?? null,
        owner_team_name: p.ownerTeamName ?? null,
        owner_team_id: p.ownerTeamId ?? null,
        ...(p.skills || {}),
      };

      // Snapshot dedup: check for existing snapshot today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: existingSnaps } = await supabase
        .from('skill_snapshots')
        .select('id')
        .eq('player_id', player.id)
        .gte('captured_at', todayStart.toISOString())
        .lte('captured_at', todayEnd.toISOString())
        .order('captured_at', { ascending: false })
        .limit(1);

      if (existingSnaps && existingSnaps.length > 0) {
        const { error: snapError } = await supabase
          .from('skill_snapshots')
          .update({ ...snapshotData, captured_at: new Date().toISOString() })
          .eq('id', existingSnaps[0].id);
        if (snapError) throw snapError;
      } else {
        const { error: snapError } = await supabase
          .from('skill_snapshots')
          .insert(snapshotData);
        if (snapError) throw snapError;
      }

      results.push({
        bbPlayerId: p.bbPlayerId,
        name: p.name,
        status: isNew ? 'created' : 'updated',
      });
    } catch (err) {
      errors.push({
        bbPlayerId: p.bbPlayerId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({ results, errors });
}
