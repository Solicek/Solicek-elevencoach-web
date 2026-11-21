import { describe, expect, it } from "vitest";
import { buildPlayerTable, filterByCompetitive, sortPlayerTable, type PlayerTableRow } from "./playerSeasonTable";
import { AttendanceKind, MatchType } from "../types";
import type { ArchivedLineup, AttendanceRecord, Player } from "../types";

function player(name: string): Player {
  return { id: name, name, preferredPositions: [], positionKey: null, positionDisplayName: null };
}

function stat(over: Partial<ArchivedLineup["playerStats"][string]> = {}) {
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

function match(over: Partial<ArchivedLineup> = {}): ArchivedLineup {
  return {
    id: "m",
    date: "05-09-2026",
    opponent: "Soupeř",
    formationName: "4-4-2",
    names: {},
    substitutes: [],
    notes: "",
    photoPaths: [],
    result: "1:0",
    playerStats: {},
    matchType: MatchType.COMPETITIVE,
    homeAway: "Doma",
    closed: true,
    ...over,
  };
}

function session(over: Partial<AttendanceRecord> = {}): AttendanceRecord {
  return {
    id: "a",
    date: "03-09-2026",
    playerNames: [],
    absentNames: [],
    trainingId: null,
    matchId: null,
    kind: AttendanceKind.TRAINING,
    ...over,
  };
}

const row = (rows: PlayerTableRow[], name: string) => rows.find((r) => r.name === name)!;

describe("sloučená tabulka hráče", () => {
  it("počítá odehraný zápas hráči v sestavě i náhradníkovi", () => {
    const rows = buildPlayerTable(
      [player("Základ"), player("Náhradník"), player("Doma u televize")],
      [match({ id: "m1", names: { GK: "Základ" }, substitutes: [{ id: "s1", name: "Náhradník", positions: [] }] })],
      []
    );
    expect(row(rows, "Základ").matches).toBe(1);
    expect(row(rows, "Náhradník").matches).toBe(1);
    expect(row(rows, "Doma u televize").matches).toBe(0);
  });

  it("sčítá góly, asistence a karty přes víc zápasů", () => {
    const rows = buildPlayerTable(
      [player("Střelec")],
      [
        match({ id: "m1", names: { FW: "Střelec" }, playerStats: { Střelec: stat({ goals: 2, assists: 1, yellowCards: 1 }) } }),
        match({ id: "m2", names: { FW: "Střelec" }, playerStats: { Střelec: stat({ goals: 1, redCards: 1 }) } }),
      ],
      []
    );
    const r = row(rows, "Střelec");
    expect([r.matches, r.goals, r.assists, r.yellowCards, r.redCards]).toEqual([2, 3, 1, 1, 1]);
  });

  it("průměruje hodnocení jen z hodnocených zápasů (nula = nehodnoceno)", () => {
    const rows = buildPlayerTable(
      [player("Hráč")],
      [
        match({ id: "m1", names: { GK: "Hráč" }, playerStats: { Hráč: stat({ rating: 5 }) } }),
        match({ id: "m2", names: { GK: "Hráč" }, playerStats: { Hráč: stat({ rating: 3 }) } }),
        match({ id: "m3", names: { GK: "Hráč" }, playerStats: { Hráč: stat({ rating: 0 }) } }),
      ],
      []
    );
    const r = row(rows, "Hráč");
    expect(r.ratedMatches).toBe(2);
    expect(r.avgRating).toBe(4);
  });

  it("nehodnocený hráč má avgRating 0 a ratedMatches 0 (tabulka pak ukáže pomlčku)", () => {
    const rows = buildPlayerTable([player("Hráč")], [match({ names: { GK: "Hráč" } })], []);
    expect(row(rows, "Hráč")).toMatchObject({ avgRating: 0, ratedMatches: 0 });
  });

  it("docházka na trénincích má jmenovatel ze VŠECH tréninků období, ne jen z těch, kde je hráč uvedený", () => {
    const rows = buildPlayerTable(
      [player("Chodí"), player("Přišel později do týmu")],
      [],
      [
        session({ id: "t1", playerNames: ["Chodí"], absentNames: [] }),
        session({ id: "t2", playerNames: ["Chodí"], absentNames: ["Chodí"] }),
        session({ id: "t3", playerNames: ["Chodí", "Přišel později do týmu"], absentNames: [] }),
      ]
    );
    expect(row(rows, "Chodí")).toMatchObject({ trainingsPresent: 2, trainingsTotal: 3 });
    // Hráč, který byl u jediného termínu, má 1 ze 3 – ne 1 z 1.
    expect(row(rows, "Přišel později do týmu")).toMatchObject({ trainingsPresent: 1, trainingsTotal: 3 });
  });

  it("celková docházka počítá tréninky i zápasy dohromady", () => {
    const rows = buildPlayerTable(
      [player("Hráč")],
      [],
      [
        session({ id: "t1", kind: AttendanceKind.TRAINING, playerNames: ["Hráč"] }),
        session({ id: "z1", kind: MatchType.COMPETITIVE, playerNames: ["Hráč"], absentNames: ["Hráč"] }),
        session({ id: "z2", kind: MatchType.FRIENDLY, playerNames: ["Hráč"] }),
        session({ id: "t2", kind: AttendanceKind.TRAINING, playerNames: ["Hráč"] }),
      ]
    );
    const r = row(rows, "Hráč");
    expect(r.attendanceRatio).toBeCloseTo(3 / 4);
    expect(r.trainingsTotal).toBe(2);
  });

  it("bez jediného zapsaného termínu je docházka null, ne nula procent", () => {
    const rows = buildPlayerTable([player("Hráč")], [match({ names: { GK: "Hráč" } })], []);
    expect(row(rows, "Hráč").attendanceRatio).toBeNull();
  });

  it("nevynechá hráče, který už není na soupisce, ale v období hrál", () => {
    const rows = buildPlayerTable(
      [player("Současný")],
      [match({ names: { GK: "Současný", FW: "Odešel" }, playerStats: { Odešel: stat({ goals: 3 }) } })],
      [session({ playerNames: ["Současný", "Host na tréninku"] })]
    );
    expect(rows.map((r) => r.name).sort()).toEqual(["Host na tréninku", "Odešel", "Současný"]);
    expect(row(rows, "Odešel").goals).toBe(3);
  });

  it("hráč na soupisce bez jediného zápasu i tréninku je v tabulce s nulami", () => {
    const rows = buildPlayerTable([player("Nový")], [], [session({ playerNames: ["Někdo jiný"] })]);
    expect(row(rows, "Nový")).toMatchObject({ matches: 0, goals: 0, trainingsPresent: 0, trainingsTotal: 1 });
    expect(row(rows, "Nový").attendanceRatio).toBe(0);
  });

  it("gól zapsaný hráči, který nebyl v sestavě, se nezapočítá jako odehraný zápas", () => {
    const rows = buildPlayerTable([], [match({ names: { GK: "Brankář" }, playerStats: { Duch: stat({ goals: 1 }) } })], []);
    expect(row(rows, "Duch")).toMatchObject({ matches: 0, goals: 1 });
  });
});

describe("přepínač soutěžní / všechny zápasy", () => {
  const matches = [
    match({ id: "s", matchType: MatchType.COMPETITIVE }),
    match({ id: "p", matchType: MatchType.FRIENDLY }),
    match({ id: "stary", matchType: "" }),
  ];

  it("soutěžní nechá jen soutěžní", () => {
    expect(filterByCompetitive(matches, true).map((m) => m.id)).toEqual(["s"]);
  });

  it("všechny zápasy nechají projít i přátelské a starší záznamy bez typu", () => {
    expect(filterByCompetitive(matches, false).map((m) => m.id)).toEqual(["s", "p", "stary"]);
  });
});

describe("řazení tabulky", () => {
  const rows: PlayerTableRow[] = [
    { name: "Černý", matches: 3, goals: 1, assists: 0, yellowCards: 0, redCards: 1, avgRating: 2, ratedMatches: 1, trainingsPresent: 1, trainingsTotal: 4, attendanceRatio: 0.25 },
    { name: "Adam", matches: 5, goals: 1, assists: 4, yellowCards: 3, redCards: 0, avgRating: 4.5, ratedMatches: 4, trainingsPresent: 4, trainingsTotal: 4, attendanceRatio: 1 },
    { name: "Šimek", matches: 1, goals: 7, assists: 0, yellowCards: 0, redCards: 0, avgRating: 0, ratedMatches: 0, trainingsPresent: 2, trainingsTotal: 4, attendanceRatio: 0.5 },
  ];
  const order = (key: Parameters<typeof sortPlayerTable>[1], desc = true) =>
    sortPlayerTable(rows, key, desc).map((r) => r.name);

  it("řadí podle gólů sestupně i vzestupně", () => {
    expect(order("goals")).toEqual(["Šimek", "Adam", "Černý"]);
    expect(order("goals", false)).toEqual(["Adam", "Černý", "Šimek"]);
  });

  it("při shodě rozhoduje jméno, takže se pořadí nepřeskupuje", () => {
    // Adam i Černý mají jeden gól – vzestupně musí být Adam první podle abecedy.
    expect(order("goals", false).slice(0, 2)).toEqual(["Adam", "Černý"]);
  });

  it("řadí podle jména s českou abecedou", () => {
    expect(order("name", false)).toEqual(["Adam", "Černý", "Šimek"]);
    expect(order("name", true)).toEqual(["Šimek", "Černý", "Adam"]);
  });

  it("u karet váží červená víc než žlutá", () => {
    expect(order("cards")).toEqual(["Černý", "Adam", "Šimek"]);
  });

  it("řadí podle docházky, tréninků, zápasů i hodnocení", () => {
    expect(order("attendance")).toEqual(["Adam", "Šimek", "Černý"]);
    expect(order("trainings")).toEqual(["Adam", "Šimek", "Černý"]);
    expect(order("matches")).toEqual(["Adam", "Černý", "Šimek"]);
    expect(order("rating")).toEqual(["Adam", "Černý", "Šimek"]);
  });

  it("nemění vstupní pole", () => {
    const before = rows.map((r) => r.name);
    sortPlayerTable(rows, "goals", true);
    expect(rows.map((r) => r.name)).toEqual(before);
  });
});
