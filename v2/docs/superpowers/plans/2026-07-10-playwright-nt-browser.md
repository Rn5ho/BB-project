# Playwright NT Browser — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain-HTTP `BbWebSession` transport in the census with a Playwright chromium headless browser so that BB's JS-popup-gated recruit/dismiss controls work correctly.

**Architecture:** Create `v2/src/server/bb/nt-browser.ts` with a `NtBrowser` class wrapping Playwright. Rewire `v2/src/server/census/run.ts` to use `NtBrowser` instead of `BbWebSession` + `fetchNtRoster/recruitPlayer/dismissPlayer`. Delete `v2/src/server/bb/nt-roster.ts` (only `run.ts` imports it; confirmed by grep). No live actions — only implement, typecheck, build.

**Tech Stack:** TypeScript, Playwright (`playwright` is already in devDependencies at ^1.61.1), Next.js 16 (tsx for CLI), Vitest for tests.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| **Create** | `v2/src/server/bb/nt-browser.ts` | `NtBrowser` class — Playwright chromium, login, recruit, dismiss, fetchRoster, close |
| **Modify** | `v2/src/server/census/run.ts` | Swap `BbWebSession`+`nt-roster` imports for `NtBrowser`; update call sites and `safeDismiss`/`abort` signatures |
| **Delete** | `v2/src/server/bb/nt-roster.ts` | Dead code after rewire; no other importer |

---

### Task 1: Create `nt-browser.ts`

**Files:**
- Create: `v2/src/server/bb/nt-browser.ts`

- [ ] **Step 1: Verify playwright chromium is installed**

```powershell
cd D:\ClaudeProjects\BB-project\v2
npx playwright install chromium
```

Expected: "Chromium X.Y.Z already installed" or it downloads and installs. Either is fine — no error.

- [ ] **Step 2: Write `nt-browser.ts`**

Create `D:\ClaudeProjects\BB-project\v2\src\server\bb\nt-browser.ts` with the exact content below:

```ts
// NT roster actions via a real Playwright browser.
// BB's recruit/dismiss confirm buttons use JS popups (onclick returns false) that cannot
// be replayed over raw HTTP — the server 302s to /errorpage.aspx on direct POSTs.
// A real browser executes the correct click→popup→confirm event sequence.

import { chromium, type Browser, type Page } from 'playwright';
import { parsePlayerCards, type ParsedCard } from './card-parser';

const BASE = 'https://www.buzzerbeater.com';

export class NtBrowser {
  private browser!: Browser;
  private page!: Page;

  async launch(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
  }

  async login(): Promise<void> {
    const user = process.env.BB_WEB_USERNAME || process.env.BB_API_USERNAME;
    const pass = process.env.BB_WEB_PASSWORD;
    if (!user || !pass) throw new Error('BB_WEB_USERNAME/BB_WEB_PASSWORD not configured');
    await this.page.goto(`${BASE}/default.aspx`, { waitUntil: 'domcontentloaded' });
    await this.page.fill('#txtLoginUserName', user);
    await this.page.fill('#txtLoginPassword', pass);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
      this.page.click('#btnLogin'),
    ]);
    // verify: a logged-in page should not show the login form
    if (await this.page.locator('#txtLoginPassword').count() > 0) {
      throw new Error('BB browser login failed (login form still present)');
    }
  }

  private async gotoPlayer(id: number): Promise<void> {
    await this.page.goto(`${BASE}/player/${id}/overview.aspx`, { waitUntil: 'domcontentloaded' });
  }

  /** Call a player up to the NT roster. Throws if not confirmed rostered. */
  async recruit(id: number): Promise<void> {
    await this.gotoPlayer(id);
    if (await this.page.locator('#cphContent_btnNTDismiss2').count() > 0) return; // already rostered
    if (await this.page.locator('#cphContent_btnNTRecruit2').count() === 0) {
      throw new Error(`recruit ${id}: no recruit control (not eligible?)`);
    }
    await this.page.click('#cphContent_btnNTRecruit2');            // show popup (client-side)
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
      this.page.click('#cphContent_btnRecruitYes2'),               // submit → recruit
    ]);
    await this.page.waitForSelector('#cphContent_btnNTDismiss2', { timeout: 20000 });
  }

  /** Dismiss a player from the NT roster. Throws if not confirmed removed. */
  async dismiss(id: number): Promise<void> {
    await this.gotoPlayer(id);
    if (await this.page.locator('#cphContent_btnNTRecruit2').count() > 0) return; // already off roster
    if (await this.page.locator('#cphContent_btnNTDismiss2').count() === 0) {
      throw new Error(`dismiss ${id}: no dismiss control`);
    }
    await this.page.click('#cphContent_btnNTDismiss2');            // show popup
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
      this.page.click('#cphContent_btnDismissYes2'),               // submit → dismiss
    ]);
    await this.page.waitForSelector('#cphContent_btnNTRecruit2', { timeout: 20000 });
  }

  async fetchRoster(): Promise<ParsedCard[]> {
    await this.page.goto(`${BASE}/country/66/jnt/players.aspx`, { waitUntil: 'domcontentloaded' });
    return parsePlayerCards(await this.page.content());
  }

  async close(): Promise<void> {
    await this.browser?.close();
  }
}
```

