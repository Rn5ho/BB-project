// BB Scout - Extension Popup Logic

// Configuration - UPDATE THESE with your Supabase project values
const SUPABASE_URL = 'https://zhywajswbpdmhpeqyczc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IHc1rsVvj_jhP5dozauCcw_ITYxRerW';
const DASHBOARD_URL = 'https://bb-project-eta.vercel.app';

document.addEventListener('DOMContentLoaded', async () => {
  // Check existing auth state
  const authData = await getAuth();
  if (authData && authData.access_token) {
    showLoggedInView(authData);
  }

  // Set up dashboard link
  document.getElementById('dashboard-link').href = DASHBOARD_URL;

  // Event listeners
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('signup-btn').addEventListener('click', handleSignup);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('sync-btn').addEventListener('click', handleSync);
  document.getElementById('show-overlay-btn').addEventListener('click', handleShowOverlay);
  document.getElementById('clear-local-btn').addEventListener('click', handleClearLocal);

  // Enter key on password field
  document.getElementById('password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
});

// ========================================
// AUTH FUNCTIONS
// ========================================

async function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showStatus('Please enter email and password', 'error');
    return;
  }

  showStatus('Logging in...', 'info');

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error_description || err.msg || 'Login failed');
    }

    const data = await res.json();
    const authData = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user_id: data.user.id,
      email: data.user.email,
      expires_at: Date.now() + (data.expires_in * 1000)
    };

    await saveAuth(authData);
    showStatus('Logged in!', 'success');
    showLoggedInView(authData);
  } catch (err) {
    showStatus(err.message, 'error');
  }
}

async function handleSignup() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showStatus('Please enter email and password', 'error');
    return;
  }

  if (password.length < 6) {
    showStatus('Password must be at least 6 characters', 'error');
    return;
  }

  showStatus('Creating account...', 'info');

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error_description || err.msg || 'Signup failed');
    }

    showStatus('Account created! Check your email to confirm, then log in.', 'success');
  } catch (err) {
    showStatus(err.message, 'error');
  }
}

async function handleLogout() {
  await chrome.storage.local.remove('bb_scout_auth');
  showLoggedOutView();
  showStatus('Logged out', 'success');
}

async function handleClearLocal() {
  const all = await chrome.storage.local.get(null);
  const playerKeys = Object.keys(all).filter(k => k.startsWith('bb_scout_player_'));

  if (playerKeys.length === 0) {
    showStatus('No local data to clear', 'info');
    return;
  }

  const confirmed = confirm(`Clear ${playerKeys.length} locally cached player(s)? This only removes the local cache — your database data is not affected.`);
  if (!confirmed) return;

  await chrome.storage.local.remove(playerKeys);
  showStatus(`Cleared ${playerKeys.length} local entries`, 'success');
  updateStats();
}

async function handleShowOverlay() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.includes('buzzerbeater.com')) {
      showStatus('Navigate to a BuzzerBeater page first', 'error');
      return;
    }
    chrome.tabs.sendMessage(tab.id, { action: 'showOverlay' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('No BB Scout script on this page. Try refreshing.', 'error');
      } else {
        showStatus('Overlay shown!', 'success');
      }
    });
  } catch (err) {
    showStatus('Could not reach page: ' + err.message, 'error');
  }
}

async function handleSync() {
  const authData = await getAuth();
  if (!authData) {
    showStatus('Not logged in', 'error');
    return;
  }

  showStatus('Syncing...', 'info');

  try {
    // Get all locally saved, unsynced players
    const all = await chrome.storage.local.get(null);
    const unsyncedKeys = Object.keys(all).filter(
      k => k.startsWith('bb_scout_player_') && all[k] && !all[k].synced
    );

    if (unsyncedKeys.length === 0) {
      showStatus('Everything is synced!', 'success');
      return;
    }

    let synced = 0;
    let failed = 0;

    for (const key of unsyncedKeys) {
      try {
        const playerData = all[key];
        // Try to sync this player (same logic as the content script save)
        await syncPlayer(playerData, authData);
        synced++;
        // Mark as synced
        playerData.synced = true;
        await chrome.storage.local.set({ [key]: playerData });
      } catch (err) {
        console.error(`[BB Scout] Sync failed for ${key}:`, err);
        failed++;
      }
    }

    showStatus(`Synced ${synced} player(s)${failed > 0 ? `, ${failed} failed` : ''}`,
      failed > 0 ? 'warning' : 'success');
    updateStats();
  } catch (err) {
    showStatus(`Sync error: ${err.message}`, 'error');
  }
}

async function syncPlayer(playerData, authData) {
  // Upsert player
  const playerPayload = {
    bb_player_id: playerData.bbPlayerId,
    name: playerData.name,
    nationality: 'Slovenia',
    height: playerData.height,
    position: playerData.position
  };

  const playerRes = await fetch(`${SUPABASE_URL}/rest/v1/players?on_conflict=bb_player_id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${authData.access_token}`,
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(playerPayload)
  });

  if (!playerRes.ok) throw new Error(`Player upsert failed: ${playerRes.status}`);
  const playerRecord = (await playerRes.json())[0];

  // Insert snapshot
  const snapshotPayload = {
    player_id: playerRecord.id,
    captured_by: authData.user_id,
    source: 'extension',
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
  };

  const snapRes = await fetch(`${SUPABASE_URL}/rest/v1/skill_snapshots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${authData.access_token}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(snapshotPayload)
  });

  if (!snapRes.ok) throw new Error(`Snapshot failed: ${snapRes.status}`);
}

// ========================================
// UI FUNCTIONS
// ========================================

function showLoggedInView(authData) {
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('logged-in-view').classList.add('active');
  document.getElementById('user-email').textContent = authData.email;
  updateStats();
}

function showLoggedOutView() {
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('logged-in-view').classList.remove('active');
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
}

async function updateStats() {
  try {
    const all = await chrome.storage.local.get(null);
    const playerKeys = Object.keys(all).filter(k => k.startsWith('bb_scout_player_'));
    const unsynced = playerKeys.filter(k => all[k] && !all[k].synced);

    document.getElementById('stat-local').textContent = playerKeys.length;
    document.getElementById('stat-unsynced').textContent = unsynced.length;
  } catch (err) {
    console.error('[BB Scout] Stats error:', err);
  }
}

function showStatus(message, type) {
  const el = document.getElementById('status');
  el.textContent = message;
  el.className = `status show ${type || ''}`;

  if (type === 'success') {
    setTimeout(() => {
      el.classList.remove('show');
    }, 3000);
  }
}

// ========================================
// STORAGE HELPERS
// ========================================

async function getAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.get('bb_scout_auth', (result) => {
      resolve(result.bb_scout_auth || null);
    });
  });
}

async function saveAuth(authData) {
  return chrome.storage.local.set({ bb_scout_auth: authData });
}
