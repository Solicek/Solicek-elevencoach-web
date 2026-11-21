import { describe, expect, it } from "vitest";
import {
  currentSeasonPart,
  inSeason,
  inSeasonPart,
  listSeasonStartYears,
  seasonLabel,
  seasonPartOf,
  seasonStartYear,
} from "./season";

/**
 * Sezóna i její polovina se odvozují z data, takže je na nich postavená celá záložka Sezóna.
 * Hlídají se hlavně hranice: 30. 6. / 1. 7. (přelom sezóny) a 31. 12. / 1. 1. (podzim/jaro).
 */
describe("sezóna podle data", () => {
  it("zařadí datum do správné sezóny", () => {
    expect(seasonStartYear("01-07-2026")).toBe(2026);
    expect(seasonStartYear("30-06-2026")).toBe(2025);
    expect(seasonStartYear("31-12-2026")).toBe(2026);
    expect(seasonStartYear("01-01-2027")).toBe(2026);
  });

  it("u nesmyslného data vrátí null, ne nulu", () => {
    expect(seasonStartYear("")).toBeNull();
    expect(seasonStartYear("32-13-2026")).toBeNull();
    expect(seasonStartYear("nesmysl")).toBeNull();
  });

  it("popíše sezónu přes přelom roku", () => {
    expect(seasonLabel(2026)).toBe("2026/27");
    expect(seasonLabel(2029)).toBe("2029/30");
    expect(seasonLabel(2099)).toBe("2099/00");
  });

  it("rozdělí sezónu na podzim a jaro na správné hranici", () => {
    expect(seasonPartOf("01-07-2026")).toBe("autumn");
    expect(seasonPartOf("31-12-2026")).toBe("autumn");
    expect(seasonPartOf("01-01-2027")).toBe("spring");
    expect(seasonPartOf("30-06-2027")).toBe("spring");
    expect(seasonPartOf("nesmysl")).toBeNull();
  });

  it("probíhající polovina odpovídá dnešnímu měsíci", () => {
    const month = new Date().getMonth() + 1;
    expect(currentSeasonPart()).toBe(month >= 7 ? "autumn" : "spring");
  });

  it("nabídne sezóny od nejnovější a bez duplicit", () => {
    expect(listSeasonStartYears(["05-09-2026", "11-03-2027", "20-10-2025", "05-09-2026"])).toEqual([2026, 2025]);
  });

  it("data bez platného data do nabídky sezón nepatří", () => {
    expect(listSeasonStartYears(["", "nesmysl"])).toEqual([]);
  });

  it("filtr na sezónu nechá u volby „vše“ projít všechno", () => {
    const items = [{ date: "05-09-2026" }, { date: "11-03-2027" }, { date: "20-10-2025" }];
    expect(inSeason(items, 2026)).toHaveLength(2);
    expect(inSeason(items, 2025)).toHaveLength(1);
    expect(inSeason(items, null)).toHaveLength(3);
  });

  it("filtr na polovinu sezóny dělí podzim a jaro, „celkem“ nefiltruje", () => {
    const items = [{ date: "05-09-2026" }, { date: "11-03-2027" }, { date: "31-12-2026" }];
    expect(inSeasonPart(items, "autumn").map((i) => i.date)).toEqual(["05-09-2026", "31-12-2026"]);
    expect(inSeasonPart(items, "spring").map((i) => i.date)).toEqual(["11-03-2027"]);
    expect(inSeasonPart(items, "whole")).toHaveLength(3);
  });
});
