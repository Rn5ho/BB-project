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
    // Use the dedicated /login.aspx page where the form is the visible content
    // (the header widget on default.aspx exists in the DOM but is hidden).
    await this.page.goto(`${BASE}/login.aspx`, { waitUntil: 'domcontentloaded' });
    await this.page.fill('#cphContent_txtUserName', user);
    await this.page.fill('#cphContent_txtPassword', pass);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
      this.page.click('#cphContent_btnLoginUser'),
    ]);
    // verify: a logged-in page should not show the login form
    if (await this.page.locator('#cphContent_txtPassword').count() > 0) {
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