- [ ] **Step 3: Typecheck the new file only**

```powershell
cd D:\ClaudeProjects\BB-project\v2
npx tsc --noEmit --skipLibCheck 2>&1 | Select-String "nt-browser"
```

Expected: no lines (zero errors mentioning `nt-browser`). If there are errors, fix them before proceeding.

---

### Task 2: Rewire `run.ts` to use `NtBrowser`

**Files:**
- Modify: `v2/src/server/census/run.ts`

The existing file has these transport-specific things to change (everything else stays intact):

| Old | New |
|-----|-----|
| `import { BbWebSession } from '@/server/bb/web-session';` | remove |
| `import { fetchNtRoster, recruitPlayer, dismissPlayer } from '@/server/bb/nt-roster';` | replace with `import { NtBrowser } from '@/server/bb/nt-browser';` |
| `const session = new BbWebSession(); await session.login();` | `const nt = new NtBrowser(); await nt.launch(); await nt.login();` |
| `fetchNtRoster(session)` (×3 occurrences) | `nt.fetchRoster()` |
| `recruitPlayer(session, it.playerId)` | `nt.recruit(it.playerId)` |
| `dismissPlayer(session, playerId)` in `safeDismiss` | `nt.dismiss(playerId)` |
| `safeDismiss(session, ...)` call sites | `safeDismiss(nt, ...)` |
| `abort(session, ...)` call sites | `abort(nt, ...)` |
| `safeDismiss(session: BbWebSession, ...)` signature | `safeDismiss(nt: NtBrowser, ...)` |
| `abort(session: BbWebSession, ...)` signature | `abort(nt: NtBrowser, ...)` |
| No try/finally around entire run body | wrap with `try { ... } finally { await nt.close(); }` |

- [ ] **Step 1: Replace the import block at the top of `run.ts`**

The current lines 1-6:
```ts
import { db, players, snapshots, censusRuns, censusItems } from '@/db';
import { BbWebSession } from '@/server/bb/web-session';
import { fetchNtRoster, recruitPlayer, dismissPlayer } from '@/server/bb/nt-roster';
import { getCurrentSeasonId } from '@/queries/players';
import { selectCandidates, freeSlots, type CandidateRow } from './candidates';
import { utcDayKey } from '@/server/sync/players';
import { sql, and, eq, gte, inArray } from 'drizzle-orm';
```

Replace with:
```ts
import { db, players, snapshots, censusRuns, censusItems } from '@/db';
import { NtBrowser } from '@/server/bb/nt-browser';
import { getCurrentSeasonId } from '@/queries/players';
import { selectCandidates, freeSlots, type CandidateRow } from './candidates';
import { utcDayKey } from '@/server/sync/players';
import { sql, and, eq, gte, inArray } from 'drizzle-orm';
```

- [ ] **Step 2: Replace the session setup block (lines ~24-31 of `runCensus`)**

Current:
```ts
  // 2. login + protected roster
  const session = new BbWebSession();
  await session.login();
  log('WARNING: do not manually modify the NT roster while the census runs.');
  const rosterAtStart = await fetchNtRoster(session);
```

Replace with:
```ts
  // 2. launch browser, login + protected roster
  const nt = new NtBrowser();
  await nt.launch();
  try {
  await nt.login();
  log('WARNING: do not manually modify the NT roster while the census runs.');
  const rosterAtStart = await nt.fetchRoster();
```

Note: the `try {` opens a block that will be closed in Step 5 with a `} finally { await nt.close(); }`.

- [ ] **Step 3: Replace `recruitPlayer` and `fetchNtRoster` in the batch loop**

In the batch loop (around lines ~62-76):

Replace:
```ts
          await recruitPlayer(session, it.playerId);
```
With:
```ts
          await nt.recruit(it.playerId);
```

