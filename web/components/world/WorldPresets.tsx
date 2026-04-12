"use client";

import { EUROPE_COUNTRIES, intersectWithDataset } from "@/lib/regions";

interface Props {
  allCountriesInDataset: string[];
  starredCountries: string[];
  onSetCountries: (countries: string[]) => void;
  onClearAll: () => void;
}

export function WorldPresets({
  allCountriesInDataset,
  starredCountries,
  onSetCountries,
  onClearAll,
}: Props) {
  const europe = intersectWithDataset(EUROPE_COUNTRIES, allCountriesInDataset);
  const season = intersectWithDataset(starredCountries, allCountriesInDataset);

  const btn =
    "px-3 py-1 rounded-md text-xs font-medium text-gray-300 hover:text-white transition-colors";
  const bg = { background: "var(--card-bg)", border: "1px solid var(--card-border)" };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button className={btn} style={bg} onClick={() => onSetCountries([])}>
        All
      </button>
      <button className={btn} style={bg} onClick={() => onSetCountries(europe)}>
        Europe ({europe.length})
      </button>
      <button
        className={btn}
        style={bg}
        onClick={() => onSetCountries(season)}
        disabled={season.length === 0}
        title={season.length === 0 ? "Star countries in the picker to build this list" : undefined}
      >
        Season Opponents ({season.length})
      </button>
      <button className={btn} style={bg} onClick={onClearAll}>
        Clear
      </button>
    </div>
  );
}
