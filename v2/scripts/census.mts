import { config } from 'dotenv';
config({ path: '.env.local' });

const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const val = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };

const { runCensus } = await import('../src/server/census/run');
const opts = {
  all: has('--all'),
  dryRun: has('--dry-run'),
  max: val('--max') ? Number(val('--max')) : undefined,
  resumeRunId: val('--resume') ? Number(val('--resume')) : undefined,
  pauseMs: val('--pause') ? Number(val('--pause')) : undefined,
};
console.log('census options:', JSON.stringify(opts));
const res = await runCensus(opts);
console.log('RESULT:', JSON.stringify(res));
process.exit(0);
