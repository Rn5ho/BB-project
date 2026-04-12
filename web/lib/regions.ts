// European BB countries. Includes both English and native-language variants
// defensively (BB's country list has both forms for several countries).
// List is filtered to "countries present in the current dataset" at use-site,
// so unused entries are harmless.
export const EUROPE_COUNTRIES: string[] = [
  "Albania",
  "Belarus",
  "Belgium",
  "Bosnia",
  "Bulgaria",
  "Crna Gora",
  "Croatia",
  "Cymru",
  "Česká Rep.",
  "Danmark",
  "Deutschland",
  "Eesti",
  "England",
  "España",
  "France",
  "Germany",
  "Hellas",
  "Hrvatska",
  "Hungary",
  "Ireland",
  "Italia",
  "Italy",
  "Latvija",
  "Latvia",
  "Lithuania",
  "Lubnan",
  "Magyar",
  "Nederland",
  "Norge",
  "Österreich",
  "Poland",
  "Polska",
  "Portugal",
  "România",
  "Rossiya",
  "Sakartvelo",
  "Scotland",
  "Serbia",
  "Slovakia",
  "Slovensko",
  "Slovenia",
  "Sverige",
  "Türkiye",
  "Turkey",
  "Ukraina",
  "Ukraine",
];

export function intersectWithDataset(
  preset: string[],
  dataset: string[]
): string[] {
  const set = new Set(dataset);
  return preset.filter((c) => set.has(c));
}
