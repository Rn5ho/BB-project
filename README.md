# BB-project
Buzzerbeater U-21 tool

## Status: retired (2026-11-23)

BuzzerBeater was rebuilt (season 74, new app at play.buzzerbeater.com, Flutter web +
JSON API at next-api.buzzerbeater.com, Ory auth at next-auth.buzzerbeater.com). The old
`.aspx` pages now redirect into the new app, so every scraper here (login form,
transfer-list search, player cards, NT roster, census call-up/dismiss, training history)
no longer works.

The new game covers this tool's main job itself: NT staff get a **Prospects** page
(Staff · Slovenia U21 → Prospects) listing every eligible player (1,062 for Slovenia U21
on 2026-11-23) with filters, call-up, shortlist/tags/notes and CSV export. Skills show
when the club shares them, the player is for sale, or he is called up.

Notes for anyone reviving this: the new API is POST + JSON with the browser session
cookie (`credentials: 'include'`), e.g. `/nationalstaff/GetProspects`
`{nationalTeamId, offset, size, onlyVisible, sort, sortDescending, onlyShortlisted}`,
`/nationalstaff/ExportProspects`, `/market/GetMarketPlayers`, `/player/GetPlayer`.
Slovenia U21's team id in the new game is `011bb347-3f19-783e-9e92-a785593911bd`.
The old BBAPI XML (bbapi.buzzerbeater.com) still answers.

Still running at retirement (stop them when convenient): Hetzner `bb-census` service and
the BB crons (market sweep, self-trainer), the Vercel app, the Neon database.
