/**
 * Sloučená tabulka hráče za zvolené období: zápasová čísla z archivu a docházka ze zápisů
 * docházky v jednom řádku. Dřív byla každá polovina v jiné záložce a trenér si je musel
 * srovnávat v hlavě.
 *
 * Vstup je už profiltrovaný na sezónu a její polovinu – tenhle modul o sezónách neví.
 */
import { AttendanceKind, MatchType } from "../types";
import type { ArchivedLineup, AttendanceRecord, Player } from "../types";
import { positionSortOrder } from "./assignment";

export interface PlayerTableRow {
  name: string;
  /** Odehrané zápasy – hráč byl v sestavě nebo mezi náhradníky. */
  matches: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  /** Průměrné hodnocení z hodnocených zápasů; 0 = nikdy nehodnocen. */
  avgRating: number;
  ratedMatches: number;
  /** Účast na trénincích: kolikrát přišel ze všech zapsaných tréninků období. */
  trainingsPresent: number;
  trainingsTotal: number;
  /** Účast na všech termínech dohromady (tréninky i zápasy) v procentech; null = nebylo z čeho. */
  attendanceRatio: number | null;
}

/** Jména, která v zápasu nastoupila – základní sestava i náhradníci. */
function participants(entry: ArchivedLineup): Set<string> {
  const names = Object.values(entry.names).filter((n) => n.trim() !== "");
  return new Set([...names, ...entry.substitutes.map((s) => s.name)]);
}

/**
 * Hráči, kteří se v období vůbec objevili. Základ je soupiska (v pořadí podle postů, ať
 * tabulka vypadá stejně jako jinde v appce), doplněná o jména z archivu a docházky – aby
 * nezmizel hráč, který už v soupisce není, ale na podzim hrál.
 */
function relevantNames(players: Player[], archive: ArchivedLineup[], attendance: AttendanceRecord[]): string[] {
  const ordered = [...players].sort((a, b) => positionSortOrder(a) - positionSortOrder(b)).map((p) => p.name);
  const seen = new Set(ordered);
  const extra: string[] = [];
  for (const entry of archive) {
    for (const name of participants(entry)) if (!seen.has(name)) (seen.add(name), extra.push(name));
    for (const name of Object.keys(entry.playerStats)) if (!seen.has(name)) (seen.add(name), extra.push(name));
  }
  for (const record of attendance) {
    for (const name of record.playerNames) if (!seen.has(name)) (seen.add(name), extra.push(name));
  }
  extra.sort((a, b) => a.localeCompare(b, "cs"));
  return [...ordered, ...extra];
}

/**
 * @param archive zápasy za období – už profiltrované podle přepínače Soutěžní / Vše
 * @param attendance všechny zapsané termíny za období (tréninky i zápasy)
 */
export function buildPlayerTable(
  players: Player[],
  archive: ArchivedLineup[],
  attendance: AttendanceRecord[]
): PlayerTableRow[] {
  const trainings = attendance.filter((a) => a.kind === AttendanceKind.TRAINING);

  // Jmenovatel je pro všechny hráče stejný – počet zapsaných termínů za období, ne jen těch,
  // kde se hráčovo jméno objevuje. Jinak by procenta kolísala podle toho, kdy byl hráč
  // přidán do soupisky. (Stejná úvaha jako v původní statistice docházky.)
  const wasPresent = (name: string, records: AttendanceRecord[]) =>
    records.filter((r) => r.playerNames.includes(name) && !r.absentNames.includes(name)).length;

  return relevantNames(players, archive, attendance).map((name) => {
    let matches = 0;
    let goals = 0;
    let assists = 0;
    let yellowCards = 0;
    let redCards = 0;
    let ratingSum = 0;
    let ratedMatches = 0;

    for (const entry of archive) {
      if (participants(entry).has(name)) matches++;
      const stat = entry.playerStats[name];
      if (!stat) continue;
      goals += stat.goals;
      assists += stat.assists;
      yellowCards += stat.yellowCards;
      redCards += stat.redCards;
      if (stat.rating > 0) {
        ratingSum += stat.rating;
        ratedMatches++;
      }
    }

    return {
      name,
      matches,
      goals,
      assists,
      yellowCards,
      redCards,
      avgRating: ratedMatches > 0 ? ratingSum / ratedMatches : 0,
      ratedMatches,
      trainingsPresent: wasPresent(name, trainings),
      trainingsTotal: trainings.length,
      attendanceRatio: attendance.length > 0 ? wasPresent(name, attendance) / attendance.length : null,
    };
  });
}

/** Sloupce, podle kterých jde tabulku seřadit. */
export type SortKey =
  | "name"
  | "matches"
  | "goals"
  | "assists"
  | "cards"
  | "rating"
  | "trainings"
  | "attendance";

/** Hodnota sloupce pro řazení. U karet platí, že červená váží víc než žlutá. */
function sortValue(row: PlayerTableRow, key: SortKey): number {
  switch (key) {
    case "matches":
      return row.matches;
    case "goals":
      return row.goals;
    case "assists":
      return row.assists;
    case "cards":
      return row.yellowCards + row.redCards * 10;
    case "rating":
      return row.avgRating;
    case "trainings":
      return row.trainingsTotal > 0 ? row.trainingsPresent / row.trainingsTotal : -1;
    case "attendance":
      return row.attendanceRatio ?? -1;
    case "name":
      return 0;
  }
}

/**
 * Seřadí tabulku. Jméno je vždy záložní kritérium, aby se řádky se stejnou hodnotou
 * nepřeskupovaly při každém překreslení.
 */
export function sortPlayerTable(rows: PlayerTableRow[], key: SortKey, descending: boolean): PlayerTableRow[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    if (key === "name") {
      const byName = a.name.localeCompare(b.name, "cs");
      return descending ? -byName : byName;
    }
    const diff = sortValue(a, key) - sortValue(b, key);
    if (diff !== 0) return descending ? -diff : diff;
    return a.name.localeCompare(b.name, "cs");
  });
  return sorted;
}

/** Zápasy pro tabulku podle přepínače nad ní – jen soutěžní, nebo všechno. */
export function filterByCompetitive(archive: ArchivedLineup[], competitiveOnlyFlag: boolean): ArchivedLineup[] {
  return competitiveOnlyFlag ? archive.filter((e) => e.matchType === MatchType.COMPETITIVE) : archive;
}
