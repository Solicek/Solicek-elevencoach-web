/**
 * Rozdělení zápasů a termínů na sezóny.
 *
 * Sezóna se ODVOZUJE z data (DD-MM-RRRR), neukládá se u zápasu jako další pole – díky tomu
 * funguje zpětně na všechna data, co v databázi leží, nic se nemigruje a trenér nemusí na konci
 * sezóny nic ručně "uzavírat". Sezóna se přepne sama prvním termínem po začátku nové sezóny.
 *
 * Sezóna je u nás i ve většině Evropy podzim–jaro, tj. 1. 7. – 30. 6.: zápas z 18-07-2026 patří
 * do sezóny 2026/27, zápas z 15-05-2026 do 2025/26. Ligy hrané v rámci kalendářního roku
 * (Skandinávie, Irsko) by měly SEASON_START_MONTH = 1; pak je sezóna rovna roku a zobrazí se
 * jako "2026". Až bude volba v nastavení týmu, nahradí se tahle konstanta tím nastavením.
 */
import { parseDateString } from "./dateUtils";

/** Měsíc, kterým sezóna začíná (1 = leden). 7 = červenec, tedy sezóna 1. 7. – 30. 6. */
// Typ `number` (ne literál 7) schválně – porovnání se SEASON_START_MONTH === 1 níž by jinak
// TypeScript označil za vždy nepravdivé a build by spadl.
export const SEASON_START_MONTH: number = 7;

/** Sezóna se značí ROKEM SVÉHO ZAČÁTKU – sezóna 2026/27 má startYear 2026. */
export function seasonStartYear(dateString: string): number | null {
  const date = parseDateString(dateString);
  if (!date) return null;
  const month = date.getMonth() + 1;
  return month >= SEASON_START_MONTH ? date.getFullYear() : date.getFullYear() - 1;
}

/** "2026/27" pro sezónu přes přelom roku, "2026" pro ligu hranou v kalendářním roce. */
export function seasonLabel(startYear: number): string {
  if (SEASON_START_MONTH === 1) return String(startYear);
  const endYear = String(startYear + 1).slice(-2);
  return `${startYear}/${endYear}`;
}

/** Sezóna, do které spadá dnešek. */
export function currentSeasonStartYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= SEASON_START_MONTH ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * Sezóny, ve kterých tým něco odehrál, od nejnovější. Záznamy bez platného data se vynechají –
 * ty jsou vidět jen ve volbě "Vše", aby se nikde neztratily.
 */
export function listSeasonStartYears(dateStrings: string[]): number[] {
  const years = new Set<number>();
  for (const dateString of dateStrings) {
    const year = seasonStartYear(dateString);
    if (year !== null) years.add(year);
  }
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Která sezóna se má nabídnout jako výchozí: ta aktuální, pokud v ní něco je, jinak nejnovější
 * odehraná (ať po otevření appky v létě nekouká trenér na prázdnou sezónu).
 */
export function defaultSeasonStartYear(available: number[]): number | null {
  if (available.length === 0) return null;
  const current = currentSeasonStartYear();
  return available.includes(current) ? current : available[0];
}

/** Filtr položek s datem na jednu sezónu; `null` = bez filtru ("Vše"). */
export function inSeason<T extends { date: string }>(items: T[], startYear: number | null): T[] {
  if (startYear === null) return items;
  return items.filter((item) => seasonStartYear(item.date) === startYear);
}
