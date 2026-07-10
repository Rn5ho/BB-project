// buzzerbeater.com WEBSITE session (not the APIs) — plain-HTTP ASP.NET login + postbacks.
// Verified 2026-07-10: login POST → 302 /home.aspx with .ASPXAUTH2 cookie. Reused by the census (Phase 4).

const BASE = 'https://www.buzzerbeater.com';

export function collectHiddenFields(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of html.matchAll(/<input type="hidden" name="(__[A-Z][A-Za-z]*|ctl00\$cphContent\$hdn[A-Za-z]*)"[^>]*value="([^"]*)"/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

/** Selected (or first) option per select + current value per text input, for ctl00$cphContent$ fields. */
export function collectFormFields(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of html.matchAll(/<select name="(ctl00\$cphContent\$[^"]+)"[\s\S]*?<\/select>/g)) {
    const sel = m[0].match(/<option selected="selected" value="([^"]*)"/);
    out[m[1]] = sel ? sel[1] : (m[0].match(/<option value="([^"]*)"/)?.[1] ?? '');
  }
  for (const m of html.matchAll(/<input[^>]*name="(ctl00\$cphContent\$tb[^"]+)"([^>]*)/g)) {
    out[m[1]] = m[2].match(/value="([^"]*)"/)?.[1] ?? '';
  }
  return out;
}

export class BbWebSession {
  private jar = new Map<string, string>();

  private cookieHeader(): string {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  private store(res: Response): void {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(';');
      const i = pair.indexOf('=');
      this.jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
  }

  async get(path: string): Promise<string> {
    const res = await fetch(`${BASE}${path}`, { headers: { Cookie: this.cookieHeader() }, redirect: 'manual' });
    this.store(res);
    if (res.status >= 300 && res.status < 400) return this.get(res.headers.get('location')!);
    if (!res.ok) throw new Error(`BB web GET ${path}: HTTP ${res.status}`);
    return res.text();
  }

  /** POST a form; returns the response body (follows one redirect). */
  async post(path: string, fields: Record<string, string>): Promise<string> {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      redirect: 'manual',
      headers: { Cookie: this.cookieHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    });
    this.store(res);
    if (res.status >= 300 && res.status < 400) return this.get(res.headers.get('location')!);
    if (!res.ok) throw new Error(`BB web POST ${path}: HTTP ${res.status}`);
    return res.text();
  }

  async login(): Promise<void> {
    const user = process.env.BB_WEB_USERNAME || process.env.BB_API_USERNAME;
    const pass = process.env.BB_WEB_PASSWORD;
    if (!user || !pass) throw new Error('BB_WEB_USERNAME/BB_WEB_PASSWORD not configured');
    const loginPage = await this.get('/default.aspx');
    const body = await this.post('/default.aspx', {
      ...collectHiddenFields(loginPage),
      __EVENTTARGET: 'ctl00$btnLogin',
      __EVENTARGUMENT: '',
      timeOffset: '-120',
      'ctl00$txtLoginUserName': user,
      'ctl00$txtLoginPassword': pass,
      'ctl00$isFbLogin': '',
    });
    if (!this.jar.has('.ASPXAUTH2')) {
      throw new Error(`BB web login failed (no auth cookie). Page head: ${body.slice(0, 200)}`);
    }
  }
}
