# BB Scout - Cowork Scouting Flow

## Goal
Automate the tedious parts of scouting Slovenian U-21 basketball players in BuzzerBeater (browser game). You handle the browser automation (recruiting/dropping players), the user handles shortlisting and skill capture via their Chrome extension.

## Context
- **BuzzerBeater** is a browser-based basketball management game at buzzerbeater.com
- To see a player's skills, they must be **called up (recruited) to the NT roster** — the roster has a max of **18 slots**
- The user has a **Chrome extension** that captures skills from the NT roster page — you do NOT need to capture skills, the user does this in their own browser
- The slow/tedious part is opening each player's page and clicking "Recruit" — this is what you automate
- The website can be slow — wait for pages to load fully before clicking

## Authentication
You need to be logged into buzzerbeater.com to recruit/drop players. The user will either:
- Log in for you at the start of the session, OR
- Give you credentials to log in

If you're not logged in or the session expires, ask the user. Login page: `https://www.buzzerbeater.com/default.aspx`

## Scouting Criteria (defaults — user may override)
- **Age: 19-20** 
- **Salary: 8,000+** (meaningful skill development)
- **Potential: 6+ (allstar or higher)**

## The Flow

The user provides you a list of **BB Player IDs** to process. They do the shortlisting themselves on nt.buzzerbeater.com (that step is fast for them).

### Step 1: Receive Player List
The user gives you player IDs (e.g., "54516150, 54892301, 55123456, ..."). Could be 30-100+ players. Split them into **batches of 18** (the NT roster limit).

### Step 2: Recruit Batch (you do this)
For each player in the current batch of 18:
1. Navigate to `https://www.buzzerbeater.com/player/{PLAYER_ID}/overview.aspx`
2. Wait for the page to fully load
3. Find and click the **"Recruit"** button/link (this calls the player up to the U-21 NT roster)
4. Wait for confirmation that the recruit went through
5. Move to the next player

**Important navigation notes:**
- The recruit button may be a link or button — look for text like "Recruit", "Call Up", or similar on the player profile page
- The page may redirect or show a confirmation — wait for it before proceeding
- If a recruit fails (roster full, player already on roster, etc.), note the error and continue with the next player
- The website can be slow (2-5 seconds per page load) — be patient

After recruiting all 18, report to the user:
- Which players were successfully recruited
- Any failures and why
- "Ready for you to capture skills"

### Step 3: Capture Skills (you do this — fully automated)
Once all 18 are recruited, navigate to the NT roster page where all player skills are visible:
- URL: `https://www.buzzerbeater.com/country/66/jnt/players.aspx` (Slovenia U-21)

**Read the DOM** to extract each player's data:
- Name, BB Player ID (from links/text)
- Age, Height, Position, Salary, Potential, DMI, Game Shape, Experience
- All 12 skills: Jump Shot, Jump Range, Outside Def., Handling, Driving, Passing, Inside Shot, Inside Def., Rebounding, Shot Blocking, Stamina, Free Throw
- Skill values are numbers 1-20 (may appear as text like "strong (8)" — extract the number)

**POST the scraped data** to the ingest endpoint:

```
POST https://bb-project-eta.vercel.app/api/scout/ingest
Content-Type: application/json

{
  "players": [
    {
      "bbPlayerId": 54516150,
      "name": "Aleksander Godec",
      "nationality": "Slovenia",
      "height": "6'8\" / 205 cm",
      "position": "PG",
      "age": 20,
      "salary": 12500,
      "potential": 7,
      "dmi": 45500,
      "gameShape": 8,
      "experience": 3,
      "skills": {
        "jump_shot": 8,
        "jump_range": 6,
        "outside_def": 7,
        "handling": 9,
        "driving": 8,
        "passing": 7,
        "inside_shot": 5,
        "inside_def": 4,
        "rebounding": 3,
        "shot_blocking": 2,
        "stamina": 6,
        "free_throw": 5
      }
    }
  ]
}
```

- Maximum **50 players per request**
- `bbPlayerId` and `name` are required, everything else is optional
- `skillPoints` is auto-calculated from skills if not provided
- Deduplicates: same player + same day = updates existing snapshot
- Response: `{ "results": [...], "errors": [...] }`

After successful POST, report how many players were saved.

### Step 4: Drop All Players (you do this)
Once skills are captured via the API, remove all 18 players from the roster:
1. Navigate to the NT roster management page (ask the user for the URL if you don't know it — it's typically something like `https://www.buzzerbeater.com/national/XXX/roster.aspx`)
2. For each player, find and click the **"Drop"** / **"Release"** / **"Remove"** button
3. Wait for confirmation before proceeding to next
4. Alternatively, visit each player's page and drop them from there

After dropping all 18, report to the user:
- How many were dropped successfully
- Any issues

### Step 5: Next Batch
Tell the user: **"Batch X/Y complete. Ready to recruit the next 18?"**

Wait for confirmation, then repeat Steps 2-4 with the next batch.

## Error Handling
- **Page doesn't load:** Wait up to 10 seconds, retry once. If still failing, tell the user.
- **Recruit button not found:** The page layout may vary. Describe what you see and ask the user for guidance.
- **"Roster is full" error:** You need to drop players first. Ask the user if they've captured skills for the current batch.
- **Session expired:** Tell the user to log in again.
- **Player already on roster:** Skip and note it. This is fine — they may already be there.

## Reporting Template
After each batch:
```
Batch 2/5 complete:
- Recruited: 18/18
- User captured skills: confirmed
- Dropped: 18/18
- Total progress: 36/87 players processed
- Next batch: 18 players ready

Proceed with next batch?
```

## Key URLs
- Player profile: `https://www.buzzerbeater.com/player/{ID}/overview.aspx`
- Login: `https://www.buzzerbeater.com/default.aspx`
- Slovenia U-21 roster: `https://www.buzzerbeater.com/country/66/jnt/players.aspx`
- Ingest API: `POST https://bb-project-eta.vercel.app/api/scout/ingest`
- Dashboard: `https://bb-project-eta.vercel.app/slovenia`

## Important Rules
- **Never** recruit more than 18 players at once (roster limit)
- **Always** wait for the user to confirm skill capture before dropping players
- **Always** confirm before starting each new batch
- The user's Chrome extension handles all data saving — you never need to interact with bb-project-eta.vercel.app during this flow
- If anything looks unexpected, describe what you see instead of guessing
