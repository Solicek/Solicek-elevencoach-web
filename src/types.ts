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

export const HomeAway = {
  HOME: "Doma",
  AWAY: "Venku",
} as const;
export const allHomeAway = [HomeAway.HOME, HomeAway.AWAY];

export const AttendanceKind = {
  TRAINING: "Trénink",
  FRIENDLY: MatchType.FRIENDLY,
  COMPETITIVE: MatchType.COMPETITIVE,
} as const;
export const allAttendanceKinds = [AttendanceKind.TRAINING, AttendanceKind.FRIENDLY, AttendanceKind.COMPETITIVE];

export interface PlayerMatchStat {
  goals: number;
  ownGoals: number; // vlastní gól – počítá se do skóre SOUPEŘE, ne do gólů hráče/týmu
  assists: number;
  yellowCards: number;
  redCards: number;
  rating: number; // 0 = nehodnoceno, 1-5 hvězdiček
  // Rozpad karet podle důvodu, pro záložku Pokuty. U starších zápasů 0 (typ karty
  // nejde zpětně odvodit) – yellowCards/redCards výše zůstávají zdrojem pravdy pro
  // sezónní statistiky, tahle pole se dopočítávají navíc jen při uložení dialogem.
  yellowFoulCards: number; // žlutá za faul
  yellowDissentCards: number; // žlutá za řeči
  straightRedCards: number; // přímá červená
  secondYellowRedCards: number; // 2. žlutá -> červená (počet takových případů v zápase)
}

export interface FineRates {
  yellowFoul: number;
  yellowDissent: number;
  secondYellowRed: number;
  straightRed: number;
}

export const defaultFineRates: FineRates = {
  yellowFoul: 50,
  yellowDissent: 100,
  secondYellowRed: 250,
  straightRed: 200,
};

export interface FinePayment {
  id: string;
  matchId: string;
  playerName: string;
  paid: boolean;
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
  homeAway: string; // "Doma" / "Venku" / "" u starších záznamů, kde se nezadávalo
  closed: boolean; // ručně uzavřeno trenérem – sestava a docházka se dál needitují
  unlocked?: boolean; // ručně odemknuto trenérem přes 2týdenní zámek needitovatelnosti starých zápasů
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

export const DiagramBackground = {
  FULL: "Celé hřiště",
  HALF: "Půlka hřiště",
} as const;
export const allDiagramBackgrounds = [DiagramBackground.FULL, DiagramBackground.HALF];

export const DiagramElementType = {
  PLAYER_RED: "Hráč (červený)",
  PLAYER_BLACK: "Hráč (černý)",
  GOALKEEPER: "Brankářský panák",
  SLALOM_POLE: "Slalomová tyč",
  CONE: "Kužel",
  GOAL_MINI: "Minibrána",
  GOAL_FULL: "Branka",
  BALL: "Míč",
} as const;
// GOAL_MINI se v paletě nenabízí – od zavedení nastavitelné velikosti (scale) branky je
// zbytečná duplicita, "Branka" zmenšená na míru pokryje i minibránu. Konstanta zůstává kvůli
// starším uloženým nákresům, které minibránu ještě mají.
export const allDiagramElementTypes = [
  DiagramElementType.PLAYER_RED,
  DiagramElementType.PLAYER_BLACK,
  DiagramElementType.SLALOM_POLE,
  DiagramElementType.CONE,
  DiagramElementType.GOAL_FULL,
  DiagramElementType.BALL,
];

export interface TrainingDiagramElement {
  id: string;
  type: string; // hodnota z DiagramElementType
  x: number; // 0..1, normalizované jako DiagramPoint
  y: number;
  color?: string; // hex, jen pro DiagramElementType.CONE
  rotation?: number; // stupně (0-359), jen pro GOAL_MINI/GOAL_FULL
  scale?: number; // násobek výchozí velikosti (výchozí 1), jen pro GOAL_MINI/GOAL_FULL
}

export const ArrowStyle = {
  DRIBBLE: "Vedení míče",
  DRIBBLE_ACCEL: "Vedení míče se zrychlením",
  DRIBBLE_AROUND: "Obcházení soupeře/překážky",
  PASS: "Přihrávka",
  PASS_AERIAL: "Přihrávka vzduchem",
  SHOT: "Střelba",
  MOVEMENT: "Pohyb hráče bez míče",
} as const;
export const allArrowStyles = [
  ArrowStyle.DRIBBLE,
  ArrowStyle.DRIBBLE_ACCEL,
  ArrowStyle.DRIBBLE_AROUND,
  ArrowStyle.PASS,
  ArrowStyle.PASS_AERIAL,
  ArrowStyle.SHOT,
  ArrowStyle.MOVEMENT,
];

export interface TrainingDiagramArrow {
  id: string;
  points: DiagramPoint[]; // 0..1, aspoň 2 body; mezilehlé body = kužely/překážky, kolem kterých šipka obíhá
  style: string; // hodnota z ArrowStyle
  number: number | null;
}

export interface TrainingDiagram {
  id: string;
  name: string;
  background: string; // hodnota z DiagramBackground
  elements: TrainingDiagramElement[];
  arrows: TrainingDiagramArrow[];
}
