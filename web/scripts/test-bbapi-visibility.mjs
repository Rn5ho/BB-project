// Temp research script: which rosters return full skills via BB API?
// Usage: node scripts/test-bbapi-visibility.mjs [teamId ...]
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const BASE = 'https://bbapi.buzzerbeater.com';
const login = await fetch(
  `${BASE}/login.aspx?login=${encodeURIComponent(env.BB_API_USERNAME)}&code=${encodeURIComponent(env.BB_API_SECURITY_CODE)}`,
  { redirect: 'manual' }
);
const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
const loginBody = await login.text();
if (!cookie || loginBody.includes('<error')) {
  console.log('LOGIN FAILED:', loginBody.slice(0, 300));
  process.exit(1);
}
console.log('login OK');

async function get(endpoint, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/${endpoint}${qs ? '?' + qs : ''}`, { headers: { Cookie: cookie } });
  return res.text();
}

function summarizeRoster(xml, label) {
  const err = xml.match(/<error[^>]*>/);
  if (err) return console.log(`${label}: ERROR ${err[0]}`);
  const teamName = xml.match(/teamName>([^<]+)</)?.[1] ?? xml.match(/teamname="([^"]+)"/)?.[1] ?? '?';
  const players = xml.match(/<player /g)?.length ?? 0;
  const withSkills = xml.match(/<jumpShot>/g)?.length ?? 0;
  const first = xml.slice(xml.indexOf('<player '), xml.indexOf('<player ') + 1400);
  console.log(`\n=== ${label} | team: ${teamName} | players: ${players} | players with <jumpShot>: ${withSkills}`);
  console.log('first player XML snippet:\n' + first.replace(/\s+/g, ' ').slice(0, 1200));
}

// 0. Who am I / which team?
const info = await get('teaminfo.aspx');
console.log('teaminfo snippet:', info.replace(/\s+/g, ' ').slice(info.indexOf('<team'), info.indexOf('<team') + 600));

// 1. Own team (default)
summarizeRoster(await get('roster.aspx'), 'OWN TEAM (default)');

// 2. Any team IDs passed on CLI (e.g. Slovenia U21 NT id, a random foreign club)
for (const id of process.argv.slice(2)) {
  summarizeRoster(await get('roster.aspx', { teamid: id }), `TEAM ${id}`);
}

await get('logout.aspx');
console.log('\nlogout OK');
