// BB Scout Discord bot entry — long-running service (systemd unit bb-discord-bot on
// the Hetzner box; see src/bot/README.md). Read-only against Neon; no BB traffic.
import { config } from 'dotenv';
config({ path: '.env.local' });

const { startBot } = await import('../src/bot/index');
await startBot();
