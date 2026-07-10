import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parsePlayerCards, parsePageHeader, parseResultsTotal } from './card-parser';

const p1 = readFileSync(new URL('./__fixtures__/transferlist-pot6-p1.html', import.meta.url), 'utf8');
const p2 = readFileSync(new URL('./__fixtures__/transferlist-pot6-p2.html', import.meta.url), 'utf8');
const roster = readFileSync(new URL('./__fixtures__/jnt-roster.html', import.meta.url), 'utf8');

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
