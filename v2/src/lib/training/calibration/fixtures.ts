// v2/src/lib/training/calibration/fixtures.ts
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { weekStep, type PlayerState } from '../engine';
import { skillsFromArray, skillsToArray, type ModelParams } from '../types';

export interface Probe {
  name: string;
  request: {
    player: {
      skills: number[]; age: number; height: number; potential: number;
      coach_level: number; youth_trainer_level: number; training_court_level: number;
      ft_skill: number; training_model: string;
    };
    training_schedule: number[];
    start_season: number;
    start_week: number;
  };
  response: { weeks: Array<{ gains: number[] }>; final_skills: number[] };
}

export function probesDir(): string {
  return path.resolve(process.cwd(), '..', 'docs', 'research', 'training', 'buzzeriq', 'probes');
}

export function loadProbes(): Probe[] {
  const dir = probesDir();
  const reqs = readdirSync(dir).filter((f) => f.endsWith('.req.json'));
  const probes: Probe[] = [];
  for (const req of reqs) {
    const name = req.replace('.req.json', '');
    const request = JSON.parse(readFileSync(path.join(dir, req), 'utf8'));
    const response = JSON.parse(readFileSync(path.join(dir, `${name}.res.json`), 'utf8'));
    if (!response.weeks || !request.player) continue; // solve / invalid probes
    probes.push({ name, request, response });
  }
  return probes;
}

export function replayProbe(
  probe: Probe,
  model: ModelParams,
): { predicted: number[]; actual: number[]; maxAbsErr: number } {
  const p: PlayerState = {
    skills: skillsFromArray(probe.request.player.skills),
    age: probe.request.player.age,
    heightCm: probe.request.player.height,
    potential: probe.request.player.potential,
    ftSkill: probe.request.player.ft_skill,
  };
  const r = weekStep(p, {
    trainingId: probe.request.training_schedule[0],
    coachLevel: probe.request.player.coach_level,
    youthTrainerLevel: probe.request.player.youth_trainer_level,
  }, model);
  const predicted = skillsToArray(r.gains);
  const actual = probe.response.weeks[0].gains;
  const maxAbsErr = Math.max(...predicted.map((v, i) => Math.abs(v - actual[i])));
  return { predicted, actual, maxAbsErr };
}
