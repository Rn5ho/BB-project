// Slash-command definitions + per-guild registration (instant propagation; also acts
// as the allowlist — commands only exist in DISCORD_GUILD_IDS guilds).
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const playerOption = (b: SlashCommandBuilder) =>
  b.addStringOption((o) =>
    o.setName('player').setDescription('Player name (start typing for suggestions)').setRequired(true).setAutocomplete(true));

export function buildCommands() {
  const player = new SlashCommandBuilder()
    .setName('player')
    .setDescription('Look up a scouted player — skills, TSP, archetype matches');
  playerOption(player);

  const plan = new SlashCommandBuilder()
    .setName('plan')
    .setDescription("Show a player's active training plan");
  playerOption(plan);

  const projectCmd = new SlashCommandBuilder()
    .setName('project')
    .setDescription("Project a player's active plan to its end (bbscout model)");
  playerOption(projectCmd);

  const journey = new SlashCommandBuilder()
    .setName('journey')
    .setDescription('Staged U-21 training path toward an archetype build (M1/M2 milestones)');
  playerOption(journey as SlashCommandBuilder);
  journey
    .addStringOption((o) =>
      o.setName('build').setDescription('Target archetype build').setRequired(true).setAutocomplete(true))
    .addIntegerOption((o) => o.setName('coach').setDescription('Coach level 1-7 (default 5)').setMinValue(1).setMaxValue(7))
    .addIntegerOption((o) => o.setName('yt').setDescription('Youth trainer level 0-7 (default 5)').setMinValue(0).setMaxValue(7))
    .addIntegerOption((o) => o.setName('gym').setDescription('Gym level 0-3 (default 0)').setMinValue(0).setMaxValue(3))
    .addIntegerOption((o) => o.setName('tc').setDescription('Training court level 0-3 (default 0)').setMinValue(0).setMaxValue(3));

  return [player, plan, projectCmd, journey].map((c) => c.toJSON());
}

export function allowedGuildIds(): string[] {
  return (process.env.DISCORD_GUILD_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function registerCommands(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const appId = process.env.DISCORD_APP_ID;
  if (!token || !appId) throw new Error('DISCORD_BOT_TOKEN / DISCORD_APP_ID not set');
  const guilds = allowedGuildIds();
  if (guilds.length === 0) throw new Error('DISCORD_GUILD_IDS is empty — nowhere to register');
  const rest = new REST().setToken(token);
  const body = buildCommands();
  for (const guildId of guilds) {
    await rest.put(Routes.applicationGuildCommands(appId, guildId), { body });
    console.log(`registered ${body.length} commands in guild ${guildId}`);
  }
}
