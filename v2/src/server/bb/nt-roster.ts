// U-21 NT roster actions on buzzerbeater.com. WRITE actions (recruit/dismiss) mutate the
// user's real NT roster — only the census CLI calls these, under supervision.
// Verified controls (2026-07-10): recruit confirm = ctl00$cphContent$btnRecruitYes2,
// dismiss confirm = ctl00$cphContent$btnDismissYes2, both on the player's overview page.

import { BbWebSession, collectHiddenFields } from './web-session';
import { parsePlayerCards, type ParsedCard } from './card-parser';

const SLOVENIA_JNT = '/country/66/jnt/players.aspx';

export async function fetchNtRoster(session: BbWebSession): Promise<ParsedCard[]> {
  const html = await session.get(SLOVENIA_JNT);
  return parsePlayerCards(html);
}

/** POST a confirm postback on the player's overview page. Returns the resulting HTML. */
async function playerPostback(session: BbWebSession, playerId: number, target: string): Promise<string> {
  const path = `/player/${playerId}/overview.aspx`;
  const page = await session.get(path);
  return session.post(path, {
    ...collectHiddenFields(page),
    __EVENTTARGET: target,
    __EVENTARGUMENT: '',
  });
}

/** Call a player up to the U-21 NT roster. Throws if the player is not recruitable. */
export async function recruitPlayer(session: BbWebSession, playerId: number): Promise<void> {
  const result = await playerPostback(session, playerId, 'ctl00$cphContent$btnRecruitYes2');
  // success = the page now shows the Dismiss control for this player
  if (!/btnNTDismiss2|currently on your national team roster/i.test(result)) {
    throw new Error(`recruit ${playerId}: no confirmation of roster membership in response`);
  }
  if (/btnNTRecruit2/i.test(result)) {
    throw new Error(`recruit ${playerId}: recruit button still present — likely already rostered by another process`);
  }
}

/** Dismiss a player from the U-21 NT roster. Throws if not confirmed removed. */
export async function dismissPlayer(session: BbWebSession, playerId: number): Promise<void> {
  const result = await playerPostback(session, playerId, 'ctl00$cphContent$btnDismissYes2');
  if (/btnNTDismiss2|currently on your national team roster/i.test(result)) {
    throw new Error(`dismiss ${playerId}: player still appears rostered after dismiss`);
  }
}
