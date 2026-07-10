# Hetzner Census Worker + Reliable Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development for the code tasks. Hetzner provisioning (Task 3/4) is controller-run over SSH. Steps use checkbox (`- [ ]`).

**Goal:** Run the census on the Hetzner VPS, triggered from the dashboard (works from any device), so scouting no longer needs the user's PC. Move the daily sync to a reliable Hetzner cron.

**Architecture:** "Queue through the database." The dashboard enqueues a census request (a `census_runs` row with status `requested` + the run options). A small always-on Node worker on Hetzner polls Neon, atomically claims the request, runs the census with Playwright/headless Chrome, and writes progress back to `census_runs`/`census_items`. The dashboard shows live status by reading those tables. No new inbound port on Hetzner; the worker only makes outbound calls to Neon. The desktop `.bat` remains a fallback. All existing safety guards (confirm, OFFSEASON, protected roster, restore-on-crash) carry over.

**Tech Stack:** v2 stack (Next.js, Drizzle/Neon, Playwright). Hetzner: Ubuntu 24, Node LTS, Playwright chromium, systemd. Box: `root@65.21.178.90`, apps under `/home/btcedge/`, runs `weather.service` (do NOT disturb), 2 CPU / 3.7 GB RAM / 23 GB free.

**Spec source:** this document (design agreed in conversation 2026-07-11).

---

## Design detail

- **`census_runs.status`** gains `requested`. Lifecycle: `requested` (enqueued by dashboard) → `running` (worker claimed) → `finished`|`aborted`|`failed`.
- **Enqueue** (dashboard server action) inserts `{ status: 'requested', totals: { opts } }` where `opts` = the census options (filters, clearRoster, confirmed). Candidate selection happens at RUN time (fresh data), not enqueue time.
- **Worker claim** is atomic: `UPDATE census_runs SET status='running', started_at=now() WHERE id = (SELECT id FROM census_runs WHERE status='requested' ORDER BY id LIMIT 1) RETURNING *`. Guarantees one worker instance takes one job.
- **`runCensus` refactor:** accept an optional `existingRunId`. When provided, skip creating a new `census_runs` row (the worker already claimed it); still compute candidates + insert `census_items` under that id, then run the batch loop exactly as today. Read `opts` from the claimed row's `totals.opts`.
- **Worker safety:** `runCensus`'s hard `--confirm` gate stays; the enqueued opts must carry `confirmed: true` (set only when the dashboard user passes the OFFSEASON confirm). The worker never bypasses it.
- **Resource care:** worker runs `nice`d; only one census at a time (single claim); headless Chrome closes after each run.
- **Daily sync:** a Hetzner `crontab` entry curls `https://bb-scout-v2.vercel.app/api/cron/daily` with the CRON_SECRET at 06:00 UTC. The Vercel cron is removed from `vercel.json` to avoid double-firing (dedup would make doubles harmless, but single source of truth is cleaner).

---

### Task 1: Schema + runCensus queued mode + worker script (code)

**Files:** Modify `v2/src/db/schema.ts`, `v2/src/server/census/run.ts`; create `v2/scripts/census-worker.mts`

- [ ] **Step 1: Schema** — in `v2/src/db/schema.ts`, add `'requested'` to the `censusRuns.status` text enum (currently `running|finished|aborted|failed` → add `requested`). Run `npx drizzle-kit generate && npx drizzle-kit migrate` (applies to Neon directly — NOT blocked by the Vercel deploy cap). Commit generated SQL.

- [ ] **Step 2: runCensus existingRunId param.** In `runCensus(opts, log)`, add a third param `existingRunId?: number`. Change the run-row creation block:
  - Currently (non-resume) it does `db.insert(censusRuns).values({status:'running', totals:{filters,...}})` then inserts items.
  - New: if `existingRunId` is provided, set `runId = existingRunId` and DO NOT insert a new census_runs row; still insert the `census_items` for the computed candidates under `runId`, and update the row's totals with `{ filters, candidateCount, ...(originalRoster) }` (merge, preserving the enqueued opts). If not provided, behave exactly as today.
  - Keep the resume path (`opts.resumeRunId`) unchanged. `existingRunId` and `resumeRunId` are mutually exclusive; if both set, prefer resume.

- [ ] **Step 3: Worker script** — `v2/scripts/census-worker.mts`:

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });

const POLL_MS = Number(process.env.CENSUS_POLL_MS ?? 30000);

const { db, censusRuns } = await import('../src/db/index');
const { sql, eq } = await import('drizzle-orm');
const { runCensus } = await import('../src/server/census/run');

async function claimOne(): Promise<{ id: number; opts: Record<string, unknown> } | null> {
  const claimed = await db.execute(sql`
    update census_runs set status='running', started_at=now()
    where id = (select id from census_runs where status='requested' order by id limit 1)
    returning id, totals
  `);
  const row = (claimed.rows as { id: number; totals: { opts?: Record<string, unknown> } }[])[0];
  if (!row) return null;
  return { id: row.id, opts: row.totals?.opts ?? {} };
}

