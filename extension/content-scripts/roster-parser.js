// BB Scout - National Team Roster Page Parser
// Runs on buzzerbeater.com/national/* and buzzerbeater.com/country/*/jnt/*
// Batch-parses all players visible on the NT roster page
//
// Roster page structure (from live screenshots):
// - Page header: "Slovenija U21 National Team - National Team Roster"
// - "17 players" count shown
// - Each player in a distinct box/card containing:
//   - Header: "Tibor Likar (54516150)" with "Center" on the right
//   - Avatar image
//   - Left column: Weekly salary, DMI, Age, Height, Potential, Game Shape
//   - Right columns (2-col grid): Skills in "Skill Name: value (number)" format
//   - Bottom: "Experience: awful (3)" and "TSP: 94 (47 + 47)"

(function() {
  'use strict';

  console.log('[BB Scout Roster] Script loaded on:', window.location.href);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    console.log('[BB Scout Roster] init() called, readyState:', document.readyState);

    // Check if this is actually a roster page
    const pageText = document.body.innerText || '';
    const hasRosterText = pageText.includes('National Team Roster');
    const hasPlayersText = pageText.includes('players');
    console.log('[BB Scout Roster] Page check — "National Team Roster":', hasRosterText, ', "players":', hasPlayersText);

    if (!hasRosterText && !hasPlayersText) {
      console.log('[BB Scout Roster] Not a roster page, exiting.');
      return;
    }

    console.log('[BB Scout Roster] Roster page detected, parsing in 800ms...');

    setTimeout(() => {
      const players = parseRosterPage();
      console.log('[BB Scout Roster] parseRosterPage() returned', players ? players.length : 0, 'players');
      if (players && players.length > 0) {
        createRosterOverlay(players);
      } else {
        console.warn('[BB Scout Roster] No players parsed — overlay will not appear.');
      }
    }, 800);
  }

  // ========================================
  // ROSTER PAGE PARSING
  // ========================================

  // Parse the nationality from the page header (e.g. "Ukraina U21 National Team")
  function parsePageNationality() {
    // Try page heading elements first (most reliable — avoids sidebar/nav text)
    const headings = document.querySelectorAll('h1, h2, h3, .boxheader, #cphContent_lblTeamName, [class*="header"]');
    for (const el of headings) {
      const text = el.textContent || '';
      const hMatch = text.match(/^([A-ZÀ-Ža-zà-ž][A-Za-zÀ-Ža-zà-ž\s-]{1,30}?)\s+U-?\d+\s+National\s+Team/i);
      if (hMatch) return hMatch[1].trim();
    }

    // Fallback: search body text but require "U-21" or "U21" to anchor the match
    const bodyText = document.body.innerText || '';
    const ntMatch = bodyText.match(/([A-ZÀ-Ža-zà-ž][A-Za-zÀ-Ža-zà-ž\s-]{1,30}?)\s+U-?\d+\s+National\s+Team/i);
    if (ntMatch) {
      return ntMatch[1].trim();
    }

    // Last resort: match "X National Team" but limit the country name to max 3 words (no spaces run)
    const ntMatch2 = bodyText.match(/\b([A-ZÀ-Ž][a-zà-ž]+(?:\s[A-ZÀ-Ža-zà-ž]+){0,2})\s+National\s+Team/);
    if (ntMatch2) {
      return ntMatch2[1].trim();
    }
    return null;
  }

  function parseRosterPage() {
    const players = [];
    const bodyText = document.body.innerText || '';

    console.log('[BB Scout Roster] Body text length:', bodyText.length);
    // Log first 500 chars to help debug
    console.log('[BB Scout Roster] First 500 chars:', bodyText.substring(0, 500));

    // Parse nationality from page header once, normalize to English
    const pageNationality = normalizeNationality(parsePageNationality());
    console.log('[BB Scout Roster] Detected nationality:', pageNationality);

    // Strategy: Find all "(PLAYER_ID)" patterns (6+ digit IDs)
    // Validate by checking for skill keywords OR DMI-related keywords in the next ~800 chars
    // Position is parsed best-effort but NOT required
    const idRegex = /\((\d{6,})\)/g;
    const SKILL_KEYWORDS = ['Jump Shot', 'Jump Range', 'Handling', 'Driving', 'Passing',
      'Inside Shot', 'Rebounding', 'Shot Blocking', 'Stamina', 'Free Throw', 'DMI:'];
    // Keywords for DMI-only players (opponents whose skills are hidden)
    const DMI_KEYWORDS = ['DMI:', 'Age:', 'Potential:', 'Game Shape:', 'Weekly salary'];

    let match;
    const playerHeaders = [];
    while ((match = idRegex.exec(bodyText)) !== null) {
      const bbPlayerId = parseInt(match[1]);
      const idIndex = match.index;
      const afterId = bodyText.substring(match.index + match[0].length, match.index + match[0].length + 800);

      // Primary: check for skill keywords (full player data)
      const keywordHits = SKILL_KEYWORDS.filter(kw => afterId.includes(kw));
      const hasFullSkills = keywordHits.length >= 3;

      // Secondary: check for DMI-related keywords (DMI-only player, no skills visible)
      const dmiKeywordHits = DMI_KEYWORDS.filter(kw => afterId.includes(kw));
      const hasDmiData = dmiKeywordHits.length >= 3;

      if (!hasFullSkills && !hasDmiData) {
        // Not a player block at all
        console.log(`[BB Scout Roster] Skipping ID ${bbPlayerId} — only ${keywordHits.length} skill keywords, ${dmiKeywordHits.length} DMI keywords`);
        continue;
      }

      const isDmiOnly = !hasFullSkills && hasDmiData;
      if (isDmiOnly) {
        console.log(`[BB Scout Roster] DMI-only player detected: ${bbPlayerId} [${dmiKeywordHits.length} DMI keywords]`);
      }

      // Best-effort position parse (NOT required)
      const posMatchLoose = afterId.match(/(Point Guard|Shooting Guard|Small Forward|Power Forward|Center)/);
      let position = posMatchLoose ? abbreviatePosition(posMatchLoose[1]) : null;

      // Extract the name: look backwards from "(" to find the name
      const prefixStart = Math.max(0, idIndex - 80);
      const prefix = bodyText.substring(prefixStart, idIndex).trim();

      let name = null;

      // Try to find "Firstname Lastname" pattern at the end of the prefix (unicode-aware)
      // Use [ ] literal space to avoid matching across lines
      const nameMatch = prefix.match(/([A-ZÀ-Ža-zà-ž][a-zà-ž]+(?:[ ][A-ZÀ-Ža-zà-ž][a-zà-ž]+){1,3})\s*$/);
      if (nameMatch) {
        name = nameMatch[1].trim();
      }

      // Fallback: take the last reasonable chunk of text before the "("
      if (!name) {
        const lastLine = prefix.split(/\n/).pop().trim();
        name = lastLine.replace(/^[^A-ZÀ-Ža-zà-ž]+/, '').trim();
        if (name && name.split(/\s+/).length > 4) {
          const words = name.split(/\s+/);
          name = words.slice(-2).join(' ');
        }
      }

      // Reject "BuzzerBeater" and other junk
      if (!name || name.toLowerCase() === 'buzzerbeater' || name.length < 3) {
        name = `Player ${bbPlayerId}`;
      }

      console.log(`[BB Scout Roster] Found: ${name} (${bbPlayerId}) ${position || 'no pos'} [${keywordHits.length} skill kw, ${dmiKeywordHits.length} dmi kw]${isDmiOnly ? ' DMI-ONLY' : ''}`);

      playerHeaders.push({
        name,
        bbPlayerId,
        position,
        index: idIndex,
        isDmiOnly,
        nationality: pageNationality
      });
    }

    if (playerHeaders.length === 0) {
      console.warn('[BB Scout Roster] No player headers found.');
      const anyIds = [...bodyText.matchAll(/\((\d{7,8})\)/g)];
      console.log('[BB Scout Roster] Found', anyIds.length, 'potential IDs:', anyIds.slice(0, 5).map(m => m[1]));
      if (anyIds.length > 0) {
        const sample = bodyText.substring(Math.max(0, anyIds[0].index - 50), anyIds[0].index + 100);
        console.log('[BB Scout Roster] Text around first ID:', JSON.stringify(sample));
      }
      return [];
    }

    console.log(`[BB Scout Roster] Found ${playerHeaders.length} player headers`);

    // For each player, extract the text block between this header and the next
    for (let i = 0; i < playerHeaders.length; i++) {
      const start = playerHeaders[i].index;
      const end = i + 1 < playerHeaders.length ? playerHeaders[i + 1].index : bodyText.length;
      const playerText = bodyText.substring(start, end);

      const playerData = parsePlayerBlock(playerText, playerHeaders[i]);
      if (playerData) {
        players.push(playerData);
      }
    }

    console.log(`[BB Scout Roster] Successfully parsed ${players.length} players`);
    return players;
  }

  function parsePlayerBlock(text, header) {
    const data = {
      bbPlayerId: header.bbPlayerId,
      name: header.name,
      position: header.position,
      nationality: header.nationality,
      isDmiOnly: header.isDmiOnly || false,
      // For Slovenia (user's own NT), don't auto-flag — scouting uses roster cycling
      // For opponent NTs, auto-flag is genuine intel about their squad
      isNtPlayer: header.nationality !== 'Slovenia',
      age: null,
      height: null,
      salary: null,
      dmi: null,
      potential: null,
      gameShape: null,
      experience: null,
      skillPoints: null,
      ownerTeamName: null,
      ownerTeamId: null,
      skills: {}
    };

    // Parse metadata from the text block
    const ageMatch = text.match(/Age:\s*(\d+)/);
    if (ageMatch) data.age = parseInt(ageMatch[1]);

    const heightMatch = text.match(/Height:\s*([^\n]+)/);
    if (heightMatch) data.height = heightMatch[1].trim();

    const salaryMatch = text.match(/Weekly salary:\s*\$\s*([\d\s]+)/);
    if (salaryMatch) data.salary = parseInt(salaryMatch[1].replace(/\s/g, ''));

    const dmiMatch = text.match(/DMI:\s*([\d\s,.]+)/);
    if (dmiMatch) data.dmi = parseInt(dmiMatch[1].replace(/[\s,]/g, ''));

    // Potential
    const potMatch = text.match(/Potential:\s*([a-zA-Z\s]+?)(?:\s*[\[\(]|\s*$)/m);
    if (potMatch) {
      const potText = potMatch[1].trim().toLowerCase();
      const potLevels = Object.entries(POTENTIAL_LEVELS_REVERSE)
        .sort((a, b) => b[0].length - a[0].length);
      for (const [levelText, num] of potLevels) {
        if (potText.includes(levelText)) {
          data.potential = num;
          break;
        }
      }
    }

    // Game Shape: "Game Shape: average (6)"
    const gsMatch = text.match(/Game Shape:\s*(\w+)\s*\((\d+)\)/);
    if (gsMatch) data.gameShape = parseInt(gsMatch[2]);

    // Experience: "Experience: awful (3)"
    const expMatch = text.match(/Experience:\s*(\w+)\s*\((\d+)\)/);
    if (expMatch) data.experience = parseInt(expMatch[2]);

    // TSP / Skill Points: "Skill points: 94 (47|47)" or "TSP: 94 (47 + 47)"
    const tspMatch = text.match(/(?:Skill\s*points|TSP):\s*(\d+)/i);
    if (tspMatch) data.skillPoints = parseInt(tspMatch[1]);

    // Parse all 12 skills - format: "Jump Shot: strong (8)"
    for (const skill of SKILLS) {
      // Try with clean name (no period) and original name
      const cleanName = skill.name.replace(/\./g, '');
      const names = [cleanName, skill.name];

      let found = false;
      for (const name of names) {
        if (found) break;
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Pattern: "Skill Name: word (number)"
        const p1 = new RegExp(escaped + '\\s*[:\\s]\\s*([a-zA-Z\\s]+?)\\s*\\((\\d{1,2})\\)', 'i');
        const m1 = text.match(p1);
        if (m1) {
          const num = parseInt(m1[2]);
          if (num >= 1 && num <= 20) {
            data.skills[skill.dbKey] = num;
            found = true;
            continue;
          }
        }

        // Pattern: "Skill Name: word" (text only, no number)
        const p2 = new RegExp(escaped + '\\s*[:\\s]\\s*([a-zA-Z]+)', 'i');
        const m2 = text.match(p2);
        if (m2) {
          const val = parseSkillText(m2[1]);
          if (val) {
            data.skills[skill.dbKey] = val;
            found = true;
            continue;
          }
        }
      }

      if (!found) {
        data.skills[skill.dbKey] = null;
      }
    }

    // Count parsed skills
    const skillCount = Object.values(data.skills).filter(v => v !== null).length;

    // If TSP wasn't found via regex, calculate from individual skills
    if (!data.skillPoints && skillCount > 0) {
      const sum = Object.values(data.skills).filter(v => v !== null).reduce((a, b) => a + b, 0);
      if (sum > 0) {
        data.skillPoints = sum;
        console.log(`[BB Scout Roster] TSP calculated from skills: ${sum}`);
      }
    }

    data._parseInfo = {
      skillsParsed: skillCount,
      totalSkills: SKILLS.length,
      complete: skillCount === SKILLS.length,
      isDmiOnly: data.isDmiOnly
    };

    return data;
  }

  function abbreviatePosition(pos) {
    const map = {
      'point guard': 'PG',
      'shooting guard': 'SG',
      'small forward': 'SF',
      'power forward': 'PF',
      'center': 'C'
    };
    return map[pos.toLowerCase()] || pos;
  }

  // ========================================
  // ROSTER OVERLAY UI
  // ========================================

  function createRosterOverlay(players) {
    const existing = document.getElementById('bb-scout-overlay');
    if (existing) existing.remove();

    const fullPlayers = players.filter(p => !p._parseInfo.isDmiOnly);
    const dmiOnlyPlayers = players.filter(p => p._parseInfo.isDmiOnly);
    const totalSkills = fullPlayers.reduce((sum, p) => sum + p._parseInfo.skillsParsed, 0);
    const maxSkills = fullPlayers.length * SKILLS.length;
    const allComplete = fullPlayers.every(p => p._parseInfo.complete);
    const statusClass = allComplete && dmiOnlyPlayers.length === 0 ? 'success' : 'warning';

    const overlay = document.createElement('div');
    overlay.id = 'bb-scout-overlay';

    overlay.innerHTML = `
      <div class="bb-scout-header">
        <span class="bb-scout-logo">BB Scout</span>
        <button class="bb-scout-close" id="bb-scout-close" title="Close">&times;</button>
      </div>
      <div class="bb-scout-player-name">Roster: ${players.length} players found${dmiOnlyPlayers.length > 0 ? ` (${dmiOnlyPlayers.length} DMI-only)` : ''}</div>
      <div class="bb-scout-status ${statusClass}">
        ${fullPlayers.length > 0 ? `${totalSkills}/${maxSkills} skills parsed` : ''}
        ${dmiOnlyPlayers.length > 0 ? `${fullPlayers.length > 0 ? ' | ' : ''}${dmiOnlyPlayers.length} players tracked by DMI` : ''}
      </div>
      <div class="bb-scout-skills-preview" style="max-height: 200px; overflow-y: auto; display: block;">
        ${players.map((p, i) => {
          const isDmi = p._parseInfo.isDmiOnly;
          const icon = isDmi ? '&#9679;' : (p._parseInfo.complete ? '&#10003;' : '&#9888;');
          const color = isDmi ? '#3b82f6' : (p._parseInfo.complete ? '#2ecc71' : '#f39c12');
          const info = isDmi
            ? `${p.age || '?'} | ${p.position || '?'} | DMI: ${p.dmi || '?'}`
            : `${p.age || '?'} | ${p.position || '?'} | ${p._parseInfo.skillsParsed}/${p._parseInfo.totalSkills}`;
          return `
            <div style="display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px solid #333;">
              <span style="color: ${color}">${icon}</span>
              <span style="flex: 1; margin-left: 6px;">${escapeHtml(p.name)}</span>
              <span style="color: #888; font-size: 11px;">${info}</span>
            </div>
          `;
        }).join('')}
      </div>
      <button class="bb-scout-btn bb-scout-btn-primary" id="bb-scout-save-all">
        Save All ${players.length} Players
      </button>
      <div id="bb-scout-progress" style="display: none; font-size: 12px; text-align: center; color: #aaa; margin-top: 6px;"></div>
      <div class="bb-scout-last-saved" id="bb-scout-last-saved"></div>
      <button class="bb-scout-btn bb-scout-btn-secondary" id="bb-scout-copy-all">
        Copy All to Clipboard
      </button>
    `;

    document.body.appendChild(overlay);

    document.getElementById('bb-scout-close').addEventListener('click', () => minimizeOverlay());
    document.getElementById('bb-scout-save-all').addEventListener('click', () => saveAllToDatabase(players));
    document.getElementById('bb-scout-copy-all').addEventListener('click', () => copyAllToClipboard(players));

    // Remove mini button if it exists (overlay is now open)
    const existingMini = document.getElementById('bb-scout-mini-btn');
    if (existingMini) existingMini.remove();
  }

  function minimizeOverlay() {
    const overlay = document.getElementById('bb-scout-overlay');
    if (overlay) overlay.style.display = 'none';
    showMiniButton();
  }

  function showMiniButton() {
    let btn = document.getElementById('bb-scout-mini-btn');
    if (btn) { btn.style.display = 'flex'; return; }

    btn = document.createElement('div');
    btn.id = 'bb-scout-mini-btn';
    btn.title = 'Show BB Scout overlay';
    btn.textContent = 'BB';
    btn.addEventListener('click', () => {
      const overlay = document.getElementById('bb-scout-overlay');
      if (overlay) {
        overlay.style.display = '';
        btn.style.display = 'none';
      } else {
        // Overlay was never created or got removed — re-parse
        btn.style.display = 'none';
        init();
      }
    });
    document.body.appendChild(btn);
  }

  // Listen for messages from popup (e.g. "Show Overlay" button)
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'showOverlay') {
      const overlay = document.getElementById('bb-scout-overlay');
      if (overlay) {
        overlay.style.display = '';
        const miniBtn = document.getElementById('bb-scout-mini-btn');
        if (miniBtn) miniBtn.style.display = 'none';
      } else {
        // Re-parse and create overlay from scratch
        init();
      }
      sendResponse({ ok: true });
    }
  });

  // ========================================
  // BATCH SAVE
  // ========================================

  async function saveAllToDatabase(players) {
    const saveBtn = document.getElementById('bb-scout-save-all');
    const progressEl = document.getElementById('bb-scout-progress');
    saveBtn.disabled = true;
    progressEl.style.display = 'block';

    // Save all locally first
    for (const p of players) {
      await saveLocally(p);
    }

    let authData = await getAuthToken();
    if (!authData || !authData.access_token) {
      overlay_setStatus('warning', 'Not logged in. All data saved locally. Open extension popup to log in.');
      saveBtn.disabled = false;
      return;
    }

    // Refresh token if expired or about to expire
    if (authData.expires_at && authData.expires_at < Date.now() + 60000) {
      console.log('[BB Scout Roster] Token expired or expiring, refreshing...');
      try {
        const refreshRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ refresh_token: authData.refresh_token })
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          authData = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user_id: data.user.id,
            email: data.user.email,
            expires_at: Date.now() + (data.expires_in * 1000)
          };
          await chrome.storage.local.set({ bb_scout_auth: authData });
          console.log('[BB Scout Roster] Token refreshed successfully');
        } else {
          console.warn('[BB Scout Roster] Token refresh failed:', refreshRes.status);
          overlay_setStatus('error', 'Auth token expired. Please log out and log in again in the extension popup.');
          saveBtn.disabled = false;
          return;
        }
      } catch (refreshErr) {
        console.error('[BB Scout Roster] Token refresh error:', refreshErr);
        overlay_setStatus('error', 'Auth token expired. Please log out and log in again in the extension popup.');
        saveBtn.disabled = false;
        return;
      }
    }

    // Fetch current season once for all snapshots
    const bbSeason = await getCurrentBbSeason();

    let saved = 0;
    let failed = 0;
    let firstError = '';

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      progressEl.textContent = `Saving ${i + 1}/${players.length}: ${p.name}...`;

      try {
        // Upsert player
        const playerRes = await supabaseFetch('/rest/v1/players?on_conflict=bb_player_id', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({
            bb_player_id: p.bbPlayerId,
            name: p.name,
            nationality: p.nationality || 'Unknown',
            height: p.height,
            position: p.position,
            is_nt_player: p.isNtPlayer || false
          })
        }, authData);

        if (!playerRes.ok) {
          const errBody = await playerRes.text();
          throw new Error(`Player upsert ${playerRes.status}: ${errBody}`);
        }
        const playerRecord = (await playerRes.json())[0];

        // Snapshot dedup: check if a snapshot already exists for this player today
        const snapshotPayload = {
          player_id: playerRecord.id,
          captured_by: authData.user_id,
          source: 'extension',
          bb_season: bbSeason,
          age: p.age,
          salary: p.salary,
          experience: p.experience,
          skill_points: p.skillPoints,
          game_shape: p.gameShape,
          potential: p.potential,
          dmi: p.dmi,
          owner_team_name: p.ownerTeamName,
          owner_team_id: p.ownerTeamId,
          ...p.skills
        };

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Query for existing snapshot today
        const existingSnapRes = await supabaseFetch(
          `/rest/v1/skill_snapshots?player_id=eq.${playerRecord.id}&captured_at=gte.${todayStart.toISOString()}&captured_at=lte.${todayEnd.toISOString()}&order=captured_at.desc&limit=1`,
          { method: 'GET' },
          authData
        );

        let snapRes;
        if (existingSnapRes.ok) {
          const existingSnaps = await existingSnapRes.json();
          if (existingSnaps.length > 0) {
            // Update existing snapshot
            const existingId = existingSnaps[0].id;
            console.log(`[BB Scout Roster] Updating existing snapshot ${existingId} for player ${p.bbPlayerId}`);
            snapRes = await supabaseFetch(`/rest/v1/skill_snapshots?id=eq.${existingId}`, {
              method: 'PATCH',
              headers: { 'Prefer': 'return=representation' },
              body: JSON.stringify({ ...snapshotPayload, captured_at: new Date().toISOString() })
            }, authData);
          } else {
            // Insert new snapshot
            snapRes = await supabaseFetch('/rest/v1/skill_snapshots', {
              method: 'POST',
              headers: { 'Prefer': 'return=representation' },
              body: JSON.stringify(snapshotPayload)
            }, authData);
          }
        } else {
          // Query failed, fall back to insert
          console.warn('[BB Scout Roster] Could not check existing snapshots, inserting new');
          snapRes = await supabaseFetch('/rest/v1/skill_snapshots', {
            method: 'POST',
            headers: { 'Prefer': 'return=representation' },
            body: JSON.stringify(snapshotPayload)
          }, authData);
        }

        if (!snapRes.ok) {
          const errBody = await snapRes.text();
          throw new Error(`Snapshot ${snapRes.status}: ${errBody}`);
        }

        saved++;
        await markSynced(p.bbPlayerId);
      } catch (err) {
        console.error(`[BB Scout Roster] Failed to save ${p.name}:`, err.message || err);
        if (failed === 0) {
          // Show the first error in the overlay so user can see what's wrong
          firstError = err.message || String(err);
        }
        failed++;
      }
    }

    let msg = `Saved ${saved}/${players.length} players${failed > 0 ? ` (${failed} failed)` : ''}`;
    if (firstError) {
      msg += `\nError: ${firstError.substring(0, 200)}`;
      console.error('[BB Scout Roster] First error:', firstError);
    }
    overlay_setStatus(failed > 0 ? 'warning' : 'success', msg);
    progressEl.textContent = msg;
    saveBtn.disabled = false;
  }

  function copyAllToClipboard(players) {
    const lines = players.map(p => {
      const skillLine = SKILLS.map(s => {
        const val = p.skills[s.dbKey];
        return val ? `${val}` : '-';
      }).join('\t');

      return `${p.name}\t${p.bbPlayerId}\t${p.nationality || ''}\t${p.age || ''}\t${p.position || ''}\t${p.dmi || ''}\t${p.gameShape || ''}\t${p.potential || ''}\t${p.salary || ''}\t${p.skillPoints || ''}\t${skillLine}`;
    });

    const header = `Name\tID\tNat\tAge\tPos\tDMI\tShape\tPot\tSalary\tSP\t${SKILLS.map(s => s.name).join('\t')}`;
    const csv = [header, ...lines].join('\n');

    navigator.clipboard.writeText(csv).then(() => {
      overlay_setStatus('success', 'All players copied! Paste into a spreadsheet.');
      setTimeout(() => overlay_setStatus('', ''), 3000);
    }).catch(() => {
      overlay_setStatus('error', 'Copy failed');
    });
  }

  // ========================================
  // SHARED HELPERS (same as player-parser.js)
  // ========================================

  async function getAuthToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get('bb_scout_auth', (result) => {
        resolve(result.bb_scout_auth || null);
      });
    });
  }

  async function supabaseFetch(path, options = {}, authData) {
    return fetch(SUPABASE_URL + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${authData.access_token}`,
        ...options.headers
      }
    });
  }

  async function saveLocally(playerData) {
    try {
      const key = `bb_scout_player_${playerData.bbPlayerId}`;
      await chrome.storage.local.set({
        [key]: { ...playerData, savedAt: new Date().toISOString(), synced: false }
      });
    } catch (err) {
      console.error('[BB Scout Roster] Local save error:', err);
    }
  }

  async function markSynced(bbPlayerId) {
    try {
      const key = `bb_scout_player_${bbPlayerId}`;
      const result = await chrome.storage.local.get(key);
      if (result[key]) {
        result[key].synced = true;
        await chrome.storage.local.set({ [key]: result[key] });
      }
    } catch (err) {
      console.error('[BB Scout Roster] Mark synced error:', err);
    }
  }

  function overlay_setStatus(type, message) {
    const overlay = document.getElementById('bb-scout-overlay');
    if (!overlay) return;
    let statusEl = overlay.querySelector('.bb-scout-status');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.className = 'bb-scout-status';
      const saveBtn = document.getElementById('bb-scout-save-all');
      if (saveBtn) saveBtn.before(statusEl);
    }
    statusEl.className = `bb-scout-status ${type}`;
    statusEl.textContent = message;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();
