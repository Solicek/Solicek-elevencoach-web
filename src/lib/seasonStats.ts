import type { ArchivedLineup, PlayerMatchStat } from "../types";
import { MatchType } from "../types";

/** Vytáhne z volného textu výsledku (např. "1:1 (1:0)") celkové skóre – první nalezený vzor "X:Y". */
export function parseScore(result: string): [number, number] | null {
  const match = /(\d+)\s*:\s*(\d+)/.exec(result);
  if (!match) return null;
  const home = Number(match[1]);
  const away = Number(match[2]);
  if (Number.isNaN(home) || Number.isNaN(away)) return null;
  return [home, away];
}

export interface SeasonRecord {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export function computeSeasonRecord(archive: ArchivedLineup[]): SeasonRecord {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  for (const entry of archive) {
    const score = parseScore(entry.result);
    if (!score) continue;
    const [gf, ga] = score;
    goalsFor += gf;
    goalsAgainst += ga;
    if (gf > ga) wins++;
    else if (gf < ga) losses++;
    else draws++;
  }
  return { wins, draws, losses, goalsFor, goalsAgainst };
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
