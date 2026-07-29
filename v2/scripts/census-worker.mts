import { config } from 'dotenv';
config({ path: '.env.local' });

import { createServer } from 'node:http';

/**
 * Safety net only. The dashboard pings /wake on enqueue, so a queued run starts
 * immediately and this interval never has to be short. It MUST stay well above
 * Neon's scale-to-zero threshold (~5 min idle): a 30 s poll kept the compute
 * awake 24/7 and burned the whole monthly CU allowance on empty claim queries,
 * and even the 30 min poll cost ~30 CU-hrs/month in wake-ups (each poll keeps
 * the compute up ~5 min). Worst case a wake is lost, a queued run waits a day.
 */
const POLL_MS = Number(process.env.CENSUS_POLL_MS ?? 86_400_000);
const WAKE_PORT = Number(process.env.CENSUS_WAKE_PORT ?? 8791);
const WAKE_SECRET = process.env.CENSUS_WAKE_SECRET;
/** Ignore wakes arriving faster than this so a leaked token can't hammer Neon. */
const WAKE_DEBOUNCE_MS = 5_000;

const { db, censusRuns } = await import('../src/db/index');
const { sql, eq } = await import('drizzle-orm');
const { runCensus } = await import('../src/server/census/run');
type CensusOpts = import('../src/server/census/run').CensusOpts;

/** Set while the loop is sleeping; calling it ends the sleep early. */
let interruptSleep: (() => void) | null = null;
/** A wake that arrived while the loop wasn't sleeping — don't lose it. */
let pendingWake = false;
let lastWake = 0;

function sleep(ms: number): Promise<void> {
  if (pendingWake) {
    pendingWake = false;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      interruptSleep = null;
      resolve();
    }, ms);
    interruptSleep = () => {
      clearTimeout(timer);
      interruptSleep = null;
      resolve();
    };
  });
}

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

/** Returns true when a run was claimed, so the loop can drain the queue without sleeping. */
async function tick(): Promise<boolean> {
  const job = await claimOne();
  if (!job) return false;
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
  return true;
}

/**
 * Wake endpoint: POST /wake with the shared secret ends the current sleep so a
 * freshly enqueued run is claimed at once. Carries no payload — the queue in
 * Neon stays the source of truth, and runCensus's confirm gate is unaffected.
 */
if (WAKE_SECRET) {
  createServer((req, res) => {
    if (req.method !== 'POST' || !req.url?.startsWith('/wake')) {
      res.writeHead(404).end();
      return;
    }
    if (req.headers.authorization !== `Bearer ${WAKE_SECRET}`) {
      res.writeHead(401).end();
      return;
    }
    res.writeHead(202, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: true }));
    const now = Date.now();
    if (now - lastWake < WAKE_DEBOUNCE_MS) return;
    lastWake = now;
    console.log('[worker] wake received');
    // Mid-run or mid-claim there is no sleep to interrupt; flag it so the loop
    // skips its next sleep instead of idling for the full safety interval.
    if (interruptSleep) interruptSleep();
    else pendingWake = true;
  }).listen(WAKE_PORT, () => console.log(`[worker] wake endpoint listening on :${WAKE_PORT}`));
} else {
  console.warn('[worker] CENSUS_WAKE_SECRET unset — no wake endpoint; queued runs wait for the safety poll');
}

console.log(`[worker] BB Scout census worker started; safety poll every ${POLL_MS}ms`);
// simple loop; systemd restarts on crash
while (true) {
  let claimed = false;
  try {
    claimed = await tick();
  } catch (e) {
    console.error('[worker] tick error', e);
  }
  // Drain a backlog immediately; otherwise idle until woken or the safety poll fires.
  if (!claimed) await sleep(POLL_MS);
}
