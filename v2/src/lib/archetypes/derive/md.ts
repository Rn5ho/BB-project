import { SKILL_KEYS, type SkillKey } from '../../training/types';

export function mdTable(headers: string[], rows: (string | number | null)[][]): string {
  const h = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.map((c) => (c === null ? '–' : String(c))).join(' | ')} |`);
  return [h, sep, ...body].join('\n');
}
export function fmtSkills(skills: Record<SkillKey, number>): string {
  return SKILL_KEYS.map((k) => `${k.toUpperCase()}${skills[k]}`).join(' ');
}
