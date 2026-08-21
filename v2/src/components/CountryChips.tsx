import Link from 'next/link';

// Server-compatible country filter chips shared by the World and Seniors pages.
// The active chip links back to basePath (clear affordance, marked with ✕).

function chipClass(active: boolean): string {
  return `rounded border px-2 py-0.5 ${
    active
      ? 'border-amber-500 text-amber-400 bg-amber-500/10'
      : 'border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500'
  }`;
}

export default function CountryChips({
  countries,
  active,
  basePath,
}: {
  countries: string[];
  active?: string;
  basePath: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4 text-sm">
      <span className="text-neutral-500 mr-1">Country:</span>
      <Link href={basePath} className={chipClass(!active)}>All</Link>
      {countries.map((c) => (
        <Link
          key={c}
          href={active === c ? basePath : `${basePath}?country=${encodeURIComponent(c)}`}
          title={active === c ? 'Clear country filter' : `Show only ${c}`}
          className={chipClass(active === c)}
        >
          {c}{active === c ? ' ✕' : ''}
        </Link>
      ))}
    </div>
  );
}
