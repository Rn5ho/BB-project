// BB Scout Discord bot — read-only slash commands over the scouting DB + training
// optimizer. Guild-allowlisted (DISCORD_GUILD_IDS); every command defers its reply
// (beam search takes seconds vs Discord's 3 s deadline).
import {
  Client, GatewayIntentBits, EmbedBuilder,
  type Interaction, type AutocompleteInteraction, type ChatInputCommandInteraction,
} from 'discord.js';
import { allowedGuildIds } from './commands';
import { searchPlayers } from './data';
import { handlePlayer, handlePlan, handleProject, handleJourney, type ReplyPayload } from './handlers';
import { getEffectiveArchetypes } from '@/queries/archetypes';

const MAX_CONTENT = 2000;

function trim(content: string): string {
  return content.length <= MAX_CONTENT ? content : content.slice(0, MAX_CONTENT - 2) + '…';
}

/** The player option carries the autocomplete value (a player id) — but users can
 *  submit free text without picking a suggestion, so fall back to a name search. */
async function resolvePlayerId(raw: string): Promise<number> {
  const asId = Number(raw.trim());
  if (Number.isInteger(asId) && asId > 0) return asId;
  const found = await searchPlayers(raw, 5);
  if (found.length === 1) return found[0].bbPlayerId;
  if (found.length === 0) throw new Error(`No tracked player matches "${raw}".`);
  throw new Error(`Ambiguous player "${raw}" — did you mean: ${found.map((f) => f.name).join(', ')}?`);
}

async function onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  try {
    const focused = interaction.options.getFocused(true);
    if (focused.name === 'player') {
      const found = await searchPlayers(String(focused.value), 25);
      await interaction.respond(found.map((f) => ({
        name: `${f.name} · age ${f.ageNow ?? '?'}${f.heightCm ? ` · ${f.heightCm}cm` : ''}`.slice(0, 100),
        value: String(f.bbPlayerId),
      })));
      return;
    }
    if (focused.name === 'build') {
      const q = String(focused.value).toLowerCase();
      const archetypes = await getEffectiveArchetypes();
      await interaction.respond(
        archetypes
          .filter((a) => !q || a.name.toLowerCase().includes(q))
          .slice(0, 25)
          .map((a) => ({ name: a.name.slice(0, 100), value: a.name.slice(0, 100) })),
      );
      return;
    }
    await interaction.respond([]);
  } catch {
    // autocomplete failures must never crash the bot; an empty list is fine
    try { await interaction.respond([]); } catch { /* already responded/expired */ }
  }
}

async function onCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  try {
    const playerId = await resolvePlayerId(interaction.options.getString('player', true));
    let payload: ReplyPayload;
    switch (interaction.commandName) {
      case 'player':
        payload = await handlePlayer(playerId);
        break;
      case 'plan':
        payload = await handlePlan(playerId);
        break;
      case 'project':
        payload = await handleProject(playerId);
        break;
      case 'journey':
        payload = await handleJourney(playerId, interaction.options.getString('build', true), {
          coachLevel: interaction.options.getInteger('coach') ?? 5,
          youthTrainerLevel: interaction.options.getInteger('yt') ?? 5,
          gymLevel: interaction.options.getInteger('gym') ?? 0,
          trainingCourtLevel: interaction.options.getInteger('tc') ?? 0,
        });
        break;
      default:
        payload = { content: `Unknown command: ${interaction.commandName}` };
    }
    if (payload.embed) {
      const embed = new EmbedBuilder()
        .setTitle(payload.embed.title)
        .setDescription(payload.embed.description)
        .setColor(0xe5a64b);
      if (payload.embed.url) embed.setURL(payload.embed.url);
      await interaction.editReply({ embeds: [embed], content: payload.content ? trim(payload.content) : undefined });
    } else {
      await interaction.editReply({ content: trim(payload.content ?? '(empty reply)') });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await interaction.editReply({ content: `⚠ ${trim(msg)}` }).catch(() => {});
  }
}

export async function startBot(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('DISCORD_BOT_TOKEN not set');
  const guilds = allowedGuildIds();
  if (guilds.length === 0) throw new Error('DISCORD_GUILD_IDS is empty — refusing to start an open bot');

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on('interactionCreate', async (interaction: Interaction) => {
    // hard allowlist: ignore DMs and non-listed guilds entirely
    if (!interaction.inGuild() || !guilds.includes(interaction.guildId)) {
      if (interaction.isRepliable()) {
        await interaction.reply({ content: 'This bot is private.', ephemeral: true }).catch(() => {});
      }
      return;
    }
    if (interaction.isAutocomplete()) return onAutocomplete(interaction);
    if (interaction.isChatInputCommand()) return onCommand(interaction);
  });

  client.once('clientReady', () => {
    console.log(`[bot] logged in as ${client.user?.tag}; guilds allowlist: ${guilds.join(', ')}`);
  });

  await client.login(token);
}
