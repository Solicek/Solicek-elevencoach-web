export interface PlayerPosition {
  id: string;
  label: string;
  xPercent: number;
  yPercent: number;
}

export interface Player {
  id: string;
  name: string;
  preferredPositions: string[];
  positionKey: string | null;
  positionDisplayName: string | null;
}

export interface Substitute {
  id: string;
  name: string;
  positions: string[];
}

export const MatchType = {
  COMPETITIVE: "Soutěžní",
  FRIENDLY: "Přátelské",
} as const;
export const allMatchTypes = [MatchType.COMPETITIVE, MatchType.FRIENDLY];

export const AttendanceKind = {
  TRAINING: "Trénink",
  FRIENDLY: MatchType.FRIENDLY,
  COMPETITIVE: MatchType.COMPETITIVE,
} as const;
export const allAttendanceKinds = [AttendanceKind.TRAINING, AttendanceKind.FRIENDLY, AttendanceKind.COMPETITIVE];

export interface PlayerMatchStat {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  rating: number; // 0 = nehodnoceno, 1-5 hvězdiček
}

export interface ArchivedLineup {
  id: string;
  date: string;
  opponent: string;
  formationName: string;
  names: Record<string, string>;
  substitutes: Substitute[];
  notes: string;
  photoPaths: string[]; // URL z Firebase Storage (nové pole pro web)
  result: string;
  playerStats: Record<string, PlayerMatchStat>;
  matchType: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  playerNames: string[];
  absentNames: string[];
  trainingId: string | null;
  matchId: string | null;
  kind: string;
}

export interface TrainingBlock {
  id: string;
  title: string;
  description: string;
  minutes: number;
}

export interface TrainingSession {
  id: string;
  date: string;
  blocks: TrainingBlock[];
  notes: string;
}

export interface TrainingTemplate {
  id: string;
  name: string;
  blocks: TrainingBlock[];
}

export interface DiagramPoint {
  x: number;
  y: number;
}

export interface Drill {
  id: string;
  name: string;
  category: string;
  description: string;
  isCustom: boolean;
  diagram: DiagramPoint[][];
}
