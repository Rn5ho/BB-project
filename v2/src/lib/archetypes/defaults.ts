import type { DefaultArchetype } from './types';

export const DEFAULT_ARCHETYPES: DefaultArchetype[] = [
  { key: 'defensive-center', name: 'Defensive Center', description: 'Rim protector: inside D, blocks, boards; low scoring.',
    rules: { conditions: [
      { kind: 'field', field: 'inside_def', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 15 } },
      { kind: 'field', field: 'shot_blocking', op: '>=', byAge: { 18: 6, 19: 10, 20: 13, 21: 14 } },
      { kind: 'field', field: 'rebounding', op: '>=', byAge: { 18: 6, 19: 8, 20: 11, 21: 13 } },
      { kind: 'field', field: 'inside_shot', op: '<=', byAge: { 18: 4, 19: 5, 20: 6, 21: 7 } },
      { kind: 'field', field: 'height_cm', op: '>=', byAge: { 18: 205, 19: 205, 20: 205, 21: 205 } },
      { kind: 'field', field: 'potential', op: '>=', byAge: { 18: 8, 19: 8, 20: 8, 21: 8 } },
    ] } },
  { key: 'scoring-center', name: 'Scoring Center', description: 'Post scorer: inside shot + boards.',
    rules: { conditions: [
      { kind: 'field', field: 'inside_shot', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 15 } },
      { kind: 'field', field: 'rebounding', op: '>=', byAge: { 18: 6, 19: 8, 20: 10, 21: 12 } },
      { kind: 'field', field: 'height_cm', op: '>=', byAge: { 18: 203, 19: 203, 20: 203, 21: 203 } },
      { kind: 'field', field: 'potential', op: '>=', byAge: { 18: 8, 19: 8, 20: 8, 21: 8 } },
    ] } },
  { key: 'two-way-big', name: 'Two-Way Big', description: 'Balanced big: scores and defends inside.',
    rules: { conditions: [
      { kind: 'field', field: 'inside_shot', op: '>=', byAge: { 18: 5, 19: 8, 20: 10, 21: 12 } },
      { kind: 'field', field: 'inside_def', op: '>=', byAge: { 18: 5, 19: 8, 20: 10, 21: 12 } },
      { kind: 'field', field: 'rebounding', op: '>=', byAge: { 18: 6, 19: 8, 20: 10, 21: 12 } },
      { kind: 'field', field: 'height_cm', op: '>=', byAge: { 18: 203, 19: 203, 20: 203, 21: 203 } },
    ] } },
  { key: 'playmaker', name: 'Playmaker', description: 'Floor general: passing, handling, driving.',
    rules: { conditions: [
      { kind: 'position', op: 'is', positions: ['PG', 'SG'] },
      { kind: 'field', field: 'passing', op: '>=', byAge: { 18: 5, 19: 8, 20: 11, 21: 13 } },
      { kind: 'field', field: 'handling', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 14 } },
      { kind: 'field', field: 'driving', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 14 } },
    ] } },
  { key: 'scoring-guard', name: 'Scoring Guard', description: 'Shot creation: jump shot, range, driving.',
    rules: { conditions: [
      { kind: 'field', field: 'jump_shot', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 14 } },
      { kind: 'field', field: 'jump_range', op: '>=', byAge: { 18: 5, 19: 8, 20: 11, 21: 13 } },
      { kind: 'field', field: 'driving', op: '>=', byAge: { 18: 6, 19: 9, 20: 11, 21: 13 } },
    ] } },
  { key: '3-and-d-wing', name: '3&D Wing', description: 'Shoots and defends the perimeter.',
    rules: { conditions: [
      { kind: 'field', field: 'jump_shot', op: '>=', byAge: { 18: 6, 19: 9, 20: 11, 21: 13 } },
      { kind: 'field', field: 'jump_range', op: '>=', byAge: { 18: 5, 19: 8, 20: 10, 21: 12 } },
      { kind: 'field', field: 'outside_def', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 14 } },
    ] } },
  { key: 'slasher', name: 'Slasher', description: 'Attacks the rim: driving + handling.',
    rules: { conditions: [
      { kind: 'field', field: 'driving', op: '>=', byAge: { 18: 7, 19: 10, 20: 13, 21: 15 } },
      { kind: 'field', field: 'handling', op: '>=', byAge: { 18: 6, 19: 9, 20: 11, 21: 13 } },
    ] } },
  { key: 'sharpshooter', name: 'Sharpshooter', description: 'Elite shooter: jump shot + range + FT.',
    rules: { conditions: [
      { kind: 'field', field: 'jump_shot', op: '>=', byAge: { 18: 7, 19: 10, 20: 13, 21: 16 } },
      { kind: 'field', field: 'jump_range', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 15 } },
      { kind: 'field', field: 'free_throw', op: '>=', byAge: { 18: 5, 19: 7, 20: 9, 21: 11 } },
    ] } },
];
