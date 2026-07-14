// U-21 archetype plan templates (user conventions) + senior references
// (docs/research/training/user-notes/in-depth-guide-extraction.md). Data only.
export interface PlanTemplate {
  key: string; name: string; forType: 'outside' | 'big' | 'any';
  blocks: Array<{ trainingId: number; weeks: number }>;
  description: string;
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    key: 'u21-outside-draftee', name: 'U-21 outside draftee', forType: 'outside',
    description: '1on1 guards ~1.5 seasons, then OD / JS / JR / PA',
    blocks: [
      { trainingId: 15, weeks: 21 }, // 1on1 guards (DR for 12)
      { trainingId: 9, weeks: 10 },  // OD for 1
      { trainingId: 1, weeks: 8 },   // JS for 12
      { trainingId: 6, weeks: 6 },   // JR for 12
      { trainingId: 18, weeks: 6 },  // PA for 1
    ],
  },
  {
    key: 'u21-big-is', name: 'U-21 big: IS → ID → RB', forType: 'big',
    description: 'Inside scoring first, then interior defense and boards',
    blocks: [
      { trainingId: 21, weeks: 14 }, { trainingId: 24, weeks: 14 }, { trainingId: 27, weeks: 12 },
    ],
  },
  {
    key: 'u21-big-sb', name: 'U-21 big: SB → ID → RB', forType: 'big',
    description: 'Shot blocking first variant',
    blocks: [
      { trainingId: 29, weeks: 14 }, { trainingId: 24, weeks: 14 }, { trainingId: 27, weeks: 12 },
    ],
  },
  {
    key: 'guard-1v1F-jsf', name: 'Senior guard opening (guide)', forType: 'outside',
    description: '1v1 forwards for HA/DR+JS elastic, then JS forwards (In-Depth guide)',
    blocks: [
      { trainingId: 16, weeks: 18 }, // 1on1 forwards (DR for 34)
      { trainingId: 2, weeks: 10 },  // JS for 34
      { trainingId: 21, weeks: 8 },  // IS for 5
      { trainingId: 9, weeks: 10 },  // OD for 1
      { trainingId: 18, weeks: 6 },  // PA for 1
    ],
  },
];
