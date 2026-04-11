// BB Scout - Transfer Market Search Results Parser
// Runs on buzzerbeater.com/manage/transferlist.aspx
// Batch-parses all players visible on the market search results page
//
// Market page structure (from live screenshots):
// - Page header: "Player Market Search"
// - "Showing results 1-10 of 24."
// - Each player in a card containing:
//   - Header: [Flag(s)] "Gilmar Alvarez (54850972)    Small Forward"
//   - Auction info: Starting Price, Current Bid, Auction ends, Owner
//   - Skills in 2-column layout: "Jump Shot: prolific (11)    Jump Range: mediocre (5)"
//   - Metadata: salary, age, height, potential, game shape, experience, skill points
//   - Buzzer-Manager evaluation: PG/SG/SF/PF/C scores
//
// Nationality: Some players show 2 flags (first = Utopia for 2nd teams, has no NT).
// The REAL nationality is always the LAST flag.

(function() {
  'use strict';

  console.log('[BB Scout Market] Script loaded on:', window.location.href);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    console.log('[BB Scout Market] init() called, readyState:', document.readyState);

    // Check if this is actually a market search results page
    const pageText = document.body.innerText || '';
    const hasMarketText = pageText.includes('Player Market Search') || pageText.includes('Transfer List');
    const hasResults = pageText.includes('Showing results') || pageText.includes('Starting Price');
    console.log('[BB Scout Market] Page check — "Player Market Search":', hasMarketText, ', results:', hasResults);

    if (!hasMarketText) {
      console.log('[BB Scout Market] Not a market page, exiting.');
      return;
    }

    if (!hasResults) {
      console.log('[BB Scout Market] Market page but no results yet (search form only), exiting.');
      return;
    }

    console.log('[BB Scout Market] Market results detected, parsing in 800ms...');

    setTimeout(() => {
      const players = parseMarketPage();
      console.log('[BB Scout Market] parseMarketPage() returned', players ? players.length : 0, 'players');
      if (players && players.length > 0) {
        createMarketOverlay(players);
      } else {
        console.warn('[BB Scout Market] No players parsed — overlay will not appear.');
      }
    }, 800);
  }

  // ========================================
  // NATIONALITY PARSING FROM FLAGS
  // ========================================

  function parseNationalityForPlayer(bbPlayerId) {
    // BB DOM structure for each player card:
    //   <div class="boxheader">
    //     <div style="float:left">
    //       <img id="..._nationalFlag_N" title="Paraguay" src="../images/flags/flag_55.gif">
    //       <img id="..._utopiaFlag_N"   title="Utopia"   src="../images/flags/flag_99.gif">
    //     </div>
    //     ...
    //     <a id="cphContent_rptListedPlayers_hlPlayerDetails_N"> PlayerName </a>
    //   </div>
    //
    // The player link and flags are siblings inside div.boxheader.
    // The nationality is in the title attribute of the nationalFlag img.

    // Step 1: Find the player name link (links to /player/ID/)
    let playerLink = null;
    const allLinks = document.querySelectorAll('a');
    for (const link of allLinks) {
      const href = link.href || '';
      if (href.includes('/player/' + bbPlayerId + '/') || href.includes('playerid=' + bbPlayerId)) {
        playerLink = link;
        break;
      }
    }

    if (!playerLink) return null;

    // Step 2: Go up to the boxheader container, then find the nationalFlag img inside it
    const boxheader = playerLink.closest('.boxheader');
    if (boxheader) {
      // Look for img with id containing "nationalFlag" — this is the real nationality
      const nationalFlag = boxheader.querySelector('img[id*="nationalFlag"]');
      if (nationalFlag) {
        const nationality = (nationalFlag.title || nationalFlag.alt || '').trim();
        if (nationality) {
          console.log(`[BB Scout Market] Player ${bbPlayerId} → nationality: ${nationality}`);
          return nationality;
        }
      }
    }

    // Fallback: look in the parent or grandparent for nationalFlag
    let container = playerLink.parentElement;
    for (let i = 0; i < 4; i++) {
      if (!container) break;
      const nationalFlag = container.querySelector('img[id*="nationalFlag"]');
      if (nationalFlag) {
        const nationality = (nationalFlag.title || nationalFlag.alt || '').trim();
        if (nationality) {
          console.log(`[BB Scout Market] Player ${bbPlayerId} → nationality (fallback): ${nationality}`);
          return nationality;
        }
      }
      container = container.parentElement;
    }

    console.log(`[BB Scout Market] Player ${bbPlayerId}: no nationalFlag found`);
    return null;
  }

  // ========================================
  // MARKET PAGE PARSING
  // ========================================

  function parseMarketPage() {
    const players = [];
    const bodyText = document.body.innerText || '';

    console.log('[BB Scout Market] Body text length:', bodyText.length);

    // Strategy: Find all "(PLAYER_ID)" patterns (6+ digit IDs)
    // Validate each by checking if skill keywords appear in the next ~800 chars
    const idRegex = /\((\d{6,})\)/g;
    const SKILL_KEYWORDS = ['Jump Shot', 'Jump Range', 'Handling', 'Driving', 'Passing',
      'Inside Shot', 'Rebounding', 'Shot Blocking', 'Stamina', 'Free Throw', 'DMI:'];

    let match;
    const playerHeaders = [];
    while ((match = idRegex.exec(bodyText)) !== null) {
      const bbPlayerId = parseInt(match[1]);
      const idIndex = match.index;
      const afterId = bodyText.substring(match.index + match[0].length, match.index + match[0].length + 800);

      // Validate: this ID belongs to a player if skill keywords appear nearby
      const keywordHits = SKILL_KEYWORDS.filter(kw => afterId.includes(kw));
      if (keywordHits.length < 3) {
        console.log(`[BB Scout Market] Skipping ID ${bbPlayerId} — only ${keywordHits.length} skill keywords found nearby`);
        continue;
      }

      // Best-effort position parse
      const posMatchLoose = afterId.match(/(Point Guard|Shooting Guard|Small Forward|Power Forward|Center)/);
      let position = posMatchLoose ? abbreviatePosition(posMatchLoose[1]) : null;

      // Extract the name: look backwards from "(" to find the name
      const prefixStart = Math.max(0, idIndex - 80);
      const prefix = bodyText.substring(prefixStart, idIndex).trim();

      let name = null;

      // Try to find "Firstname Lastname" pattern at the end of the prefix (unicode-aware)
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

      // Reject junk names
      if (!name || name.toLowerCase() === 'buzzerbeater' || name.length < 3) {
        name = `Player ${bbPlayerId}`;
      }

      // Parse nationality from flag images, normalize to English
      const nationality = normalizeNationality(parseNationalityForPlayer(bbPlayerId));

      console.log(`[BB Scout Market] Found: ${name} (${bbPlayerId}) ${position || 'no pos'} [${nationality || '?'}] [${keywordHits.length} keywords]`);

      playerHeaders.push({
        name,
        bbPlayerId,
        position,
        nationality,
        index: idIndex
      });
    }

    if (playerHeaders.length === 0) {
      console.warn('[BB Scout Market] No player headers found.');
      const anyIds = [...bodyText.matchAll(/\((\d{7,8})\)/g)];
      console.log('[BB Scout Market] Found', anyIds.length, 'potential IDs:', anyIds.slice(0, 5).map(m => m[1]));
      return [];
    }

    console.log(`[BB Scout Market] Found ${playerHeaders.length} player headers`);

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

    console.log(`[BB Scout Market] Successfully parsed ${players.length} players`);
    return players;
  }

  function parsePlayerBlock(text, header) {
    const data = {
      bbPlayerId: header.bbPlayerId,
      name: header.name,
      position: header.position,
      nationality: header.nationality,
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

    // Owner team — on market pages: "Owner: TeamName"
    const ownerMatch = text.match(/Owner:\s*([^\n]+)/);
    if (ownerMatch) {
      data.ownerTeamName = ownerMatch[1].trim();
    }

    // Potential: "Potential: perennial allstar [100%]"
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

    // Game Shape: "Game Shape: strong (8)"
    const gsMatch = text.match(/Game Shape:\s*(\w+)\s*\((\d+)\)/);
    if (gsMatch) data.gameShape = parseInt(gsMatch[2]);

    // Experience: "Experience: pitiful (2)"
    const expMatch = text.match(/Experience:\s*(\w+)\s*\((\d+)\)/);
    if (expMatch) data.experience = parseInt(expMatch[2]);

    // TSP / Skill Points: "Skill points: 83 (51|32)"
    const tspMatch = text.match(/(?:Skill\s*points|TSP):\s*(\d+)/i);
    if (tspMatch) data.skillPoints = parseInt(tspMatch[1]);

    // Parse all 12 skills — format: "Jump Shot: prolific (11)"
    for (const skill of SKILLS) {
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
        console.log(`[BB Scout Market] TSP calculated from skills: ${sum}`);
      }
    }

    data._parseInfo = {
      skillsParsed: skillCount,
      totalSkills: SKILLS.length,
      complete: skillCount === SKILLS.length
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
  // MARKET OVERLAY UI
  // ========================================

  function createMarketOverlay(players) {
    const existing = document.getElementById('bb-scout-overlay');
    if (existing) existing.remove();

    const totalSkills = players.reduce((sum, p) => sum + p._parseInfo.skillsParsed, 0);
    const maxSkills = players.length * SKILLS.length;
    const allComplete = players.every(p => p._parseInfo.complete);
    const statusClass = allComplete ? 'success' : 'warning';

    const overlay = document.createElement('div');
    overlay.id = 'bb-scout-overlay';

    overlay.innerHTML = `
      <div class="bb-scout-header">
        <span class="bb-scout-logo">BB Scout</span>
        <button class="bb-scout-close" id="bb-scout-close" title="Close">&times;</button>
      </div>
      <div class="bb-scout-player-name">Market: ${players.length} players found</div>
      <div class="bb-scout-status ${statusClass}">
        ${allComplete ? '&#10003;' : '&#9888;'} ${totalSkills}/${maxSkills} total skills parsed
      </div>
      <div class="bb-scout-skills-preview" style="max-height: 200px; overflow-y: auto; display: block;">
        ${players.map((p) => {
          const icon = p._parseInfo.complete ? '&#10003;' : '&#9888;';
          const color = p._parseInfo.complete ? '#2ecc71' : '#f39c12';
          const nat = p.nationality ? ` [${p.nationality}]` : '';
          return `
            <div style="display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px solid #333;">
              <span style="color: ${color}">${icon}</span>
              <span style="flex: 1; margin-left: 6px;">${escapeHtml(p.name)}${escapeHtml(nat)}</span>
              <span style="color: #888; font-size: 11px;">${p.age || '?'} | ${p.position || '?'} | ${p._parseInfo.skillsParsed}/${p._parseInfo.totalSkills}</span>
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
      console.log('[BB Scout Market] Token expired or expiring, refreshing...');
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
          console.log('[BB Scout Market] Token refreshed successfully');
        } else {
          console.warn('[BB Scout Market] Token refresh failed:', refreshRes.status);
          overlay_setStatus('error', 'Auth token expired. Please log out and log in again in the extension popup.');
          saveBtn.disabled = false;
          return;
        }
      } catch (refreshErr) {
        console.error('[BB Scout Market] Token refresh error:', refreshErr);
        overlay_setStatus('error', 'Auth token expired. Please log out and log in again in the extension popup.');
        saveBtn.disabled = false;
        return;
      }
    }

    let saved = 0;
    let failed = 0;
    let firstError = '';

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      progressEl.textContent = `Saving ${i + 1}/${players.length}: ${p.name}...`;

      try {
        // Upsert player — use parsed nationality instead of hardcoded "Slovenia"
        const playerRes = await supabaseFetch('/rest/v1/players?on_conflict=bb_player_id', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({
            bb_player_id: p.bbPlayerId,
            name: p.name,
            nationality: p.nationality || 'Unknown',
            height: p.height,
            position: p.position
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
            console.log(`[BB Scout Market] Updating existing snapshot ${existingId} for player ${p.bbPlayerId}`);
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
          console.warn('[BB Scout Market] Could not check existing snapshots, inserting new');
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
        console.error(`[BB Scout Market] Failed to save ${p.name}:`, err.message || err);
        if (failed === 0) {
          firstError = err.message || String(err);
        }
        failed++;
      }
    }

    let msg = `Saved ${saved}/${players.length} players${failed > 0 ? ` (${failed} failed)` : ''}`;
    if (firstError) {
      msg += `\nError: ${firstError.substring(0, 200)}`;
      console.error('[BB Scout Market] First error:', firstError);
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

      return `${p.name}\t${p.bbPlayerId}\t${p.nationality || ''}\t${p.age || ''}\t${p.position || ''}\t${p.dmi || ''}\t${p.potential || ''}\t${p.salary || ''}\t${p.skillPoints || ''}\t${skillLine}`;
    });

    const header = `Name\tID\tNat\tAge\tPos\tDMI\tPot\tSalary\tSP\t${SKILLS.map(s => s.name).join('\t')}`;
    const csv = [header, ...lines].join('\n');

    navigator.clipboard.writeText(csv).then(() => {
      overlay_setStatus('success', 'All players copied! Paste into a spreadsheet.');
      setTimeout(() => overlay_setStatus('', ''), 3000);
    }).catch(() => {
      overlay_setStatus('error', 'Copy failed');
    });
  }

  // ========================================
  // SHARED HELPERS
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
      console.error('[BB Scout Market] Local save error:', err);
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
      console.error('[BB Scout Market] Mark synced error:', err);
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
