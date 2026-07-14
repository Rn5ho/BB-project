// v2/scripts/training/simulate.mts
// Dev CLI: npm run training:simulate -- --age 18 --height 196 --potential 8 \
//   --skills 7,6,6,7,5,7,4,4,5,3 --plan 15x21,9x21 --coach 5
// --plan: comma-separated <trainingId>x<weeks> blocks.
import { ensembleProject } from '../../src/lib/training/ensemble';
import { estimateSalary, capUsagePct } from '../../src/lib/training/salary';
import { displayed } from '../../src/lib/training/engine';
import { skillsFromArray, SKILL_KEYS } from '../../src/lib/training/types';

function arg(name: string, fallback?: string): string {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing --${name}`);
  }
  const value = process.argv[i + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`missing --${name}`);
  }
  return value;
}

const player = {
  skills: skillsFromArray(arg('skills').split(',').map(Number)),
  age: Number(arg('age')),
  heightCm: Number(arg('height')),
  potential: Number(arg('potential')),
};
const coachLevel = Number(arg('coach', '5'));
const plan = arg('plan')
  .split(',')
  .flatMap((block) => {
    const m = /^(\d+)x(\d+)$/.exec(block);
    const id = m ? Number(m[1]) : NaN;
    const weeks = m ? Number(m[2]) : NaN;
    if (!m || id < 1 || id > 33 || weeks < 1) {
      throw new Error(`invalid --plan block "${block}" (expected <trainingId>x<weeks>, e.g. 12x14)`);
    }
    return Array.from({ length: weeks }, () => ({ trainingId: id, coachLevel }));
  });

const r = ensembleProject(player, plan);
console.log(`Plan: ${plan.length} weeks | final age ${r.central.finalAge}`);
console.log('skill  start  ->  central [low..high]');
for (const k of SKILL_KEYS) {
  const s = player.skills[k];
  console.log(
    `${k.padEnd(5)} ${String(displayed(s)).padStart(5)}  ->  ${r.central.finalSkills[k].toFixed(1).padStart(7)} [${r.band.low[k].toFixed(1)}..${r.band.high[k].toFixed(1)}]`,
  );
}
console.log(`TSP: ${r.band.tspCentral.toFixed(1)} [${r.band.tspLow.toFixed(1)}..${r.band.tspHigh.toFixed(1)}]`);
console.log(`Salary now: ${estimateSalary(player.skills).salary} | projected: ${estimateSalary(r.central.finalSkills).salary}`);
console.log(`Cap usage: ${capUsagePct(r.central.finalSkills, player.potential).toFixed(0)}%`);
