import { describe, expect, it } from "vitest";
import { combinePlayerTotals, computeFineLineItems, teamFineTotals } from "./fines";
import type { ArchivedLineup, FineItem, FineRates, PlayerMatchStat } from "../types";
import { MatchType } from "../types";

const rates: FineRates = { yellowFoul: 50, yellowDissent: 100, secondYellowRed: 250, straightRed: 200 };

function stat(over: Partial<PlayerMatchStat> = {}): PlayerMatchStat {
  return {
    goals: 0,
    ownGoals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    rating: 0,
    yellowFoulCards: 0,
    yellowDissentCards: 0,
    straightRedCards: 0,
    secondYellowRedCards: 0,
    ...over,
  };
}

function match(id: string, playerStats: Record<string, PlayerMatchStat>): ArchivedLineup {
  return {
    id,
    date: "05-09-2026",
    opponent: "Soupeř",
    formationName: "4-4-2",
    names: {},
    substitutes: [],
    notes: "",
    photoPaths: [],
    result: "",
    playerStats,
    matchType: MatchType.COMPETITIVE,
    homeAway: "Doma",
    closed: true,
  };
}

function item(over: Partial<FineItem> = {}): FineItem {
  return { id: "i", playerName: "Novák", label: "Příspěvek", amount: 300, date: "01-10-2026", paid: false, ...over };
}

const nic = () => false;

describe("ruční položky a karty dohromady", () => {
  it("sečte hráči kartu i příspěvek do jednoho dluhu", () => {
    const cards = computeFineLineItems([match("m1", { Novák: stat({ yellowFoulCards: 1 }) })], rates);
    const rows = combinePlayerTotals(cards, [item({ amount: 300 })], nic);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Novák", owed: 350, paid: 0, remaining: 350 });
  });

  it("zaplacená karta i zaplacená položka se počítají do vybraného", () => {
    const cards = computeFineLineItems([match("m1", { Novák: stat({ straightRedCards: 1 }) })], rates);
    const rows = combinePlayerTotals(cards, [item({ amount: 300, paid: true })], () => true);
    expect(rows[0]).toMatchObject({ owed: 500, paid: 500, remaining: 0 });
  });

  it("nezaplacená položka nechá dluh i u hráče bez karet", () => {
    const rows = combinePlayerTotals([], [item({ playerName: "Svoboda", amount: 300 })], nic);
    expect(rows[0]).toMatchObject({ name: "Svoboda", owed: 300, remaining: 300 });
  });

  it("nahoru dá toho, kdo nejvíc dluží", () => {
    const rows = combinePlayerTotals(
      [],
      [
        item({ id: "a", playerName: "Málo", amount: 100 }),
        item({ id: "b", playerName: "Hodně", amount: 900 }),
        item({ id: "c", playerName: "Zaplatil", amount: 500, paid: true }),
      ],
      nic
    );
    expect(rows.map((r) => r.name)).toEqual(["Hodně", "Málo", "Zaplatil"]);
  });

  it("při stejném dluhu rozhoduje předepsaná částka a pak jméno", () => {
    const rows = combinePlayerTotals(
      [],
      [
        item({ id: "a", playerName: "Beran", amount: 200 }),
        item({ id: "b", playerName: "Adam", amount: 200 }),
      ],
      nic
    );
    expect(rows.map((r) => r.name)).toEqual(["Adam", "Beran"]);
  });

  it("víc položek jednoho hráče se sčítá, ne přepisuje", () => {
    const rows = combinePlayerTotals(
      [],
      [
        item({ id: "a", label: "Příspěvek říjen", amount: 300 }),
        item({ id: "b", label: "Pozdní příchod", amount: 100, paid: true }),
      ],
      nic
    );
    expect(rows[0]).toMatchObject({ owed: 400, paid: 100, remaining: 300 });
  });

  it("bez čehokoliv je seznam prázdný, ne řádek s nulou", () => {
    expect(combinePlayerTotals([], [], nic)).toEqual([]);
  });
});

describe("součet za tým", () => {
  it("sečte předepsáno, vybráno i zbytek přes všechny hráče", () => {
    const rows = combinePlayerTotals(
      [],
      [
        item({ id: "a", playerName: "A", amount: 300 }),
        item({ id: "b", playerName: "B", amount: 500, paid: true }),
      ],
      nic
    );
    expect(teamFineTotals(rows)).toEqual({ owed: 800, paid: 500, remaining: 300 });
  });

  it("prázdný tým má nuly", () => {
    expect(teamFineTotals([])).toEqual({ owed: 0, paid: 0, remaining: 0 });
  });
});
