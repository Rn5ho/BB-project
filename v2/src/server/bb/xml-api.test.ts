import { describe, it, expect } from 'vitest';
import { parseSeasonsXml, parseCountriesXml } from './xml-api';

const seasonsXml = `<?xml version='1.0'?><bbapi version='1'><seasons retrieved='x'>
  <season id='71'><start>2026-01-20T14:23:23Z</start><finish>2026-04-29T12:44:39Z</finish></season>
  <season id='72'><start>2026-04-29T12:44:39Z</start><inProgress/></season>
</seasons></bbapi>`;

describe('parseSeasonsXml', () => {
  const seasons = parseSeasonsXml(seasonsXml);
  it('parses finished seasons', () => {
    expect(seasons[0]).toEqual({ id: 71, start: new Date('2026-01-20T14:23:23Z'), finish: new Date('2026-04-29T12:44:39Z') });
  });
  it('parses the in-progress season with null finish', () => {
    expect(seasons[1].id).toBe(72);
    expect(seasons[1].finish).toBeNull();
  });
  it('throws on empty/garbage xml', () => expect(() => parseSeasonsXml('<bbapi/>')).toThrow());
});

const countriesXml = `<?xml version='1.0'?><bbapi version='1'><countries retrieved='x'>
  <country id='66' divisions='4' firstSeason='3' users='175'>Slovenija</country>
  <country id='7' divisions='5' firstSeason='1' users='1227'>España</country>
</countries></bbapi>`;

describe('parseCountriesXml', () => {
  const countries = parseCountriesXml(countriesXml);
  it('parses id + name', () => expect(countries).toEqual([
    { id: 66, name: 'Slovenija' },
    { id: 7, name: 'España' },
  ]));
  it('throws on garbage', () => expect(() => parseCountriesXml('<bbapi/>')).toThrow());
});
