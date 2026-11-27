import type { ArchivedLineup, FineItem, FineRates, PlayerMatchStat } from "../types";

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

/** Součet za jednoho hráče: karty i ruční položky dohromady. */
export interface PlayerFineTotals {
  name: string;
  /** Kolik mu bylo celkem předepsáno. */
  owed: number;
  /** Kolik z toho už zaplatil. */
  paid: number;
  remaining: number;
}

/**
 * Sloučí obě poloviny dluhu: karty ze zápasů a ruční položky (příspěvky, pozdní příchody).
 * Trenéra nezajímá, odkud částka přišla – chce vědět, kdo kolik dluží.
 *
 * @param isCardPaid zda je karta zaplacená; stav karet se drží zvlášť (kolekce finePayments),
 * protože karta sama není dokument, dopočítává se ze zápasu
 */
export function combinePlayerTotals(
  cardItems: FineLineItem[],
  manualItems: FineItem[],
  isCardPaid: (item: FineLineItem) => boolean
): PlayerFineTotals[] {
  const totals = new Map<string, { owed: number; paid: number }>();
  const add = (name: string, amount: number, paid: boolean) => {
    const entry = totals.get(name) ?? { owed: 0, paid: 0 };
    entry.owed += amount;
    if (paid) entry.paid += amount;
    totals.set(name, entry);
  };
  for (const item of cardItems) add(item.playerName, item.amount, isCardPaid(item));
  for (const item of manualItems) add(item.playerName, item.amount, item.paid);

  return Array.from(totals.entries())
    .map(([name, { owed, paid }]) => ({ name, owed, paid, remaining: owed - paid }))
    // Nahoře ten, kdo nejvíc dluží – to je to, co trenér řeší. Při shodě rozhoduje
    // celková předepsaná částka a nakonec jméno, ať pořadí neposkakuje.
    .sort((a, b) => b.remaining - a.remaining || b.owed - a.owed || a.name.localeCompare(b.name, "cs"));
}

/** Celkové částky za tým – předepsáno, vybráno, zbývá. */
export function teamFineTotals(perPlayer: PlayerFineTotals[]): { owed: number; paid: number; remaining: number } {
  return perPlayer.reduce(
    (sum, p) => ({ owed: sum.owed + p.owed, paid: sum.paid + p.paid, remaining: sum.remaining + p.remaining }),
    { owed: 0, paid: 0, remaining: 0 }
  );
}
