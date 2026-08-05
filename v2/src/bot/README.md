# BB Scout Discord bot

Read-only slash commands over the scouting DB + training optimizer. Spec:
`docs/superpowers/specs/2026-08-05-discord-bot-design.md`.

Commands: `/player` (skill card), `/plan` (active plan), `/project` (project the active
plan), `/journey` (staged U-21 path toward an archetype build, M1/M2 milestones,
optional coach/yt/gym/tc, defaults 5/5/0/0). Player + build options autocomplete.

## Owner setup (once, ~3 min)

1. https://discord.com/developers/applications → **New Application** → name it.
2. General Information → copy **Application ID**.
3. **Bot** tab → **Reset Token** → copy the token. Toggle **Public Bot OFF**.
4. Discord app: Settings → Advanced → **Developer Mode** ON; right-click your server →
   **Copy Server ID**.
5. Invite (swap YOUR_APP_ID):
   `https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot+applications.commands&permissions=2048`

## Env (`v2/.env.local` on whatever machine runs the bot)

```
DISCORD_BOT_TOKEN=...
DISCORD_APP_ID=...
DISCORD_GUILD_IDS=111111111111,222222222222   # comma-separated allowlist
```

The guild list is BOTH where commands get registered and a hard runtime allowlist
(DMs and unknown guilds are refused). Adding the community server later = append its
id, `npm run bot:register`, restart the bot.

## Run

```
npm run bot:register   # after any command/guild change
npm run bot            # foreground (local testing)
```

## Hetzner deployment (systemd)

`/etc/systemd/system/bb-discord-bot.service` (mirror of bb-census):

```
[Unit]
Description=BB Scout Discord Bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=btcedge
WorkingDirectory=/home/btcedge/bb-scout/v2
ExecStart=/home/btcedge/bb-scout/v2/node_modules/.bin/tsx scripts/discord-bot.mts
Restart=always
RestartSec=10
Nice=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then: `systemctl daemon-reload && systemctl enable --now bb-discord-bot`.
Logs: `journalctl -u bb-discord-bot -f`.

## Safety posture

Strictly read-only: Neon SELECTs only, no plan saves, no BB traffic. Errors from the
data layer are shown verbatim (they're written for humans). Guild allowlist enforced
at registration AND per-interaction.
