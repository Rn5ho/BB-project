import { db, players, snapshots, syncLog } from '@/db';
import { BbWebSession, collectHiddenFields, collectFormFields } from '@/server/bb/web-session';
import { parsePlayerCards, parsePageHeader, parseResultsTotal, type ParsedCard } from '@/server/bb/card-parser';
import { getCountriesCatalog } from './countries';
import { getCurrentSeasonId } from '@/queries/players';
import { utcDayKey } from './players';
import { sql, inArray, and, eq, gte } from 'drizzle-orm';

// Sweep scope — tune here.
const MIN_AGE = '18';
const MAX_AGE = '21';
const MIN_POTENTIAL = '6'; // allstar; below is NT-irrelevant (spec §6)
const SORT_NEWEST_FIRST = '2'; // "Auction Time Reversed" — fixed 72h auctions ⇒ newest listings end last
const STALE_AFTER_HOURS = 30; // seen by yesterday's sweep
const MAX_PAGES = Number(process.env.MARKET_MAX_PAGES ?? 90);

export function listedAgoHours(auctionEnds: Date, asOf: Date): number {
  const hoursLeft = (auctionEnds.getTime() - asOf.getTime()) / 3600_000;
  return 72 - hoursLeft;
}

export function pageIsStale(cards: Pick<ParsedCard, 'auctionEnds'>[], asOf: Date, thresholdHours: number): boolean {
  if (cards.length === 0) return true;
  return cards.every((c) => c.auctionEnds !== null && listedAgoHours(c.auctionEnds, asOf) > thresholdHours);
}

export interface MarketSweepCounts {
  pagesRead: number;
  totalListed: number;
  cardsParsed: number;
  newPlayers: number;
  snapshotsInserted: number;
  snapshotsUpdated: number;
  stoppedEarly: boolean;
  hitPageCap: boolean;
}