async function tick() {
  const job = await claimOne();
  if (!job) return;
  console.log(`[worker] claimed census run #${job.id}, opts=${JSON.stringify(job.opts)}`);
  try {
    const res = await runCensus({ ...job.opts, confirmed: true }, (m) => console.log(`[run ${job.id}] ${m}`), job.id);
    console.log(`[worker] run #${job.id} done: ${JSON.stringify(res)}`);
  } catch (e) {
    console.error(`[worker] run #${job.id} FAILED: ${e}`);
    await db.update(censusRuns).set({ status: 'failed', finishedAt: new Date() }).where(eq(censusRuns.id, job.id)).catch(() => {});
  }
}

console.log(`[worker] BB Scout census worker started; polling every ${POLL_MS}ms`);
// simple loop; systemd restarts on crash
// eslint-disable-next-line no-constant-condition
while (true) {
  try { await tick(); } catch (e) { console.error('[worker] tick error', e); }
  await new Promise((r) => setTimeout(r, POLL_MS));
}
```

(Adjust the `runCensus` opts spread to match its `CensusOpts` shape — the enqueued opts use the same keys: all/max/minAge/maxAge/minPotential/maxPotential/minSalary/maxSalary/minHeight/maxHeight/clearRoster.)

- [ ] **Step 4:** `npm test` green, `npm run build` clean (worker script is a standalone entry — build validates types via tsc). Add npm script `"census:worker": "tsx scripts/census-worker.mts"`.

- [ ] **Step 5: Commit + push**

```bash
git add v2/src/db/schema.ts v2/drizzle v2/src/server/census/run.ts v2/scripts/census-worker.mts v2/package.json
git commit -m "feat(v2): queued census mode + Hetzner worker (poll-claim-run)"
git push
```

---

### Task 2: Dashboard enqueue UI + live status (code; deploys when Vercel cap resets)

**Files:** Create `v2/src/app/census/page.tsx`, `v2/src/app/census/actions.ts`, `v2/src/components/census/CensusRunForm.tsx`; modify `v2/src/components/Navbar.tsx`

- [ ] **Step 1: Enqueue action** — `v2/src/app/census/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { db, censusRuns } from '@/db';

export interface EnqueueOpts {
  minAge?: number; maxAge?: number; minPotential?: number; maxPotential?: number;
  minSalary?: number; maxSalary?: number; minHeight?: number; maxHeight?: number;
  all?: boolean; clearRoster?: boolean;
}

export async function enqueueCensus(opts: EnqueueOpts, offseasonConfirm: string) {
  if (offseasonConfirm.trim().toUpperCase() !== 'OFFSEASON') {
    return { ok: false as const, error: 'Type OFFSEASON to confirm — dismissals cost NT enthusiasm; run off-season only.' };
  }
  const [row] = await db.insert(censusRuns).values({ status: 'requested', totals: { opts: { ...opts, confirmed: true } } }).returning({ id: censusRuns.id });
  revalidatePath('/census');
  return { ok: true as const, runId: row.id };
}
```

- [ ] **Step 2: Form** — `v2/src/components/census/CensusRunForm.tsx` (client): filter inputs (min/max age default 19/21, min potential, min/max salary, min/max height), a "clear roster (18 slots)" checkbox, an OFFSEASON confirm text field, and a "Queue census" button calling `enqueueCensus`. On success show "Queued run #N — the Hetzner worker will pick it up within ~30s." Include the same OFF-SEASON warning copy as the launcher.

- [ ] **Step 3: Page** — `v2/src/app/census/page.tsx` (server, `dynamic='force-dynamic'`): render the form + a live status table of recent `census_runs` (id, status incl. `requested`/`running`, filters via the existing formatter, captured/failed, started). Reuses/moves the census-runs display from Settings (or links to it). Poll-free is fine (user refreshes); optional: a client auto-refresh every 15s while a run is `requested`/`running`.

- [ ] **Step 4: Nav** — add `{ href: '/census', label: 'Census' }` to Navbar LINKS.

- [ ] **Step 5:** `npm test` green, `npm run build` clean. Commit + push (goes live next deploy).

```bash
git add v2/src/app/census v2/src/components/census v2/src/components/Navbar.tsx
git commit -m "feat(v2): dashboard census enqueue + live status (drives the Hetzner worker)"
git push
```

---

### Task 3: Provision Hetzner + deploy worker (controller, SSH)

All commands over `ssh root@65.21.178.90`. Keep the census app under `/home/btcedge/bb-scout` owned by `btcedge`. Do NOT touch `weather.service`.

- [ ] **Step 1: Install Node LTS** (NodeSource): `curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs`. Verify `node -v` ≥ 22.
- [ ] **Step 2: Clone the repo** to `/home/btcedge/bb-scout` (public GitHub `Rn5ho/BB-project`): `git clone https://github.com/Rn5ho/BB-project.git /home/btcedge/bb-scout && chown -R btcedge:btcedge /home/btcedge/bb-scout`.
- [ ] **Step 3: Install deps + Playwright chromium** (as btcedge, in `bb-scout/v2`): `npm ci`, then `npx playwright install --with-deps chromium` (installs the browser + apt system libs).
- [ ] **Step 4: Env** — create `/home/btcedge/bb-scout/v2/.env.local` (chmod 600, owned btcedge) with `DATABASE_URL`, `BB_WEB_USERNAME` (optional), `BB_WEB_PASSWORD`, `BB_API_USERNAME`, `BB_API_SECURITY_CODE`, `APP_SESSION_SECRET`/`APP_PASSWORD` not needed for the worker. Controller supplies values from the local `v2/.env.local` (scp the relevant lines or paste over SSH; never echo them to logs).
- [ ] **Step 5: systemd unit** `/etc/systemd/system/bb-census.service`:

```
[Unit]
Description=BB Scout Census Worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=btcedge
WorkingDirectory=/home/btcedge/bb-scout/v2
ExecStart=/usr/bin/npx tsx scripts/census-worker.mts
Restart=always
RestartSec=10
Nice=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

`systemctl daemon-reload && systemctl enable --now bb-census && systemctl status bb-census --no-pager`. Confirm the log shows "census worker started; polling".

- [ ] **Step 6: Update deploy path.** A repeatable update = `ssh root@65.21.178.90 "cd /home/btcedge/bb-scout && git pull && cd v2 && sudo -u btcedge npm ci && systemctl restart bb-census"`. Document in CLAUDE.md.

---

### Task 4: Reliable daily sync via Hetzner cron (controller, SSH)

- [ ] **Step 1:** Add a root crontab entry (or a btcedge one) hitting the Vercel cron endpoint at 06:00 UTC:
  `0 6 * * * curl -fsS -H "Authorization: Bearer <CRON_SECRET>" https://bb-scout-v2.vercel.app/api/cron/daily >> /var/log/bb-cron.log 2>&1`
  (CRON_SECRET value from the app env; store the crontab line without exposing the secret in shell history where avoidable.)
- [ ] **Step 2: Remove the Vercel cron** to avoid double-fire: delete the `crons` array from `v2/vercel.json` (commit; takes effect next deploy). Note in the commit that Hetzner cron is now the scheduler.
- [ ] **Step 3:** Verify: run the curl line manually once over SSH → expect `{"ok":true,...}`; check `sync_log` gets a `cron`-tagged entry (Task from earlier added the trigger column — the endpoint tags its runs `cron`).

---

### Task 5: End-to-end test + docs (controller)

- [ ] **Step 1: Small live test.** Enqueue a tiny census (once the dashboard is deployed, use the form; before then, insert a `requested` row directly: `insert into census_runs (status, totals) values ('requested', '{"opts":{"minAge":19,"maxAge":19,"minPotential":9,"max":2,"confirmed":true}}')`). Watch `journalctl -u bb-census -f` on Hetzner: worker claims it, runs ~2 players, restores roster, marks finished. Verify in Neon: 2 new `census` snapshots; roster back to protected set.
- [ ] **Step 2:** Confirm the desktop `.bat` still works (fallback) — unaffected.
- [ ] **Step 3: Docs** — CLAUDE.md + user memory: the queue-through-Neon architecture, the Hetzner worker (service name, update command, resource notes), the moved cron, and the enqueue-from-dashboard flow.

---

## Self-Review (write-time)

- **Spec coverage:** queue via Neon (requested status) → Task 1; worker poll-claim-run → Task 1/3; dashboard enqueue + live status → Task 2; Hetzner provisioning + systemd → Task 3; reliable cron + remove Vercel cron → Task 4; e2e + docs → Task 5.
- **Safety preserved:** runCensus's --confirm gate stays; enqueue only sets confirmed:true after the OFFSEASON check; worker never bypasses; protected-roster/restore logic untouched (existingRunId only changes where the run row comes from).
- **Vercel-cap independence:** Tasks 1 (schema→Neon), 3, 4 (Hetzner), and the worker are NOT blocked by today's deploy cap; only Task 2's UI needs a deploy (lands next window; census is triggerable via direct DB insert meanwhile).
- **Type consistency:** enqueued `opts` keys match `CensusOpts`; `existingRunId` threads through runCensus; worker reads `totals.opts`.
- **Deliberate deferrals:** running the sync code *natively* on Hetzner (vs curling the Vercel endpoint) — not needed; the endpoint approach reuses deployed code. TLS/public census endpoint — avoided by the poll-queue design.
