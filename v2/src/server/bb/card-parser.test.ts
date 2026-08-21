import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parsePlayerCards, parsePageHeader, parseResultsTotal } from './card-parser';

const p1 = readFileSync(new URL('./__fixtures__/transferlist-pot6-p1.html', import.meta.url), 'utf8');
const p2 = readFileSync(new URL('./__fixtures__/transferlist-pot6-p2.html', import.meta.url), 'utf8');
const roster = readFileSync(new URL('./__fixtures__/jnt-roster.html', import.meta.url), 'utf8');
const seniorP1 = readFileSync(new URL('./__fixtures__/transferlist-seniornt-p1.html', import.meta.url), 'utf8');

describe('parsePageHeader', () => {
  it('parses the as-of timestamp', () => {
    const asOf = parsePageHeader(p1);
    expect(asOf.getMonth()).toBe(6); // July (0-based)
    expect(asOf.getDate()).toBe(10);
    expect(asOf.getFullYear()).toBe(2026);
    expect(asOf.getHours()).toBe(17); // 5:43 PM
    expect(asOf.getMinutes()).toBe(43);
  });
});

describe('parseResultsTotal', () => {
  it('reads the total from the Showing line', () => expect(parseResultsTotal(p1)).toBe(842));
});

describe('parsePlayerCards — first card of page 1', () => {
  const cards = parsePlayerCards(p1);
  const c = cards[0];
  it('parses 10 cards per page', () => expect(cards.length).toBe(10));
  it('identity', () => {
    expect(c.bbPlayerId).toBe(54971768);
    expect(c.name).toBe('Giovanbattista Lischi'); // &nbsp; normalized
    expect(c.position).toBe('PG'); // "Point Guard"
  });
  it('meta', () => {
    expect(c.age).toBe(21);
    expect(c.heightCm).toBe(185);
    expect(c.potential).toBe(7); // title attr of the potential link
    expect(c.gameShape).toBe(9);
    expect(c.salary).toBe(15843);
    expect(c.experience).not.toBeNull();
  });
  it('market fields', () => {
    expect(c.price).toBe(365000); // "Current Bid: $ 365 000"
    expect(c.ownerTeamId).toBe(45370);
    expect(c.ownerTeamName).toBe('3L Arredamenti');
    expect(c.auctionEnds).toBeInstanceOf(Date);
    // ends ~3 minutes after the page asOf (5:45:55 PM vs 5:43:11 PM)
    expect(c.auctionEnds!.getTime() - parsePageHeader(p1).getTime()).toBeGreaterThan(0);
    expect(c.auctionEnds!.getTime() - parsePageHeader(p1).getTime()).toBeLessThan(10 * 60 * 1000);
  });
  it('skills from title attrs', () => {
    expect(c.skills.jump_shot).toBe(14);
    expect(c.skills.jump_range).toBe(10);
    expect(c.skills.outside_def).toBe(13);
    expect(c.skills.handling).toBe(10);
    expect(c.skills.driving).toBe(14);
    // remaining 7 skills: assert non-null and within 1..20
    for (const v of Object.values(c.skills)) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(20);
    }
  });
  // Fixture ground truth: first card (Giovanbattista Lischi, player 54971768) TSP = 95
  it('tsp', () => expect(c.tsp).toBe(95));
  // Fixture ground truth: nationality flag id="nationalFlag_0" title="Italia"
  it('nationality', () => expect(c.nationality).toBe('Italia'));
  it('not a rookie (first card has no Rookie badge)', () => expect(c.isRookie).toBe(false));
  it('all cards have 12 skills', () => {
    for (const card of cards) expect(Object.keys(card.skills).length).toBe(12);
  });
  it('page 2 parses too and differs', () => {
    const cards2 = parsePlayerCards(p2);
    expect(cards2.length).toBe(10);
    expect(cards2[0].bbPlayerId).not.toBe(c.bbPlayerId);
  });
  it('rookie flag detected on cards that carry the Rookie badge', () => {
    // Cards 1 (España), 5 (USA), 6 (Eesti), 9 (Rossiya) in p1 have class="drafteeLabel">Rookie</span>
    expect(cards[1].isRookie).toBe(true);
    expect(cards[5].isRookie).toBe(true);
    expect(cards[6].isRookie).toBe(true);
    expect(cards[9].isRookie).toBe(true);
  });
});