Replace (the roster fetch after a batch):
```ts
        const roster = await fetchNtRoster(session);
```
With:
```ts
        const roster = await nt.fetchRoster();
```

- [ ] **Step 4: Replace `safeDismiss` call sites and `fetchNtRoster` in the finally block**

Around line ~70 (inside the abort path):
```ts
if (++consecutiveRecruitFails >= 3) { await abort(session, runId, batchIds, log); throw new Error('3 consecutive recruit failures — aborted with clean roster'); }
```
Replace:
```ts
if (++consecutiveRecruitFails >= 3) { await abort(nt, runId, batchIds, log); throw new Error('3 consecutive recruit failures — aborted with clean roster'); }
```

Around line ~80 (dismiss after batch):
```ts
          await safeDismiss(session, id, log);
```
Replace with:
```ts
          await safeDismiss(nt, id, log);
```

In the `finally` block (lines ~91-98):
```ts
    const rosterEnd = await fetchNtRoster(session);
    const extras = rosterEnd.filter((c) => !protectedIds.has(c.bbPlayerId));
    if (extras.length > 0) {
      log(`Cleanup: dismissing ${extras.length} non-protected players left on roster: ${extras.map((e) => e.bbPlayerId).join(', ')}`);
      for (const e of extras) { await safeDismiss(session, e.bbPlayerId, log); await sleep(); }
    }
```
Replace with:
```ts
    const rosterEnd = await nt.fetchRoster();
    const extras = rosterEnd.filter((c) => !protectedIds.has(c.bbPlayerId));
    if (extras.length > 0) {
      log(`Cleanup: dismissing ${extras.length} non-protected players left on roster: ${extras.map((e) => e.bbPlayerId).join(', ')}`);
      for (const e of extras) { await safeDismiss(nt, e.bbPlayerId, log); await sleep(); }
    }
```

- [ ] **Step 5: Close the `try { ... } finally { await nt.close(); }` block**

