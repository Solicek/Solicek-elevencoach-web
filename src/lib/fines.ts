import type { ArchivedLineup, FineRates, PlayerMatchStat } from "../types";

export interface FineLineItem {
  matchId: string;
  date: string;
  opponent: string;
  playerName: string;
  amount: number;
}

export function computeFineAmount(stat: PlayerMatchStat, rates: FineRates): number {
  return (
    stat.yellowFoulCards * rates.yellowFoul +
    stat.yellowDissentCards * rates.yellowDissent +
    stat.straightRedCards * rates.straightRed +
    stat.secondYellowRedCards * rates.secondYellowRed
  );
}

/** Jedna položka pokuty = jeden hráč v jednom zápase, u kterého má nějakou kartu. */
export function computeFineLineItems(archive: ArchivedLineup[], rates: FineRates): FineLineItem[] {
  const items: FineLineItem[] = [];
  for (const entry of archive) {
    for (const [playerName, stat] of Object.entries(entry.playerStats)) {
      const amount = computeFineAmount(stat, rates);
      if (amount > 0) {
        items.push({ matchId: entry.id, date: entry.date, opponent: entry.opponent, playerName, amount });
      }
    }
  }
  return items;
}

export function finePaymentId(matchId: string, playerName: string): string {
  return `${matchId}__${playerName}`;
}
