// READ-ONLY research fetch: Season 73 news + announcement threads via logged-in BbWebSession.
// Only GETs pages; never posts any form/action.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { BbWebSession } from '../../src/server/bb/web-session';

const OUT = process.env.S73_OUT_DIR!;
mkdirSync(OUT, { recursive: true });

const session = new BbWebSession();
await session.login();
console.log('logged in');

const pages: [string, string][] = JSON.parse(process.env.S73_PAGES!);
for (const [name, path] of pages) {
  try {
    const html = await session.get(path);
    writeFileSync(join(OUT, name), html);
    console.log(name, html.length);
  } catch (e) {
    console.log(name, 'FAILED', (e as Error).message);
  }
}
