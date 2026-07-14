// v2/scripts/training/refit-salary.mts
// Fits the global salary deflation scale against current Neon data and prints it.
// Requires DATABASE_URL (reads .env.local like other v2 scripts).
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { fitDeflationScale } from '../../src/lib/training/refit';
import { skillsFromArray } from '../../src/lib/training/types';

const sql = neon(process.env.DATABASE_URL!);
// latest api snapshot per player with a salary and full skills
const rows = await sql`
  select distinct on (s.player_id)
    s.jump_shot, s.jump_range, s.outside_def, s.handling, s.driving, s.passing,
    s.inside_shot, s.inside_def, s.rebounding, s.shot_blocking, s.salary
  from snapshots s
  where s.source = 'api' and s.salary is not null and s.jump_shot is not null
  order by s.player_id, s.captured_at desc
`;
const data = rows.map((r) => ({
  skills: skillsFromArray([
    r.jump_shot, r.jump_range, r.outside_def, r.handling, r.driving, r.passing,
    r.inside_shot, r.inside_def, r.rebounding, r.shot_blocking,
  ].map(Number)),
  actualSalary: Number(r.salary),
}));
console.log(`fitting on ${data.length} players...`);
const { scale, medianAbsPctErr } = fitDeflationScale(data);
console.log(`deflationScale = ${scale.toFixed(4)} (median |err| ${medianAbsPctErr.toFixed(1)}%)`);
console.log('Pass this via estimateSalary(skills, { deflationScale }) — persisting the');
console.log('fitted value into a settings row is a Phase B task.');
