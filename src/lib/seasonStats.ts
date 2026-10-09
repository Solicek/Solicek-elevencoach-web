import type { ArchivedLineup, PlayerMatchStat } from "../types";
import { HomeAway, MatchType } from "../types";

/**
 * Vytáhne z volného textu výsledku (např. "1:1 (1:0)") celkové skóre – první nalezený vzor "X:Y".
 * Vrací čísla v pořadí, jak jsou napsaná (domácí:hosté), ne "naše:soupeřovo" – pro to použij
 * goalsForAgainst().
 */
export function parseScore(result: string): [number, number] | null {
  const match = /(\d+)\s*:\s*(\d+)/.exec(result);
  if (!match) return null;
  const first = Number(match[1]);
  const second = Number(match[2]);
  if (Number.isNaN(first) || Number.isNaN(second)) return null;
  return [first, second];
}

/**
 * Skóre v pohledu "naše góly : góly soupeře", bez ohledu na to, jestli se hrálo doma nebo venku
 * (výsledek se zadává v pořadí domácí:hosté). U starších záznamů bez domácí/venku (homeAway === "")
 * se drží původní konvence, kdy se první číslo vždy zadávalo jako naše skóre.
 */
export function goalsForAgainst(entry: ArchivedLineup): [number, number] | null {
  const score = parseScore(entry.result);
  if (!score) return null;
  const [first, second] = score;
  return entry.homeAway === HomeAway.AWAY ? [second, first] : [first, second];
}

export interface SeasonRecord {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  played: number; // všechny soutěžní zápasy, i ty bez zadaného výsledku
  missingResults: number; // odehrané soutěžní zápasy, kterým chybí zadaný výsledek
}

/**
 * Do V/R/P a skóre se počítá jen zápas s platně zadaným výsledkem (bez něj nejde poznat výhru
 * od prohry) – ale "played" zahrnuje úplně všechny odehrané soutěžní zápasy, takže je vidět,
 * kolika z nich ještě chybí dopsat výsledek.
 */
export function computeSeasonRecord(archive: ArchivedLineup[]): SeasonRecord {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let missingResults = 0;
  for (const entry of archive) {
    const score = goalsForAgainst(entry);
    if (!score) {
      missingResults++;
      continue;
    }
    const [gf, ga] = score;
    goalsFor += gf;
    goalsAgainst += ga;
    if (gf > ga) wins++;
    else if (gf < ga) losses++;
    else draws++;
  }
  return { wins, draws, losses, goalsFor, goalsAgainst, played: archive.length, missingResults };
}

export interface PlayerSeasonStats {
  name: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  avgRating: number;
  ratedMatches: number;
}

export function computePlayerSeasonStats(archive: ArchivedLineup[]): PlayerSeasonStats[] {
  const statsByPlayer = new Map<string, PlayerMatchStat[]>();
  for (const entry of archive) {
    for (const [name, stat] of Object.entries(entry.playerStats)) {
      if (!statsByPlayer.has(name)) statsByPlayer.set(name, []);
      statsByPlayer.get(name)!.push(stat);
    }
  }
  const result: PlayerSeasonStats[] = [];
  for (const [name, stats] of statsByPlayer.entries()) {
    const rated = stats.filter((s) => s.rating > 0);
    const seasonStat: PlayerSeasonStats = {
      name,
      goals: stats.reduce((sum, s) => sum + s.goals, 0),
      assists: stats.reduce((sum, s) => sum + s.assists, 0),
      yellowCards: stats.reduce((sum, s) => sum + s.yellowCards, 0),
      redCards: stats.reduce((sum, s) => sum + s.redCards, 0),
      avgRating: rated.length > 0 ? rated.reduce((sum, s) => sum + s.rating, 0) / rated.length : 0,
      ratedMatches: rated.length,
    };
    if (seasonStat.goals > 0 || seasonStat.assists > 0 || seasonStat.yellowCards > 0 || seasonStat.redCards > 0 || seasonStat.ratedMatches > 0) {
      result.push(seasonStat);
    }
  }
  result.sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.name.localeCompare(b.name));
  return result;
}

/** Barva pořadí v žebříčku – zlatá/stříbrná/bronzová pro první tři místa, jinak šedá. */
export function rankColor(position: number): string {
  if (position === 1) return "#FFC107";
  if (position === 2) return "#B0BEC5";
  if (position === 3) return "#CD7F32";
  return "gray";
}

export function competitiveOnly(archive: ArchivedLineup[]): ArchivedLineup[] {
  return archive.filter((e) => e.matchType === MatchType.COMPETITIVE);
}
