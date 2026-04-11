// BB Scout - Player Profile Parser
// Runs on buzzerbeater.com/player/* pages
// Parses player skills and metadata from the page DOM
//
// BuzzerBeater uses ASP.NET WebForms. Skills are rendered as colored <a> links
// with text like "strong" and a number in parentheses like "(8)" nearby.
// The page layout uses HTML tables for structure.
//
// Observed format from live page:
//   "Jump Shot: strong (8)"  where "strong" is a colored link
//   "Weekly salary: $ 32 540 ($ 42 500)"
//   "Tibor Likar (54516150)    Center"

(function() {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    setTimeout(() => {
      try {
        const playerData = parsePlayerPage();
        if (playerData) {
          createOverlay(playerData);
        } else {
          console.warn('[BB Scout] Could not parse player data from this page');
        }
      } catch (err) {
        console.error('[BB Scout] Init error:', err);
      }
    }, 1200); // Wait a bit longer for ASP.NET pages to fully render
  }

  // ========================================
  // MAIN PARSE FUNCTION
  // ========================================

  function parsePlayerPage() {
    // Gather ALL text from the page body
    const fullText = document.body.innerText || document.body.textContent || '';
    const fullHtml = document.body.innerHTML || '';

    console.log('[BB Scout] Page text length:', fullText.length);
    console.log('[BB Scout] First 500 chars:', fullText.substring(0, 500));

    const data = {
      bbPlayerId: parsePlayerId(fullText),
      name: null,
      nationality: null,
      age: null,
      height: null,
      position: null,
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

    // Nationality: BB player pages show "Nationality: CountryName" or a flag link
    const natMatch = fullText.match(/\bNationality:\s*([A-ZÀ-Ža-zà-ž][A-Za-zÀ-Ža-zà-ž\s-]{1,30})/);
    if (natMatch) {
      data.nationality = normalizeNationality(natMatch[1]);
    }

    // Parse name from the header "Tibor Likar (54516150)"
    data.name = parsePlayerName(fullText, data.bbPlayerId);

    // Parse position
    data.position = parsePosition(fullText);

    // Parse metadata using the full page text
    // Age: "Age: 21"
    const ageMatch = fullText.match(/\bAge:\s*(\d{1,2})\b/);
    if (ageMatch) data.age = parseInt(ageMatch[1]);

    // Height: "Height: 7'0" / 213 cm"
    const heightMatch = fullText.match(/\bHeight:\s*(\d+['']\d+[""]?\s*\/\s*\d+\s*cm)/);
    if (heightMatch) {
      data.height = heightMatch[1].trim();
    } else {
      // Fallback: just grab whatever follows Height:
      const hFallback = fullText.match(/\bHeight:\s*([^\n\r]{3,30})/);
      if (hFallback) data.height = hFallback[1].trim();
    }

    // Weekly salary: "Weekly salary: $ 32 540" with optional "($ 42 500)"
    const salaryMatch = fullText.match(/Weekly\s+salary:\s*\$\s*([\d\s]+)/i);
    if (salaryMatch) data.salary = parseInt(salaryMatch[1].replace(/\s/g, ''));

    // DMI: "DMI: 161800" or "DMI: 161,800"
    const dmiMatch = fullText.match(/\bDMI:\s*([\d\s,.]+)/);
    if (dmiMatch) data.dmi = parseInt(dmiMatch[1].replace(/[\s,.]/g, ''));

    // Potential: "Potential: perennial allstar [91%-100%]"
    // The potential text is a colored link, so in innerText it appears inline
    data.potential = parsePotential(fullText);

    // Game Shape: "Game Shape: average (6)"
    const gsMatch = fullText.match(/Game\s*Shape:\s*([a-zA-Z]+)\s*\((\d+)\)/i);
    if (gsMatch) {
      data.gameShape = parseInt(gsMatch[2]);
    } else {
      const gsFallback = fullText.match(/Game\s*Shape:\s*([a-zA-Z]+)/i);
      if (gsFallback) data.gameShape = parseSkillText(gsFallback[1]);
    }

    // Experience: "Experience: awful (3)"
    const expMatch = fullText.match(/\bExperience:\s*([a-zA-Z]+)\s*\((\d+)\)/);
    if (expMatch) {
      data.experience = parseInt(expMatch[2]);
    } else {
      const expFallback = fullText.match(/\bExperience:\s*([a-zA-Z]+)/);
      if (expFallback) data.experience = parseSkillText(expFallback[1]);
    }

    // Skill points: "Skill points: 94 (47|47)" or "Skill points: 94 (47+47)"
    const spMatch = fullText.match(/Skill\s*points:\s*(\d+)/i);
    if (spMatch) data.skillPoints = parseInt(spMatch[1]);

    // Owner team
    data.ownerTeamName = parseOwnerTeam(fullText);
    data.ownerTeamId = parseOwnerTeamId();

    // ========================================
    // PARSE SKILLS - Multiple strategies
    // ========================================
    data.skills = parseAllSkills(fullText, fullHtml);

    // Validate
    if (!data.bbPlayerId && !data.name) {
      console.warn('[BB Scout] Could not parse player ID or name');
      return null;
    }

    const skillCount = Object.values(data.skills).filter(v => v !== null).length;

    // If TSP wasn't found via regex, calculate from individual skills
    if (!data.skillPoints && skillCount > 0) {
      const sum = Object.values(data.skills).filter(v => v !== null).reduce((a, b) => a + b, 0);
      if (sum > 0) {
        data.skillPoints = sum;
        console.log('[BB Scout] TSP calculated from skills:', sum);
      }
    }

    data._parseInfo = {
      skillsParsed: skillCount,
      totalSkills: SKILLS.length,
      complete: skillCount === SKILLS.length
    };

    console.log('[BB Scout] Parsed player data:', JSON.stringify(data, null, 2));
    return data;
  }

  // ========================================
  // PLAYER ID
  // ========================================

  function parsePlayerId(fullText) {
    // Strategy 1: From URL /player/54516150/overview.aspx
    const urlMatch = window.location.pathname.match(/\/player\/(\d+)/);
    if (urlMatch) return parseInt(urlMatch[1]);

    // Strategy 2: From page header text "Name (54516150)"
    const idMatch = fullText.match(/\((\d{5,9})\)/);
    if (idMatch) return parseInt(idMatch[1]);

    return null;
  }

  // ========================================
  // PLAYER NAME
  // ========================================

  function parsePlayerName(fullText, playerId) {
    // Strategy 1 (highest priority): Find "Name (PlayerID)" in page text using the known ID
    if (playerId) {
      // Look for any text before the player ID in parentheses
      // Handles: "Ciril Lang (54827504)" — captures 2-4 word names before the ID
      const idStr = String(playerId);

      // Try specific name pattern: exactly 2-4 capitalized words before (ID)
      // Use [ ] (literal space) instead of \s to avoid matching across lines/tabs
      const specificRegex = new RegExp('([A-ZÀ-Ž][a-zà-ž]+(?:[ ][A-ZÀ-Ža-zà-ž][a-zà-ž]+){1,3})[ ]*\\(' + idStr + '\\)');
      const specificMatch = fullText.match(specificRegex);
      if (specificMatch) {
        const name = specificMatch[1].trim();
        // Make sure it's not "BuzzerBeater" or other site text
        if (name.toLowerCase() !== 'buzzerbeater' && name.length > 2 && name.length < 40) {
          console.log('[BB Scout] Name found via ID pattern:', name);
          return name;
        }
      }

      // Broader: capture text before "(ID)" on the same line, but limit to 40 chars
      // and prefer the shortest reasonable match by looking for the last newline/tab
      const broadRegex = new RegExp('([^\\n\\t(]{2,40})\\s*\\(' + idStr + '\\)');
      const broadMatch = fullText.match(broadRegex);
      if (broadMatch) {
        let name = broadMatch[1].trim();
        // Clean up any leading junk (flags, icons rendered as text, etc.)
        name = name.replace(/^[^A-ZÀ-Ža-zà-ž]+/, '').trim();
        // If still too long (contains nav text like "Player Overview Player History Ciril Lang"),
        // try to extract just the last 2-3 words which are likely the actual name
        if (name.split(/\s+/).length > 4) {
          const words = name.split(/\s+/);
          name = words.slice(-2).join(' '); // Take last 2 words as the name
          console.log('[BB Scout] Name trimmed to last 2 words:', name);
        }
        if (name && name.toLowerCase() !== 'buzzerbeater' && name.length > 2) {
          console.log('[BB Scout] Name found via broad ID pattern:', name);
          return name;
        }
      }
    }

    // Strategy 2: Find name in h1/h2/h3 elements that contain the player ID
    const headers = document.querySelectorAll('h1, h2, h3, .entryHeader, [class*="player"]');
    for (const h of headers) {
      const t = h.textContent.trim();
      if (playerId && t.includes(String(playerId))) {
        let name = t.replace(/\s*\(\d+\)\s*/g, '').replace(/\s*(Center|Point Guard|Shooting Guard|Small Forward|Power Forward)\s*/gi, '').trim();
        if (name && name.toLowerCase() !== 'buzzerbeater' && name.length > 2) {
          console.log('[BB Scout] Name found via header element:', name);
          return name;
        }
      }
    }

    // Strategy 3: Look for all "Firstname Lastname (5+ digit number)" patterns
    // and pick the one that matches our player ID, or the first reasonable one
    const allNameMatches = [...fullText.matchAll(/([A-ZÀ-Ž][a-zà-ž]+\s+[A-ZÀ-Ž][a-zà-ž]+)\s*\((\d{5,})\)/g)];
    for (const m of allNameMatches) {
      const name = m[1].trim();
      const id = m[2];
      if (name.toLowerCase() === 'buzzerbeater') continue;
      if (playerId && id === String(playerId)) {
        console.log('[BB Scout] Name found via global name+ID scan:', name);
        return name;
      }
    }
    // If no exact ID match, take the first non-BuzzerBeater match
    for (const m of allNameMatches) {
      const name = m[1].trim();
      if (name.toLowerCase() !== 'buzzerbeater' && name.length > 2) {
        console.log('[BB Scout] Name found via first valid name+ID:', name);
        return name;
      }
    }

    // Strategy 4: Page title (last resort — skip if it starts with "BuzzerBeater")
    const title = document.title;
    if (title) {
      // BB page titles might be "Player Name - BuzzerBeater" or "BuzzerBeater > Player Name"
      const titlePatterns = [
        /^(.+?)\s*[-–|]\s*BuzzerBeater/i,
        /BuzzerBeater\s*[-–|>]\s*(.+)/i,
        /^(.+?)\s*[-–|]/
      ];
      for (const pattern of titlePatterns) {
        const m = title.match(pattern);
        if (m) {
          const name = m[1].trim();
          if (name.toLowerCase() !== 'buzzerbeater' && name.length > 2 && name.length < 60) {
            console.log('[BB Scout] Name found via page title:', name);
            return name;
          }
        }
      }
    }

    return null;
  }

  // ========================================
  // POSITION
  // ========================================

  function parsePosition(fullText) {
    const posMap = {
      'Point Guard': 'PG',
      'Shooting Guard': 'SG',
      'Small Forward': 'SF',
      'Power Forward': 'PF',
      'Center': 'C'
    };

    // Look near the player header area - position appears right after the ID
    // Pattern: "(54516150)    Center" or in the header row
    for (const [fullName, abbrev] of Object.entries(posMap)) {
      // Match position appearing after an ID in parens, or standalone in a header-like context
      const regex = new RegExp('\\)\\s*' + fullName + '\\b', 'i');
      if (regex.test(fullText)) return abbrev;
    }

    // Fallback: look for the position as a standalone word in the first part of the page
    const firstChunk = fullText.substring(0, 1500);
    for (const [fullName, abbrev] of Object.entries(posMap)) {
      if (firstChunk.includes(fullName)) return abbrev;
    }

    return null;
  }

  // ========================================
  // POTENTIAL
  // ========================================

  function parsePotential(fullText) {
    // Potential line looks like: "Potential: perennial allstar [91%-100%]"
    // Match potential text that comes after "Potential:"
    const potMatch = fullText.match(/\bPotential:\s*(.+)/i);
    if (!potMatch) return null;

    const potLine = potMatch[1].toLowerCase().trim();

    // Try matching against all known potential levels (longest first)
    const levels = Object.entries(POTENTIAL_LEVELS_REVERSE)
      .sort((a, b) => b[0].length - a[0].length);

    for (const [levelText, num] of levels) {
      if (potLine.startsWith(levelText) || potLine.includes(levelText)) {
        return num;
      }
    }
    return null;
  }

  // ========================================
  // OWNER TEAM
  // ========================================

  function parseOwnerTeam(fullText) {
    const ownerMatch = fullText.match(/\bOwner:?\s*\n?\s*(.+)/i);
    if (ownerMatch) {
      let team = ownerMatch[1].trim();
      // Clean up - take first line only, remove trailing metadata
      team = team.split('\n')[0].trim();
      if (team && team.length < 50) return team;
    }
    return null;
  }

  function parseOwnerTeamId() {
    // Find links that look like team links
    const links = document.querySelectorAll('a[href*="team/"]');
    for (const link of links) {
      const text = link.textContent.trim();
      // Skip navigation links, look for team name links near "Owner"
      if (text && text.length > 2 && text.length < 50) {
        const match = link.href.match(/team\/(\d+)/);
        if (match) {
          // Check if this link is near "Owner" text
          const parent = link.closest('td') || link.closest('div') || link.parentElement;
          if (parent && (parent.textContent || '').includes('Owner')) {
            return parseInt(match[1]);
          }
        }
      }
    }
    return null;
  }

  // ========================================
  // SKILL PARSING - The core challenge
  // ========================================

  function parseAllSkills(fullText, fullHtml) {
    const skills = {};

    // Initialize all skills as null
    for (const skill of SKILLS) {
      skills[skill.dbKey] = null;
    }

    // Strategy 1: Regex on innerText for "SkillName: word (number)" pattern
    console.log('[BB Scout] Trying Strategy 1: Regex on innerText');
    for (const skill of SKILLS) {
      const val = parseSkillFromText(fullText, skill.name);
      if (val !== null) {
        skills[skill.dbKey] = val;
        console.log(`[BB Scout] Strategy 1 found: ${skill.name} = ${val}`);
      }
    }

    // Check if Strategy 1 found everything
    const found1 = Object.values(skills).filter(v => v !== null).length;
    if (found1 === SKILLS.length) {
      console.log('[BB Scout] Strategy 1 found all skills');
      return skills;
    }
    console.log(`[BB Scout] Strategy 1 found ${found1}/${SKILLS.length} skills`);

    // Strategy 2: Look for BB-specific ASP.NET element IDs
    // BB uses IDs like "ctl00_cphContent_pnlSkills_lblJumpShot" or similar
    console.log('[BB Scout] Trying Strategy 2: ASP.NET element IDs');
    for (const skill of SKILLS) {
      if (skills[skill.dbKey] !== null) continue; // Already found
      const val = parseSkillFromElements(skill);
      if (val !== null) {
        skills[skill.dbKey] = val;
        console.log(`[BB Scout] Strategy 2 found: ${skill.name} = ${val}`);
      }
    }

    const found2 = Object.values(skills).filter(v => v !== null).length;
    if (found2 === SKILLS.length) {
      console.log('[BB Scout] Strategy 2 completed all skills');
      return skills;
    }
    console.log(`[BB Scout] Strategy 2 total: ${found2}/${SKILLS.length}`);

    // Strategy 3: Find colored links (skill values are colored) with known skill text
    console.log('[BB Scout] Trying Strategy 3: Colored links scan');
    const coloredLinks = findSkillLinks();
    for (const { skillText, value, nearbyText } of coloredLinks) {
      // Try to match this colored link to a skill
      for (const skill of SKILLS) {
        if (skills[skill.dbKey] !== null) continue;
        const cleanSkillName = skill.name.replace('.', '').toLowerCase();
        if (nearbyText.toLowerCase().includes(cleanSkillName)) {
          skills[skill.dbKey] = value;
          console.log(`[BB Scout] Strategy 3 found: ${skill.name} = ${value} (from colored link "${skillText}")`);
          break;
        }
      }
    }

    const found3 = Object.values(skills).filter(v => v !== null).length;
    console.log(`[BB Scout] Strategy 3 total: ${found3}/${SKILLS.length}`);

    // Strategy 4: Brute force scan of all text for "SkillName" followed by skill level word
    // This handles cases where the colon or spacing is different
    if (found3 < SKILLS.length) {
      console.log('[BB Scout] Trying Strategy 4: Brute force text scan');
      for (const skill of SKILLS) {
        if (skills[skill.dbKey] !== null) continue;
        const val = bruteForceSkillScan(fullText, skill.name);
        if (val !== null) {
          skills[skill.dbKey] = val;
          console.log(`[BB Scout] Strategy 4 found: ${skill.name} = ${val}`);
        }
      }
    }

    return skills;
  }

  // Strategy 1: Regex on text
  function parseSkillFromText(text, skillName) {
    // Remove periods from skill name for matching ("Outside Def." → "Outside Def")
    const cleanName = skillName.replace(/\./g, '');

    // Also try with the period
    const names = [cleanName, skillName];

    for (const name of names) {
      // Escape special regex chars
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Pattern 1: "Jump Shot: strong (8)" — label, colon, word, parens with number
      const p1 = new RegExp(escaped + '\\s*:\\s*([a-zA-Z\\s]+?)\\s*\\((\\d{1,2})\\)', 'i');
      const m1 = text.match(p1);
      if (m1) {
        const num = parseInt(m1[2]);
        if (num >= 1 && num <= 20) return num;
      }

      // Pattern 2: "Jump Shot: strong" — label, colon, just the word (no number in parens)
      const p2 = new RegExp(escaped + '\\s*:\\s*([a-zA-Z]+)', 'i');
      const m2 = text.match(p2);
      if (m2) {
        const val = parseSkillText(m2[1]);
        if (val) return val;
      }

      // Pattern 3: "Jump Shot\nstrong (8)" — label on one line, value on next (newline separated)
      const p3 = new RegExp(escaped + '\\s*\\n\\s*([a-zA-Z]+)\\s*\\((\\d{1,2})\\)', 'i');
      const m3 = text.match(p3);
      if (m3) {
        const num = parseInt(m3[2]);
        if (num >= 1 && num <= 20) return num;
      }

      // Pattern 4: "Jump Shot\tstrong (8)" — tab separated
      const p4 = new RegExp(escaped + '\\s*\\t\\s*([a-zA-Z]+)\\s*\\((\\d{1,2})\\)', 'i');
      const m4 = text.match(p4);
      if (m4) {
        const num = parseInt(m4[2]);
        if (num >= 1 && num <= 20) return num;
      }
    }

    return null;
  }

  // Strategy 2: ASP.NET element IDs
  function parseSkillFromElements(skill) {
    // BB uses ASP.NET IDs with patterns like:
    // - ctl00_cphContent_*_lblJumpShot
    // - ctl00_cphContent_*_JumpShot_linkDen
    // - various other patterns
    const idPatterns = [
      skill.parseKey,
      skill.parseKey.toLowerCase(),
      skill.dbKey,
      skill.name.replace(/\s+/g, '').replace('.', '')
    ];

    for (const pattern of idPatterns) {
      // Search for elements with IDs containing the skill identifier
      const selectors = [
        `[id*="${pattern}" i]`,
        `[id*="${pattern}"]`
      ];

      for (const sel of selectors) {
        try {
          const els = document.querySelectorAll(sel);
          for (const el of els) {
            // Check if this is a skill value element (link or span with skill text)
            const elText = el.textContent.trim().toLowerCase();

            // Check for "strong (8)" format in the element
            const numMatch = elText.match(/([a-z]+)\s*\((\d{1,2})\)/);
            if (numMatch) {
              const num = parseInt(numMatch[2]);
              if (num >= 1 && num <= 20) return num;
            }

            // Check for just the skill word
            const val = parseSkillText(elText);
            if (val) return val;

            // Check the element's parent for the number in parens
            const parent = el.parentElement;
            if (parent) {
              const parentText = parent.textContent.trim();
              const parentMatch = parentText.match(/\((\d{1,2})\)/);
              if (parentMatch) {
                const num = parseInt(parentMatch[1]);
                if (num >= 1 && num <= 20) return num;
              }
            }
          }
        } catch (e) {
          // Invalid selector, skip
        }
      }
    }
    return null;
  }

  // Strategy 3: Find colored links that contain skill level text
  function findSkillLinks() {
    const results = [];
    // Skill values on BB are colored links (green for good, red for bad, etc.)
    const allLinks = document.querySelectorAll('a');

    for (const link of allLinks) {
      const linkText = link.textContent.trim().toLowerCase();
      // Check if this link text is a known skill level
      if (SKILL_LEVELS_REVERSE[linkText] !== undefined) {
        const value = SKILL_LEVELS_REVERSE[linkText];
        // Get surrounding text for context (to know which skill this is)
        const parent = link.closest('td') || link.closest('tr') || link.closest('div') || link.parentElement;
        const nearbyText = parent ? (parent.textContent || '') : '';

        // Also check for (number) right after the link
        const nextSibling = link.nextSibling;
        if (nextSibling && nextSibling.textContent) {
          const numMatch = nextSibling.textContent.match(/\((\d{1,2})\)/);
          if (numMatch) {
            const num = parseInt(numMatch[1]);
            if (num >= 1 && num <= 20) {
              results.push({ skillText: linkText, value: num, nearbyText });
              continue;
            }
          }
        }

        results.push({ skillText: linkText, value, nearbyText });
      }
    }

    console.log(`[BB Scout] Found ${results.length} colored skill links`);

    return results;
  }

  // Strategy 4: Brute force - scan for skill name anywhere near a skill level word
  function bruteForceSkillScan(fullText, skillName) {
    const cleanName = skillName.replace(/\./g, '').toLowerCase();

    // Find all occurrences of the skill name in the text
    const lowerText = fullText.toLowerCase();
    let pos = lowerText.indexOf(cleanName);

    while (pos !== -1) {
      // Look in a window of 100 chars after the skill name
      const window = fullText.substring(pos, pos + cleanName.length + 100);

      // Look for a number in parentheses
      const numMatch = window.match(/\((\d{1,2})\)/);
      if (numMatch) {
        const num = parseInt(numMatch[1]);
        if (num >= 1 && num <= 20) return num;
      }

      // Look for a skill level word
      for (const [word, num] of Object.entries(SKILL_LEVELS_REVERSE)) {
        if (window.toLowerCase().includes(word)) {
          return num;
        }
      }

      // Search for next occurrence
      pos = lowerText.indexOf(cleanName, pos + 1);
    }

    return null;
  }

  // ========================================
  // OVERLAY UI
  // ========================================

  function createOverlay(playerData) {
    const existing = document.getElementById('bb-scout-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'bb-scout-overlay';

    const parseInfo = playerData._parseInfo;
    const statusClass = parseInfo.complete ? 'success' : (parseInfo.skillsParsed > 6 ? 'warning' : 'error');
    const statusText = parseInfo.complete
      ? `All ${parseInfo.totalSkills} skills parsed`
      : `${parseInfo.skillsParsed}/${parseInfo.totalSkills} skills parsed`;

    overlay.innerHTML = `
      <div class="bb-scout-header">
        <span class="bb-scout-logo">BB Scout</span>
        <button class="bb-scout-close" id="bb-scout-close" title="Close">&times;</button>
      </div>
      <div class="bb-scout-player-name">${escapeHtml(playerData.name || 'Unknown')}</div>
      <div class="bb-scout-player-info">
        ID: ${playerData.bbPlayerId || '?'} | Age: ${playerData.age || '?'} | ${playerData.position || '?'} | DMI: ${playerData.dmi || '?'}
      </div>
      <div class="bb-scout-status ${statusClass}">
        ${statusClass === 'success' ? '&#10003;' : '&#9888;'} ${statusText}
      </div>
      <div class="bb-scout-skills-preview">
        ${SKILLS.map(s => {
          const val = playerData.skills[s.dbKey];
          const color = val ? getSkillColor(val) : '#555';
          const text = val ? `${SKILL_LEVELS[val]} (${val})` : 'N/A';
          return `
            <div class="bb-scout-skill-row">
              <span class="bb-scout-skill-name">${s.name}</span>
              <span class="bb-scout-skill-value" style="color: ${color}">${text}</span>
            </div>
          `;
        }).join('')}
      </div>
      <button class="bb-scout-btn bb-scout-btn-primary" id="bb-scout-save">
        Save to Database
      </button>
      <div class="bb-scout-last-saved" id="bb-scout-last-saved"></div>
      <button class="bb-scout-btn bb-scout-btn-secondary" id="bb-scout-copy">
        Copy to Clipboard
      </button>
    `;

    document.body.appendChild(overlay);

    document.getElementById('bb-scout-close').addEventListener('click', () => minimizeOverlay());
    document.getElementById('bb-scout-save').addEventListener('click', () => saveToDatabase(playerData));
    document.getElementById('bb-scout-copy').addEventListener('click', () => copyToClipboard(playerData));

    checkLastSaved(playerData.bbPlayerId);

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
  // DATA PERSISTENCE
  // ========================================

  async function saveToDatabase(playerData) {
    const saveBtn = document.getElementById('bb-scout-save');
    overlay_setStatus('info', 'Saving...');
    saveBtn.disabled = true;

    await saveLocally(playerData);

    try {
      let authData = await getAuthToken();
      if (!authData || !authData.access_token) {
        overlay_setStatus('warning', 'Not logged in. Data saved locally. Open extension popup to log in.');
        saveBtn.disabled = false;
        return;
      }

      // Refresh token if expired or about to expire
      if (authData.expires_at && authData.expires_at < Date.now() + 60000) {
        console.log('[BB Scout] Token expired, refreshing...');
        try {
          const refreshRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
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
            console.log('[BB Scout] Token refreshed');
          } else {
            overlay_setStatus('error', 'Auth expired. Please log out and log in again.');
            saveBtn.disabled = false;
            return;
          }
        } catch (e) {
          overlay_setStatus('error', 'Auth expired. Please log out and log in again.');
          saveBtn.disabled = false;
          return;
        }
      }

      // Upsert player (on_conflict tells PostgREST which unique column to match)
      const playerRes = await supabaseFetch('/rest/v1/players?on_conflict=bb_player_id', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          bb_player_id: playerData.bbPlayerId,
          name: playerData.name,
          nationality: playerData.nationality || null,
          height: playerData.height,
          position: playerData.position
        })
      }, authData);

      if (!playerRes.ok) throw new Error(`Player upsert failed: ${playerRes.status}`);
      const playerRecord = (await playerRes.json())[0];

      // Snapshot dedup: check if a snapshot already exists for this player today
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
          console.log(`[BB Scout] Updating existing snapshot ${existingId} for player ${playerData.bbPlayerId}`);
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
        console.warn('[BB Scout] Could not check existing snapshots, inserting new');
        snapRes = await supabaseFetch('/rest/v1/skill_snapshots', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(snapshotPayload)
        }, authData);
      }

      if (!snapRes.ok) throw new Error(`Snapshot save failed: ${snapRes.status}`);

      overlay_setStatus('success', 'Saved to database!');
      await markSynced(playerData.bbPlayerId);

      const lastSavedEl = document.getElementById('bb-scout-last-saved');
      if (lastSavedEl) lastSavedEl.textContent = 'Last saved: just now';

    } catch (err) {
      console.error('[BB Scout] Save error:', err);
      overlay_setStatus('warning', `Saved locally. Sync failed: ${err.message}`);
    }

    saveBtn.disabled = false;
  }

  async function saveLocally(playerData) {
    try {
      const key = `bb_scout_player_${playerData.bbPlayerId}`;
      // Don't save internal _parseInfo to storage
      const { _parseInfo, ...cleanData } = playerData;
      await chrome.storage.local.set({
        [key]: { ...cleanData, savedAt: new Date().toISOString(), synced: false }
      });
    } catch (err) {
      console.error('[BB Scout] Local save error:', err);
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
      console.error('[BB Scout] Mark synced error:', err);
    }
  }

  async function checkLastSaved(bbPlayerId) {
    try {
      const key = `bb_scout_player_${bbPlayerId}`;
      const result = await chrome.storage.local.get(key);
      if (result[key] && result[key].savedAt) {
        const el = document.getElementById('bb-scout-last-saved');
        if (el) {
          const date = new Date(result[key].savedAt);
          const synced = result[key].synced ? '' : ' (not synced)';
          el.textContent = `Last saved: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}${synced}`;
        }
      }
    } catch (err) {
      console.error('[BB Scout] Check last saved error:', err);
    }
  }

  function copyToClipboard(playerData) {
    const lines = [
      `${playerData.name} (ID: ${playerData.bbPlayerId})`,
      `Age: ${playerData.age} | Position: ${playerData.position} | Height: ${playerData.height}`,
      `DMI: ${playerData.dmi} | Potential: ${POTENTIAL_LEVELS[playerData.potential] || playerData.potential}`,
      `Salary: $${playerData.salary?.toLocaleString() || '?'} | SP: ${playerData.skillPoints || '?'}`,
      '',
      ...SKILLS.map(s => {
        const val = playerData.skills[s.dbKey];
        return `${s.name}: ${val ? `${SKILL_LEVELS[val]} (${val})` : 'N/A'}`;
      })
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      overlay_setStatus('success', 'Copied to clipboard!');
      setTimeout(() => overlay_setStatus('', ''), 2000);
    }).catch(() => {
      overlay_setStatus('error', 'Copy failed');
    });
  }

  // ========================================
  // SUPABASE API
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

  // ========================================
  // UI HELPERS
  // ========================================

  function overlay_setStatus(type, message) {
    const overlay = document.getElementById('bb-scout-overlay');
    if (!overlay) return;
    let statusEl = overlay.querySelector('.bb-scout-status');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.className = 'bb-scout-status';
      const saveBtn = document.getElementById('bb-scout-save');
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