After the roster-cleanup `finally` block closes (after line ~98's `}`), and before line ~100's `await db.update(censusRuns)...`, close the inner try block and add a finally:

The end of `runCensus` currently looks like:
```ts
  } finally {
    // 5. final safety net: always dismiss any non-protected players left on roster
    const rosterEnd = await fetchNtRoster(session);
    ...
  }
  await db.update(censusRuns)...
  log(...);
  return { runId, captured, failed };
}
```

This outer `try/finally` (lines ~53-99) is the batch loop's own try/finally. We need to wrap the entire body from `await nt.login()` to `return` with a second try/finally that calls `nt.close()`.

After applying Steps 2-4, the structure of `runCensus` will be:

```ts
  const nt = new NtBrowser();
  await nt.launch();
  try {
    await nt.login();
    log('WARNING: ...');
    const rosterAtStart = await nt.fetchRoster();
    // ... rest of function body ...
    try {
      // batch loop (while true)
    } finally {
      // cleanup dismiss
    }
    await db.update(censusRuns)...
    log(...);
    return { runId, captured, failed };
  } finally {
    await nt.close();
  }
```

Add `  } finally {` and `    await nt.close();` and `  }` just before the closing `}` of `runCensus`.

- [ ] **Step 6: Update `safeDismiss` and `abort` helper signatures**

Current `safeDismiss` (around line ~105):
```ts
async function safeDismiss(session: BbWebSession, playerId: number, log: Log) {
  try { await dismissPlayer(session, playerId); } catch (e) { log(`dismiss ${playerId} failed: ${e}`); }
}
```
Replace with:
```ts
async function safeDismiss(nt: NtBrowser, playerId: number, log: Log) {
  try { await nt.dismiss(playerId); } catch (e) { log(`dismiss ${playerId} failed: ${e}`); }
}
```

Current `abort` (around line ~108):
```ts
async function abort(session: BbWebSession, runId: number, batchIds: number[], log: Log) {
  for (const id of batchIds) { await safeDismiss(session, id, log); await mark(runId, id, 'failed', 'aborted-mid-batch'); }
  await db.update(censusRuns).set({ status: 'aborted', finishedAt: new Date() }).where(eq(censusRuns.id, runId));
}
```
Replace with:
```ts
async function abort(nt: NtBrowser, runId: number, batchIds: number[], log: Log) {
  for (const id of batchIds) { await safeDismiss(nt, id, log); await mark(runId, id, 'failed', 'aborted-mid-batch'); }
  await db.update(censusRuns).set({ status: 'aborted', finishedAt: new Date() }).where(eq(censusRuns.id, runId));
}
```

Also update the resume cleanup call site (around line ~44):
```ts
    for (const it of lingering) { await safeDismiss(session, it.playerId, log); await mark(runId, it.playerId, 'failed', 'crash-recovered: dismissed without capturing skills'); await sleep(); }
```
Replace with:
```ts
    for (const it of lingering) { await safeDismiss(nt, it.playerId, log); await mark(runId, it.playerId, 'failed', 'crash-recovered: dismissed without capturing skills'); await sleep(); }
```

- [ ] **Step 7: Remove unused `players` import if present**

Run a quick check — the `players` table import from `@/db` was present but not used in run.ts (it may have been there already). If `npx tsc --noEmit` reports it, remove it. Do NOT remove it if TS doesn't complain (it may be used via the SQL query).

---

### Task 3: Delete `nt-roster.ts` and verify

**Files:**
- Delete: `v2/src/server/bb/nt-roster.ts`

- [ ] **Step 1: Confirm no remaining importers**

```powershell
Select-String -Path "D:\ClaudeProjects\BB-project\v2\src" -Pattern "nt-roster" -Recurse
```

Expected: zero matches (we already changed `run.ts`; `card-parser.test.ts` only mentioned `jnt-roster.html` fixture, not the `.ts` module).

- [ ] **Step 2: Delete the file**

```powershell
Remove-Item "D:\ClaudeProjects\BB-project\v2\src\server\bb\nt-roster.ts"
```

---

### Task 4: Full typecheck and build

**Files:** (no changes — verification only)

- [ ] **Step 1: Full TypeScript typecheck**

```powershell
cd D:\ClaudeProjects\BB-project\v2
npx tsc --noEmit --skipLibCheck 2>&1
```

Expected: zero errors. Fix any that appear before proceeding.

- [ ] **Step 2: Run all tests**

```powershell
cd D:\ClaudeProjects\BB-project\v2
npm test 2>&1
```

Expected: 131 tests pass, 0 failures. The tests do NOT exercise `NtBrowser` (it's browser-only, not unit-tested here). If any pre-existing test breaks, investigate — the rewire in `run.ts` should not affect any test because `runCensus` is not tested in the unit suite (it hits the real DB + network).

- [ ] **Step 3: Next.js build**

```powershell
cd D:\ClaudeProjects\BB-project\v2
npm run build 2>&1
```

Expected: build succeeds. `nt-browser.ts` is only imported by `census/run.ts` which is only used from `scripts/census.mts` (a CLI script, not a page/route), so it should not be bundled into the Next.js app and should not cause browser-target errors. If it does, add `'use server'` or move the import behind a dynamic require — but this should not be necessary.

---

### Task 5: Commit and push

- [ ] **Step 1: Stage only the v2/src directory**

```powershell
cd D:\ClaudeProjects\BB-project
git add v2/src
git status
```

Expected: shows `v2/src/server/bb/nt-browser.ts` (new), `v2/src/server/census/run.ts` (modified), `v2/src/server/bb/nt-roster.ts` (deleted).

- [ ] **Step 2: Commit**

```powershell
git commit -m "$(cat <<'EOF'
feat(v2): drive NT recruit/dismiss via Playwright (raw-HTTP postback unreplayable)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

On PowerShell (no heredoc), use:
```powershell
git commit -m "feat(v2): drive NT recruit/dismiss via Playwright (raw-HTTP postback unreplayable)`n`nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Push**

```powershell
git push
```

Expected: push succeeds; Vercel auto-deploys (census CLI is not a Vercel route, so deploy is safe).

---

## Self-Review

**Spec coverage:**
- `nt-browser.ts` created with all methods: launch, login, recruit, dismiss, fetchRoster, close ✓
- `run.ts` rewired: session→nt, fetchNtRoster→fetchRoster, recruitPlayer→recruit, dismissPlayer→dismiss ✓
- `safeDismiss`/`abort` signatures updated ✓
- `nt.close()` called in top-level finally ✓
- Resume cleanup (lingering loop) updated ✓
- `nt-roster.ts` deleted after confirming no other importers ✓
- No live actions taken ✓
- `npm run build` + `npm test` in verification task ✓
- `playwright install chromium` in Task 1 ✓
- Commit message matches spec exactly ✓

**Placeholder scan:** No TBDs, no "similar to Task N", all code shown in full.

**Type consistency:** `NtBrowser` used consistently. `safeDismiss(nt: NtBrowser, ...)` and `abort(nt: NtBrowser, ...)` match call sites `safeDismiss(nt, ...)` and `abort(nt, ...)`.