export async function runMarketSweep(opts: { fullSweep?: boolean } = {}, trigger: 'cron' | 'manual' = 'manual'): Promise<MarketSweepCounts> {
  const [logRow] = await db.insert(syncLog).values({ jobType: 'market', trigger }).returning({ id: syncLog.id });
  try {
    const session = new BbWebSession();
    await session.login();

    // search
    const formPage = await session.get('/manage/transferlist.aspx');
    const fields = collectFormFields(formPage);
    fields['ctl00$cphContent$tbMinAge'] = MIN_AGE;
    fields['ctl00$cphContent$tbMaxAge'] = MAX_AGE;
    fields['ctl00$cphContent$ddlPotentialMin'] = MIN_POTENTIAL;
    fields['ctl00$cphContent$ddlsortBy'] = SORT_NEWEST_FIRST;
    let page = await session.post('/manage/transferlist.aspx', {
      ...collectHiddenFields(formPage),
      ...fields,
      'ctl00$cphContent$btnSearch': 'Search',
    });

    const totalListed = parseResultsTotal(page);
    const counts: MarketSweepCounts = {
      pagesRead: 0, totalListed, cardsParsed: 0, newPlayers: 0,
      snapshotsInserted: 0, snapshotsUpdated: 0, stoppedEarly: false, hitPageCap: false,
    };

    const allCards = new Map<number, { card: ParsedCard; asOf: Date }>();
    let staleStreak = 0;
    for (let p = 0; p < MAX_PAGES; p++) {
      const asOf = parsePageHeader(page);
      const cards = parsePlayerCards(page);
      counts.pagesRead++;
      counts.cardsParsed += cards.length;
      for (const c of cards) allCards.set(c.bbPlayerId, { card: c, asOf });

      const reachedEnd = counts.pagesRead * 10 >= totalListed || cards.length === 0;
      if (reachedEnd) break;
      if (!opts.fullSweep && pageIsStale(cards, asOf, STALE_AFTER_HOURS)) {
        staleStreak++;
        if (staleStreak >= 2) { counts.stoppedEarly = true; break; } // 1 overlap page after the first stale one
      } else {
        staleStreak = 0;
      }

      page = await session.post('/manage/transferlist.aspx', {
        ...collectHiddenFields(page),
        ...collectFormFields(page),
        'ctl00$cphContent$btnNextPage': 'Next Page',
      });
      await new Promise((r) => setTimeout(r, 400)); // polite pacing
    }
    if (counts.pagesRead >= MAX_PAGES) counts.hitPageCap = true;

    // persist
    const catalog = await getCountriesCatalog();
    const countryIdOf = new Map(catalog.map((c) => [c.name, c.id]));
    const season = await getCurrentSeasonId();
    const ids = [...allCards.keys()];
    if (ids.length > 0) {
      const existing = await db.select({ id: players.bbPlayerId }).from(players).where(inArray(players.bbPlayerId, ids));
      const existingIds = new Set(existing.map((e) => e.id));
      counts.newPlayers = ids.length - existingIds.size;

      // new players: full identity from card; existing: refresh owner only
      const newRows = [...allCards.values()].filter(({ card }) => !existingIds.has(card.bbPlayerId)).map(({ card }) => ({
        bbPlayerId: card.bbPlayerId,
        name: card.name,
        countryId: card.nationality ? countryIdOf.get(card.nationality) ?? null : null,
        nationality: card.nationality,
        heightCm: card.heightCm,
        bestPosition: card.position,
        ownerTeamId: card.ownerTeamId,
        ownerTeamName: card.ownerTeamName,
      }));
      for (const chunk of chunks(newRows, 500)) await db.insert(players).values(chunk).onConflictDoNothing();
      for (const { card } of [...allCards.values()].filter(({ card }) => existingIds.has(card.bbPlayerId))) {
        if (card.ownerTeamId != null) {
          await db.update(players)
            .set({ ownerTeamId: card.ownerTeamId, ownerTeamName: card.ownerTeamName })
            .where(and(eq(players.bbPlayerId, card.bbPlayerId), sql`owner_team_id is distinct from ${card.ownerTeamId}`));
        }
      }

      // market snapshots — one per player per UTC day (delete+bulk-reinsert)
      const todayStart = new Date(`${utcDayKey(new Date())}T00:00:00Z`);
      const todays = await db.select({ id: snapshots.id }).from(snapshots)
        .where(and(eq(snapshots.source, 'market'), gte(snapshots.capturedAt, todayStart), inArray(snapshots.playerId, ids)));
      if (todays.length > 0) await db.delete(snapshots).where(inArray(snapshots.id, todays.map((t) => t.id)));
      counts.snapshotsUpdated = todays.length;

      const snapRows = [...allCards.values()].map(({ card, asOf }) => ({
        playerId: card.bbPlayerId,
        source: 'market' as const,
        season,
        age: card.age,
        gameShape: card.gameShape,
        salary: card.salary,
        potential: card.potential,
        experience: card.experience,
        jumpShot: card.skills.jump_shot ?? null, jumpRange: card.skills.jump_range ?? null,
        outsideDef: card.skills.outside_def ?? null, handling: card.skills.handling ?? null,
        driving: card.skills.driving ?? null, passing: card.skills.passing ?? null,
        insideShot: card.skills.inside_shot ?? null, insideDef: card.skills.inside_def ?? null,
        rebounding: card.skills.rebounding ?? null, shotBlocking: card.skills.shot_blocking ?? null,
        stamina: card.skills.stamina ?? null, freeThrow: card.skills.free_throw ?? null,
        tsp: card.tsp,
        ownerTeamId: card.ownerTeamId,
        ownerTeamName: card.ownerTeamName,
        startingPrice: card.price,
        auctionEndsAt: card.auctionEnds ? new Date(Date.now() + (card.auctionEnds.getTime() - asOf.getTime())) : null,
        isRookieListing: card.isRookie,
      }));
      for (const chunk of chunks(snapRows, 500)) await db.insert(snapshots).values(chunk);
      counts.snapshotsInserted = snapRows.length - counts.snapshotsUpdated;
    }

    await db.update(syncLog).set({ finishedAt: new Date(), ok: true, counts }).where(sql`id = ${logRow.id}`);
    return counts;
  } catch (e) {
    await db.update(syncLog).set({ finishedAt: new Date(), ok: false, error: String(e) }).where(sql`id = ${logRow.id}`);
    throw e;
  }
}

function chunks<T>(arr: T[], n: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
}
