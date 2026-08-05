# BB Scout Discord bot — design

**Date:** 2026-08-05 · **Status:** approved in session ("Can we build one?")

## Goal

Let the owner (and later the community) query scouted players and exercise the training
optimizer from Discord. Test first on the owner's private server, then the community
server — so guild access is allowlisted. The bot is **strictly read-only**: no plan
saves, no BB traffic, Neon SELECTs only.

## Architecture

- `v2/src/bot/` — discord.js v14 service, entry `scripts/discord-bot.mts` (dotenv →
  dynamic import, repo convention). Runs on the Hetzner box as systemd unit
  `bb-discord-bot` (template: bb-census unit; `tsx scripts/discord-bot.mts`).
- Reuses the existing pure training stack: `planJourney` (staged M1/M2 search),
  `project`/`planToWeeks`, `archetypeTargets`, pop-anchored sublevels
  (`boundsFromAnchors`/`applyAnchors`) — the same code paths as `training:journey`
  and the player page.
- Env: `DISCORD_BOT_TOKEN`, `DISCORD_APP_ID`, `DISCORD_GUILD_IDS` (comma-separated
  allowlist; commands registered per-guild via `scripts/discord-register.mts` —
  instant propagation, and the bot refuses interactions from non-listed guilds/DMs).
- Every command defers its reply (Discord 3 s deadline vs beam-search seconds).
- Errors reply with the thrown message (our loaders throw human-readable errors).

## Commands (v1)

| Command | Options | Reply |
|---|---|---|
| `/player` | `query` (autocomplete over player names) | Embed: age/height/pot/position/team, 12 skills, TSP + In/Out, archetype matches, last full capture, BB link |
| `/plan` | `player` (autocomplete) | Active saved plan: blocks (training × weeks), staff, horizon — or "no active plan" |
| `/project` | `player` | Projects the player's ACTIVE plan from the current week: per-skill now→end displayed, TSP, pop count. No plan → points at `/journey` (keeps semantics crisp) |
| `/journey` | `player`, `build` (autocomplete over archetypes), optional `coach` 1-7, `yt` 0-7, `gym` 0-3, `tc` 0-3 (defaults 5/5/0/0) | Staged path (phase blocks), checkpoint table (now/M1/M2/end vs target bars), playable/finalized verdicts, weekly pop rate — `training:journey` output, Discord-formatted |

Autocomplete: name `ILIKE` search over `players` (limit 25, shows name · age · height);
build autocomplete over `getEffectiveArchetypes()`.

## Not in v1

Plan saving, chart images, manual "build a player" input (too clunky in slash options),
DM support, per-user rate limiting (guild allowlist suffices at this scale).

## Testing

- Formatters are pure (`src/bot/format.ts`) — vitest with fixture data.
- Live smoke on the owner's private server (owner creates the Discord app + token;
  3-minute setup documented in `src/bot/README.md`).

## Rollout

1. Owner: Discord Developer Portal → New Application → Bot → copy token + app id;
   invite URL with `bot applications.commands` scopes.
2. Box: env vars in `v2/.env.local`, `npm run bot:register`, install systemd unit.
3. Later: add the community guild id to `DISCORD_GUILD_IDS`, re-register, restart.
