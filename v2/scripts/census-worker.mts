import { config } from 'dotenv';
config({ path: '.env.local' });

const POLL_MS = Number(process.env.CENSUS_POLL_MS ?? 30000);

const { db, censusRuns } = await import('../src/db/index');
const { sql, eq } = await import('drizzle-orm');
const { runCensus } = await import('../src/server/census/run');
type CensusOpts = import('../src/server/census/run').CensusOpts;

async function claimOne(): Promise<{ id: number; opts: Record<string, unknown> } | null> {
  const claimed = await db.execute(sql`
    update census_runs set status='running', started_at=now()
    where id = (select id from census_runs where status='requested' order by id limit 1)
    returning id, totals
  `);
  const row = (claimed.rows as { id: number; totals: { opts?: Record<string, unknown> } | null }[])[0];
  if (!row) return null;
  return { id: row.id, opts: row.totals?.opts ?? {} };
}

function toCensusOpts(o: Record<string, unknown>): CensusOpts {
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  return {
    all: o.all === true,
    max: num(o.max),
    // confirmed comes from the enqueued opts (set only after the dashboard OFFSEASON confirm).
    // The worker never forces it — runCensus's hard --confirm gate stays authoritative.
    confirmed: o.confirmed === true,
    clearRoster: o.clearRoster === true,
    pauseMs: num(o.pauseMs),
    minAge: num(o.minAge),
    maxAge: num(o.maxAge),
    minPotential: num(o.minPotential),
    maxPotential: num(o.maxPotential),
    minSalary: num(o.minSalary),
    maxSalary: num(o.maxSalary),
    minHeight: num(o.minHeight),
    maxHeight: num(o.maxHeight),
    minTsp: num(o.minTsp),
    ntTrackSlack: num(o.ntTrackSlack),
  };
}

async function tick() {
  const job = await claimOne();
  if (!job) return;
  console.log(`[worker] claimed census run #${job.id}, opts=${JSON.stringify(job.opts)}`);
  try {
    const res = await runCensus(toCensusOpts(job.opts), (m) => console.log(`[run ${job.id}] ${m}`), job.id);
    console.log(`[worker] run #${job.id} done: ${JSON.stringify(res)}`);
  } catch (e) {
    console.error(`[worker] run #${job.id} FAILED: ${e}`);
    try {
      await db.update(censusRuns).set({ status: 'failed', finishedAt: new Date() }).where(eq(censusRuns.id, job.id));
    } catch {
      // best-effort; the row stays 'running' and can be resumed manually
    }
  }
}

console.log(`[worker] BB Scout census worker started; polling every ${POLL_MS}ms`);
// simple loop; systemd restarts on crash
while (true) {
  try { await tick(); } catch (e) { console.error('[worker] tick error', e); }
  await new Promise((r) => setTimeout(r, POLL_MS));
}
