import { config } from 'dotenv';
config({ path: '.env.local' });

const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const val = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };

const { runCensus } = await import('../src/server/census/run');
const opts = {
  all: has('--all'),
  dryRun: has('--dry-run'),
  confirmed: has('--confirm'),
  countOnly: has('--count'),
  clearRoster: has('--clear-roster'),
  max: val('--max') ? Number(val('--max')) : undefined,
  resumeRunId: val('--resume') ? Number(val('--resume')) : undefined,
  pauseMs: val('--pause') ? Number(val('--pause')) : undefined,
  minAge: val('--min-age') ? Number(val('--min-age')) : undefined,
  maxAge: val('--max-age') ? Number(val('--max-age')) : undefined,
  minPotential: val('--min-potential') ? Number(val('--min-potential')) : undefined,
  maxPotential: val('--max-potential') ? Number(val('--max-potential')) : undefined,
  minSalary: val('--min-salary') ? Number(val('--min-salary')) : undefined,
  maxSalary: val('--max-salary') ? Number(val('--max-salary')) : undefined,
  minHeight: val('--min-height') ? Number(val('--min-height')) : undefined,
  maxHeight: val('--max-height') ? Number(val('--max-height')) : undefined,
};
console.log('census options:', JSON.stringify(opts));
const res = await runCensus(opts);
console.log('RESULT:', JSON.stringify(res));
process.exit(0);
