// Registers the bot's slash commands in every DISCORD_GUILD_IDS guild (per-guild =
// instant propagation). Run after any command-definition change or guild-list change:
//   npm run bot:register
import { config } from 'dotenv';
config({ path: '.env.local' });

const { registerCommands } = await import('../src/bot/commands');
await registerCommands();
process.exit(0);
