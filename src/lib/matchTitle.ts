import { HomeAway } from "../types";
import type { ArchivedLineup } from "../types";

/** Jména v pořadí domácí/hosté podle toho, jestli se hrálo doma nebo venku. */
export function homeAwayNames(entry: ArchivedLineup, teamName: string): { home: string; away: string } {
  if (entry.homeAway === HomeAway.AWAY) return { home: entry.opponent, away: teamName };
  return { home: teamName, away: entry.opponent };
}

/** "Náš tým - Soupeř" doma, "Soupeř - Náš tým" venku. U starších záznamů bez domácí/venku jen soupeř. */
export function matchTitle(entry: ArchivedLineup, teamName: string): string {
  if (!entry.homeAway) return entry.opponent;
  const { home, away } = homeAwayNames(entry, teamName);
  return `${home} - ${away}`;
}