describe('parsePlayerCards — senior NT search (age 22+, IsOnNT; captured live 2026-08-21)', () => {
  const cards = parsePlayerCards(seniorP1);
  const c = cards[0];
  it('reads the total from the Showing line', () => expect(parseResultsTotal(seniorP1)).toBe(58));
  it('parses the as-of header (forward-slash dates)', () => {
    const asOf = parsePageHeader(seniorP1); // "8/21/2026 12:25:09 PM"
    expect(asOf.getMonth()).toBe(7); // August (0-based)
    expect(asOf.getDate()).toBe(21);
    expect(asOf.getFullYear()).toBe(2026);
    expect(asOf.getHours()).toBe(12);
    expect(asOf.getMinutes()).toBe(25);
  });
  it('parses 10 cards per page', () => expect(cards.length).toBe(10));
  it('identity', () => {
    expect(c.bbPlayerId).toBe(50885354);
    expect(c.name).toBe('Julio Naizaque'); // &nbsp; normalized
    expect(c.position).toBe('PG'); // "Point Guard"
    expect(c.nationality).toBe('Venezuela');
  });
  it('meta — senior ages parse', () => {
    expect(c.age).toBe(34);
    expect(c.heightCm).toBe(188);
    expect(c.potential).toBe(10); // hall of famer
    expect(c.gameShape).toBe(7);
    expect(c.salary).toBe(230033);
    expect(c.experience).toBe(16);
    for (const card of cards) expect(card.age).toBeGreaterThanOrEqual(22);
  });
  it('market fields', () => {
    expect(c.price).toBe(1000); // "Starting Price: $ 1 000" — no bid yet
    expect(c.ownerTeamId).toBe(71493);
    expect(c.ownerTeamName).toBe('Ataköy');
    expect(c.auctionEnds).toBeInstanceOf(Date);
  });
  it('internal skills ABOVE 20 parse from title attrs (display clamps at legendary)', () => {
    // e.g. Outside Def.: class="lev20" but title="22" — the title carries the true level
    expect(c.skills.outside_def).toBe(22);
    expect(c.skills.handling).toBe(24);
    expect(c.skills.driving).toBe(24);
    expect(c.skills.free_throw).toBe(31);
  });
  it('remaining skills + tsp', () => {
    expect(c.skills.jump_shot).toBe(20);
    expect(c.skills.jump_range).toBe(11);
    expect(c.skills.passing).toBe(12);
    expect(c.skills.inside_shot).toBe(13);
    expect(c.skills.inside_def).toBe(9);
    expect(c.skills.rebounding).toBe(5);
    expect(c.skills.shot_blocking).toBe(8);
    expect(c.skills.stamina).toBe(8);
    expect(Object.keys(c.skills).length).toBe(12);
    expect(c.tsp).toBe(148); // "TSP: <b>148</b> (113 + 35)"
  });
  it('no senior is a rookie', () => {
    for (const card of cards) expect(card.isRookie).toBe(false);
  });
});

describe('parsePlayerCards — NT roster page (Repeater1 markup)', () => {
  const cards = parsePlayerCards(roster);
  it('parses all 14 rostered players', () => expect(cards.length).toBe(14));
  it('reads identity from the Repeater1 anchor', () => {
    const c = cards.find((x) => x.bbPlayerId === 55158715)!;
    expect(c).toBeDefined();
    expect(c.name).toBe('Milan Peterec');
  });
  it('reads full skills + tsp on roster cards', () => {
    const c = cards.find((x) => x.bbPlayerId === 55158715)!;
    expect(Object.keys(c.skills).length).toBe(12);
    expect(c.skills.jump_shot).toBe(11); // "prolific (11)"
    expect(c.tsp).toBe(91);
    for (const v of Object.values(c.skills)) { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(20); }
  });
  it('roster cards have no auction fields', () => {
    const c = cards.find((x) => x.bbPlayerId === 55158715)!;
    expect(c.auctionEnds).toBeNull();
    expect(c.price).toBeNull();
  });
});

describe('parsePlayerCards — top-tier "N+" nomenclature titles', () => {
  // BB renders the top tier of a nomenclature as "N+" in the title attr (verified live:
  // all-time great potential = title="10+"). A synthetic card exercises the convention.
  const card = `
    <a id="cphContent_rptListedPlayers_hlPlayerDetails_0" href="/player/999/overview.aspx">Top Tier</a>
    Age: 18
    Potential: <a id="x" class="lev17" title="10+" href="/community/rules.aspx?nav=Nomenclature#Potential">all-time great</a>
    Game Shape: <a id="x" title="7" href="#">strong</a>
    Jump Shot: <a id="x" title="19+" href="#">legendary</a>
    Handling: <a id="x" title="12" href="#">sensational</a>
  `;
  const [c] = parsePlayerCards(card);
  it('potential "10+" → 11 (all-time great)', () => expect(c.potential).toBe(11));
  it('skill "19+" → 20 (legendary)', () => expect(c.skills.jump_shot).toBe(20));
  it('plain numeric titles unchanged', () => {
    expect(c.gameShape).toBe(7);
    expect(c.skills.handling).toBe(12);
  });
});
