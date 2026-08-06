// READ-ONLY: print season ids + start dates covering 2024-2026 (delonche log dating).
import { config } from 'dotenv';
config({ path: '.env.local' });
const { sql } = await import('drizzle-orm');
const { db } = await import('../../../src/db/index');
const r = await db.execute(sql`
  select id, start, finish from seasons where id between 64 and 73 order by id
`);
console.log(JSON.stringify((r as any).rows ?? r, null, 1));
process.exit(0);
