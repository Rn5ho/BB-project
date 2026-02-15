import { NextRequest, NextResponse } from 'next/server';
import { bbApiLogin, bbApiLogout, fetchPlayer, mapBbApiPlayerToDb } from '@/lib/bbapi';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const { playerIds } = await request.json() as { playerIds: number[] };

  if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
    return NextResponse.json({ error: 'playerIds array is required' }, { status: 400 });
  }

  if (playerIds.length > 20) {
    return NextResponse.json({ error: 'Maximum 20 player IDs per request' }, { status: 400 });
  }

  const username = process.env.BB_API_USERNAME;
  const securityCode = process.env.BB_API_SECURITY_CODE;
  if (!username || !securityCode) {
    return NextResponse.json({ error: 'BB API credentials not configured' }, { status: 500 });
  }

  const supabase = getSupabaseServer();
  let cookie: string | null = null;
  const results: Array<{
    bbPlayerId: number;
    name: string;
    status: 'created' | 'updated';
    playerId: number;
  }> = [];
  const errors: Array<{ bbPlayerId: number; error: string }> = [];

  try {
    cookie = await bbApiLogin(username, securityCode);

    for (const pid of playerIds) {
      try {
        const apiPlayer = await fetchPlayer(pid, cookie);
        const { playerData, snapshotData } = mapBbApiPlayerToDb(apiPlayer);

        // Check if player already exists
        const { data: existing } = await supabase
          .from('players')
          .select('id')
          .eq('bb_player_id', playerData.bb_player_id)
          .single();

        const isNew = !existing;

        // Upsert player
        const { data: player, error: playerError } = await supabase
          .from('players')
          .upsert(playerData, { onConflict: 'bb_player_id' })
          .select()
          .single();

        if (playerError) throw playerError;

        // Snapshot dedup: check if a snapshot already exists for this player today
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
          // Update existing snapshot
          const { error: snapError } = await supabase
            .from('skill_snapshots')
            .update({ ...snapshotData, player_id: player.id, captured_at: new Date().toISOString() })
            .eq('id', existingSnaps[0].id);

          if (snapError) throw snapError;
        } else {
          // Insert new snapshot
          const { error: snapError } = await supabase
            .from('skill_snapshots')
            .insert({ ...snapshotData, player_id: player.id });

          if (snapError) throw snapError;
        }

        results.push({
          bbPlayerId: pid,
          name: playerData.name,
          status: isNew ? 'created' : 'updated',
          playerId: player.id,
        });
      } catch (err) {
        errors.push({
          bbPlayerId: pid,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to connect to BB API',
    }, { status: 502 });
  } finally {
    if (cookie) {
      try { await bbApiLogout(cookie); } catch { /* ignore logout errors */ }
    }
  }

  return NextResponse.json({ results, errors });
}
