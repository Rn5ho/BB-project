// BB Scout - Background Service Worker (Manifest V3)
// Handles auth token refresh and periodic sync retries

const SUPABASE_URL = 'https://zhywajswbpdmhpeqyczc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IHc1rsVvj_jhP5dozauCcw_ITYxRerW';
const DASHBOARD_URL = 'https://bb-project-eta.vercel.app';

async function getCurrentBbSeason() {
  try {
    const cached = await chrome.storage.local.get('bb_current_season');
    if (cached.bb_current_season) {
      const { season, finish, timestamp } = cached.bb_current_season;
      const within24h = Date.now() - timestamp < 24 * 60 * 60 * 1000;
      let pastFinish = false;
      if (finish) {
        const ms = new Date(finish).getTime();
        if (Number.isFinite(ms) && Date.now() > ms) pastFinish = true;
      }
      if (season && within24h && !pastFinish) return season;
    }
    const res = await fetch(`${DASHBOARD_URL}/api/scout/seasons`);
    if (res.ok) {
      const data = await res.json();
      if (data.currentSeason) {
        await chrome.storage.local.set({
          bb_current_season: {
            season: data.currentSeason,
            finish: data.currentFinish || null,
            timestamp: Date.now()
          }
        });
        return data.currentSeason;
      }
    }
  } catch (err) { console.warn('[BB Scout] Could not fetch season:', err); }
  return null;
}

// ========================================
// TOKEN REFRESH
// ========================================

// Check and refresh token periodically
chrome.alarms.create('refreshToken', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'refreshToken') {
    await refreshTokenIfNeeded();
  }
  if (alarm.name === 'retrySync') {
    await retryUnsynced();
  }
});

async function refreshTokenIfNeeded() {
  try {
    const result = await chrome.storage.local.get('bb_scout_auth');
    const auth = result.bb_scout_auth;

    if (!auth || !auth.refresh_token) return;

    // Refresh if token expires within 10 minutes
    const tenMinutes = 10 * 60 * 1000;
    if (auth.expires_at && auth.expires_at - Date.now() > tenMinutes) return;

    console.log('[BB Scout] Refreshing auth token...');

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ refresh_token: auth.refresh_token })
    });

    if (!res.ok) {
      console.warn('[BB Scout] Token refresh failed:', res.status);
      return;
    }

    const data = await res.json();
    const newAuth = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user_id: data.user.id,
      email: data.user.email,
      expires_at: Date.now() + (data.expires_in * 1000)
    };

    await chrome.storage.local.set({ bb_scout_auth: newAuth });
    console.log('[BB Scout] Token refreshed successfully');
  } catch (err) {
    console.error('[BB Scout] Token refresh error:', err);
  }
}

// ========================================
// RETRY SYNC
// ========================================

// Set up periodic retry for unsynced data
chrome.alarms.create('retrySync', { periodInMinutes: 5 });

async function retryUnsynced() {
  try {
    const result = await chrome.storage.local.get('bb_scout_auth');
    const auth = result.bb_scout_auth;
    if (!auth || !auth.access_token) return;

    const all = await chrome.storage.local.get(null);
    const unsyncedKeys = Object.keys(all).filter(
      k => k.startsWith('bb_scout_player_') && all[k] && !all[k].synced
    );

    if (unsyncedKeys.length === 0) return;

    console.log(`[BB Scout] Retrying sync for ${unsyncedKeys.length} players...`);

    for (const key of unsyncedKeys) {
      try {
        const playerData = all[key];
        await syncPlayerToSupabase(playerData, auth);
        playerData.synced = true;
        await chrome.storage.local.set({ [key]: playerData });
        console.log(`[BB Scout] Synced: ${playerData.name}`);
      } catch (err) {
        // Will retry next cycle
        console.warn(`[BB Scout] Retry failed for ${key}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[BB Scout] Retry sync error:', err);
  }
}

async function syncPlayerToSupabase(playerData, auth) {
  // Upsert player
  const playerRes = await fetch(`${SUPABASE_URL}/rest/v1/players?on_conflict=bb_player_id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${auth.access_token}`,
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({
      bb_player_id: playerData.bbPlayerId,
      name: playerData.name,
      nationality: playerData.nationality || null,
      height: playerData.height,
      position: playerData.position
    })
  });

  if (!playerRes.ok) throw new Error(`Player upsert: ${playerRes.status}`);
  const playerRecord = (await playerRes.json())[0];

  // Insert snapshot
  const bbSeason = await getCurrentBbSeason();
  const snapRes = await fetch(`${SUPABASE_URL}/rest/v1/skill_snapshots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${auth.access_token}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      player_id: playerRecord.id,
      captured_by: auth.user_id,
      source: 'extension',
      bb_season: bbSeason,
      age: playerData.age,
      salary: playerData.salary,
      experience: playerData.experience,
      skill_points: playerData.skillPoints,
      game_shape: playerData.gameShape,
      potential: playerData.potential,
      dmi: playerData.dmi,
      owner_team_name: playerData.ownerTeamName,
      owner_team_id: playerData.ownerTeamId,
      ...playerData.skills
    })
  });

  if (!snapRes.ok) throw new Error(`Snapshot: ${snapRes.status}`);
}

// ========================================
// INSTALL / UPDATE
// ========================================

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[BB Scout] Extension installed');
  } else if (details.reason === 'update') {
    console.log('[BB Scout] Extension updated to', chrome.runtime.getManifest().version);
  }
});
