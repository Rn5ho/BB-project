import { SKILLS, SKILL_LEVELS, POTENTIAL_LEVELS, getSkillColor, getPotentialColor } from '@/lib/constants';
import type { CurrentProfile } from '@/lib/series';

function fmt(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface MetaRowProps {
  label: string;
  children: React.ReactNode;
}
function MetaRow({ label, children }: MetaRowProps) {
  return (
    <div className="flex justify-between gap-2 text-sm py-0.5">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

interface Props {
  profile: CurrentProfile;
  heightCm: number | null;
  bestPosition: string | null;
}

export default function ProfileCard({ profile, heightCm, bestPosition }: Props) {
  const { skills, skillsAsOf, skillsSource, dmiAsOf, dmiSource,
          tsp, age, gameShape, salary, potential, experience, dmi } = profile;

  // Build sub-line text
  let subLine: string;
  if (!skills) {
    subLine = 'No full-skill capture yet — DMI-only.';
  } else {
    const parts: string[] = [];
    if (skillsAsOf) parts.push(`Skills as of ${fmt(skillsAsOf)} (${skillsSource})`);
    if (dmiAsOf) {
      const dmiDateStr = fmt(dmiAsOf);
      const skillDateStr = skillsAsOf ? fmt(skillsAsOf) : null;
      if (dmiDateStr !== skillDateStr) {
        parts.push(`DMI as of ${dmiDateStr} (${dmiSource})`);
      }
    }
    subLine = parts.join(' · ');
  }

  return (
    <div className="border border-neutral-800 rounded bg-neutral-900/40 p-4">
      <div className="mb-4">
        <h2 className="font-semibold text-base">Current profile</h2>
        <p className="text-xs text-neutral-500 mt-0.5">{subLine}</p>
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        {/* LEFT: meta */}
        <div className="space-y-0.5">
          <MetaRow label="Weekly salary">
            {salary != null ? `$${salary.toLocaleString()}` : '–'}
          </MetaRow>
          <MetaRow label="Age">{age ?? '–'}</MetaRow>
          <MetaRow label="Height">{heightCm != null ? `${heightCm} cm` : '–'}</MetaRow>
          <MetaRow label="Position">{bestPosition ?? '–'}</MetaRow>
          <MetaRow label="Potential">
            {potential != null ? (
              <span style={{ color: getPotentialColor(potential) }}>
                {POTENTIAL_LEVELS[potential] ?? '–'} ({potential})
              </span>
            ) : '–'}
          </MetaRow>
          <MetaRow label="Game Shape">{gameShape ?? '–'}</MetaRow>
          <MetaRow label="Experience">{experience ?? '–'}</MetaRow>
          <MetaRow label="DMI">{dmi != null ? dmi.toLocaleString() : '–'}</MetaRow>
          <MetaRow label="TSP">{tsp ?? '–'}</MetaRow>
        </div>

        {/* RIGHT: skills grid */}
        {skills ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {SKILLS.map(({ name, dbKey }) => {
              const v = skills[dbKey];
              return (
                <div key={dbKey} className="flex justify-between gap-2 text-sm">
                  <span className="text-neutral-500">{name}:</span>
                  <span style={{ color: getSkillColor(v) }} className="font-medium">
                    {SKILL_LEVELS[v] ?? '–'} ({v})
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Skills not captured yet.</p>
        )}
      </div>
    </div>
  );
}
