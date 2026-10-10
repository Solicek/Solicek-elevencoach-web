import * as XLSX from "xlsx";
import { HomeAway, MatchType } from "../types";
import { t } from "./i18n";

export interface ParsedFixture {
  date: string; // DD-MM-RRRR
  opponent: string;
  homeAway: string; // HomeAway.HOME / HomeAway.AWAY
  matchType: string;
  result: string; // "" pokud se ještě nehrálo
}

export interface FixtureImportResult {
  fixtures: ParsedFixture[];
  ourTeamLabel: string;
  warnings: string[];
}

const HOME_COLUMN_NAMES = ["domácí", "domaci"];
const AWAY_COLUMN_NAMES = ["hosté", "hoste"];
const DATE_COLUMN_NAMES = ["datum a čas", "datum a cas", "datum"];
const RESULT_COLUMN_NAMES = ["výsledek", "vysledek"];

function normalizeHeader(h: unknown): string {
  return String(h ?? "").trim().toLowerCase();
}

/** Odstraní vedoucí číselné ID klubu z ISSF exportu, např. "4110181 - TJ Sokol V. Hleďsebe" -> "TJ Sokol V. Hleďsebe". */
function stripClubId(teamLabel: string): string {
  return teamLabel.replace(/^\d+\s*-\s*/, "").trim();
}

/** "15.08.2026 17:00" nebo "15.08.2026" -> "15-08-2026". Vrací null, pokud formát nesedí. */
function parseIssfDate(value: unknown): string | null {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(String(value ?? "").trim());
  if (!match) return null;
  const [, d, m, y] = match;
  return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
}

/** "2 : 0" -> "2:0"; "-- : --" nebo prázdné -> "" (zápas se ještě nehrál). */
function parseIssfResult(value: unknown): string {
  const raw = String(value ?? "").trim();
  const match = /^(\d+)\s*:\s*(\d+)$/.exec(raw);
  return match ? `${match[1]}:${match[2]}` : "";
}

function findColumn(header: string[], candidates: string[]): number {
  return header.findIndex((h) => candidates.includes(normalizeHeader(h)));
}

/**
 * Rozparsuje ISSF/FAČR export rozpisu zápasů (.xls/.xlsx) – sloupce "Domácí"/"Hosté"/"Datum a čas"/"Výsledek".
 * Náš tým se pozná automaticky jako ten, co se v obou sloupcích opakuje nejčastěji napříč řádky
 * (rozpis je vždy pro JEDEN konkrétní tým, takže by měl být na jedné či druhé straně v každém řádku).
 */
export function parseFixtureWorkbook(buffer: ArrayBuffer): FixtureImportResult {
  const warnings: string[] = [];
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  if (rows.length === 0) return { fixtures: [], ourTeamLabel: "", warnings: [t("import.emptyFile")] };

  const header = rows[0].map((h) => String(h ?? ""));
  const homeCol = findColumn(header, HOME_COLUMN_NAMES);
  const awayCol = findColumn(header, AWAY_COLUMN_NAMES);
  const dateCol = findColumn(header, DATE_COLUMN_NAMES);
  const resultCol = findColumn(header, RESULT_COLUMN_NAMES);

  if (homeCol === -1 || awayCol === -1 || dateCol === -1) {
    return {
      fixtures: [],
      ourTeamLabel: "",
      warnings: [t("import.wrongColumns")],
    };
  }

  const dataRows = rows.slice(1).filter((r) => r.some((c) => String(c ?? "").trim() !== ""));

  // Tým, co se objevuje nejčastěji napříč sloupci Domácí/Hosté, je "náš" tým.
  const counts = new Map<string, number>();
  for (const row of dataRows) {
    for (const col of [homeCol, awayCol]) {
      const label = String(row[col] ?? "").trim();
      if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  let ourTeamRaw = "";
  let ourTeamCount = 0;
  for (const [label, count] of counts.entries()) {
    if (count > ourTeamCount) {
      ourTeamRaw = label;
      ourTeamCount = count;
    }
  }

  const fixtures: ParsedFixture[] = [];
  for (const row of dataRows) {
    const homeRaw = String(row[homeCol] ?? "").trim();
    const awayRaw = String(row[awayCol] ?? "").trim();
    const date = parseIssfDate(row[dateCol]);
    if (!date || !homeRaw || !awayRaw) continue;

    const isHome = homeRaw === ourTeamRaw;
    const isAway = awayRaw === ourTeamRaw;
    if (!isHome && !isAway) continue; // řádek bez našeho týmu (nemělo by nastat, ale pro jistotu)

    fixtures.push({
      date,
      opponent: stripClubId(isHome ? awayRaw : homeRaw),
      homeAway: isHome ? HomeAway.HOME : HomeAway.AWAY,
      matchType: MatchType.COMPETITIVE,
      result: resultCol !== -1 ? parseIssfResult(row[resultCol]) : "",
    });
  }

  if (fixtures.length === 0) {
    warnings.push(t("import.noRows"));
  }

  return { fixtures, ourTeamLabel: stripClubId(ourTeamRaw), warnings };
}
