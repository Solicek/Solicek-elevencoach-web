import type {
  ArchivedLineup,
  AttendanceRecord,
  DiagramPoint,
  Drill,
  FinePayment,
  FineRates,
  Player,
  PlayerMatchStat,
  Substitute,
  TrainingBlock,
  TrainingDiagram,
  TrainingDiagramArrow,
  TrainingDiagramElement,
  TrainingSession,
  TrainingTemplate,
} from "../types";
import { AttendanceKind, defaultFineRates, DiagramBackground, MatchType } from "../types";
import { formationNames } from "../formations";

type Doc = Record<string, unknown>;

export function substituteToMap(s: Substitute): Doc {
  return { id: s.id, name: s.name, positions: s.positions };
}

export function mapToSubstitute(m: Doc): Substitute {
  return {
    id: (m.id as string) ?? crypto.randomUUID(),
    name: (m.name as string) ?? "",
    positions: Array.isArray(m.positions) ? (m.positions as string[]) : [],
  };
}

export function playerToMap(p: Player): Doc {
  return {
    id: p.id,
    name: p.name,
    preferredPositions: p.preferredPositions,
    positionKey: p.positionKey,
    positionDisplayName: p.positionDisplayName,
  };
}

export function mapToPlayer(id: string, data: Doc): Player {
  return {
    id,
    name: (data.name as string) ?? "",
    preferredPositions: Array.isArray(data.preferredPositions) ? (data.preferredPositions as string[]) : [],
    positionKey: (data.positionKey as string) ?? null,
    positionDisplayName: (data.positionDisplayName as string) ?? null,
  };
}

export function playerMatchStatToMap(s: PlayerMatchStat): Doc {
  return {
    goals: s.goals,
    ownGoals: s.ownGoals,
    assists: s.assists,
    yellowCards: s.yellowCards,
    redCards: s.redCards,
    rating: s.rating,
    yellowFoulCards: s.yellowFoulCards,
    yellowDissentCards: s.yellowDissentCards,
    straightRedCards: s.straightRedCards,
    secondYellowRedCards: s.secondYellowRedCards,
  };
}

export function mapToPlayerMatchStat(m: Doc): PlayerMatchStat {
  return {
    goals: Number(m.goals) || 0,
    ownGoals: Number(m.ownGoals) || 0,
    assists: Number(m.assists) || 0,
    yellowCards: Number(m.yellowCards) || 0,
    redCards: Number(m.redCards) || 0,
    rating: Number(m.rating) || 0,
    yellowFoulCards: Number(m.yellowFoulCards) || 0,
    yellowDissentCards: Number(m.yellowDissentCards) || 0,
    straightRedCards: Number(m.straightRedCards) || 0,
    secondYellowRedCards: Number(m.secondYellowRedCards) || 0,
  };
}

export function fineRatesToMap(r: FineRates): Doc {
  return { yellowFoul: r.yellowFoul, yellowDissent: r.yellowDissent, secondYellowRed: r.secondYellowRed, straightRed: r.straightRed };
}

export function mapToFineRates(m: Doc | undefined): FineRates {
  if (!m) return defaultFineRates;
  return {
    yellowFoul: Number(m.yellowFoul) || defaultFineRates.yellowFoul,
    yellowDissent: Number(m.yellowDissent) || defaultFineRates.yellowDissent,
    secondYellowRed: Number(m.secondYellowRed) || defaultFineRates.secondYellowRed,
    straightRed: Number(m.straightRed) || defaultFineRates.straightRed,
  };
}

export function finePaymentToMap(p: FinePayment): Doc {
  return { matchId: p.matchId, playerName: p.playerName, paid: p.paid };
}

export function mapToFinePayment(id: string, data: Doc): FinePayment {
  return {
    id,
    matchId: (data.matchId as string) ?? "",
    playerName: (data.playerName as string) ?? "",
    paid: Boolean(data.paid),
  };
}

export function archivedLineupToMap(e: ArchivedLineup): Doc {
  return {
    date: e.date,
    opponent: e.opponent,
    formationName: e.formationName,
    names: e.names,
    substitutes: e.substitutes.map(substituteToMap),
    notes: e.notes,
    photoPaths: e.photoPaths,
    result: e.result,
    playerStats: Object.fromEntries(Object.entries(e.playerStats).map(([k, v]) => [k, playerMatchStatToMap(v)])),
    matchType: e.matchType,
    homeAway: e.homeAway,
    closed: e.closed,
    unlocked: e.unlocked ?? false,
  };
}

export function mapToArchivedLineup(id: string, data: Doc): ArchivedLineup {
  const names = (data.names as Record<string, string>) ?? {};
  const substitutesRaw = Array.isArray(data.substitutes) ? (data.substitutes as Doc[]) : [];
  const statsRaw = (data.playerStats as Record<string, Doc>) ?? {};
  const playerStats: Record<string, PlayerMatchStat> = {};
  for (const [k, v] of Object.entries(statsRaw)) playerStats[k] = mapToPlayerMatchStat(v ?? {});
  return {
    id,
    date: (data.date as string) ?? "",
    opponent: (data.opponent as string) ?? "",
    formationName: (data.formationName as string) ?? formationNames[0],
    names,
    substitutes: substitutesRaw.map(mapToSubstitute),
    notes: (data.notes as string) ?? "",
    photoPaths: Array.isArray(data.photoPaths) ? (data.photoPaths as string[]) : [],
    result: (data.result as string) ?? "",
    playerStats,
    matchType: (data.matchType as string) ?? MatchType.COMPETITIVE,
    homeAway: (data.homeAway as string) ?? "",
    closed: Boolean(data.closed),
    unlocked: Boolean(data.unlocked),
  };
}

export function attendanceRecordToMap(r: AttendanceRecord): Doc {
  return {
    date: r.date,
    playerNames: r.playerNames,
    absentNames: r.absentNames,
    trainingId: r.trainingId,
    matchId: r.matchId,
    kind: r.kind,
  };
}

export function mapToAttendanceRecord(id: string, data: Doc): AttendanceRecord {
  const trainingId = (data.trainingId as string) ?? null;
  const matchId = (data.matchId as string) ?? null;
  const defaultKind = trainingId ? AttendanceKind.TRAINING : matchId ? AttendanceKind.COMPETITIVE : AttendanceKind.TRAINING;
  return {
    id,
    date: (data.date as string) ?? "",
    playerNames: Array.isArray(data.playerNames) ? (data.playerNames as string[]) : [],
    absentNames: Array.isArray(data.absentNames) ? (data.absentNames as string[]) : [],
    trainingId,
    matchId,
    kind: (data.kind as string) ?? defaultKind,
  };
}

export function trainingBlockToMap(b: TrainingBlock): Doc {
  return { id: b.id, title: b.title, description: b.description, minutes: b.minutes };
}

export function mapToTrainingBlock(m: Doc): TrainingBlock {
  return {
    id: (m.id as string) ?? crypto.randomUUID(),
    title: (m.title as string) ?? "",
    description: (m.description as string) ?? "",
    minutes: Number(m.minutes) || 0,
  };
}

export function trainingSessionToMap(t: TrainingSession): Doc {
  return { date: t.date, blocks: t.blocks.map(trainingBlockToMap), notes: t.notes };
}

export function mapToTrainingSession(id: string, data: Doc): TrainingSession {
  const blocksRaw = Array.isArray(data.blocks) ? (data.blocks as Doc[]) : [];
  return {
    id,
    date: (data.date as string) ?? "",
    blocks: blocksRaw.map(mapToTrainingBlock),
    // Starší záznamy měly jen volný text v poli "plan" – při čtení ho zachováme v poznámkách.
    notes: (data.notes as string) ?? (data.plan as string) ?? "",
  };
}

/**
 * Firestore nepodporuje pole polí přímo do sebe – jeden tah náčrtku (pole bodů) proto
 * zabalíme do mapy s klíčem "points", takže výsledná struktura je pole map, ne pole polí.
 */
export function diagramToMaps(diagram: DiagramPoint[][]): Doc[] {
  return diagram.map((stroke) => ({ points: stroke.map((p) => ({ x: p.x, y: p.y })) }));
}

export function mapsToDiagram(data: unknown): DiagramPoint[][] {
  if (!Array.isArray(data)) return [];
  const result: DiagramPoint[][] = [];
  for (const strokeAny of data) {
    const points = (strokeAny as Doc)?.points;
    if (!Array.isArray(points)) continue;
    const stroke: DiagramPoint[] = [];
    for (const ptAny of points) {
      const pt = ptAny as Doc;
      if (typeof pt?.x !== "number" || typeof pt?.y !== "number") continue;
      stroke.push({ x: pt.x, y: pt.y });
    }
    result.push(stroke);
  }
  return result;
}

export function drillToMap(d: Drill): Doc {
  return { id: d.id, name: d.name, category: d.category, description: d.description, diagram: diagramToMaps(d.diagram) };
}

export function mapToDrill(id: string, data: Doc): Drill {
  return {
    id,
    name: (data.name as string) ?? "",
    category: (data.category as string) ?? "",
    description: (data.description as string) ?? "",
    isCustom: true,
    diagram: mapsToDiagram(data.diagram),
  };
}

export function trainingDiagramElementToMap(e: TrainingDiagramElement): Doc {
  return { id: e.id, type: e.type, x: e.x, y: e.y, color: e.color ?? null, rotation: e.rotation ?? null, scale: e.scale ?? null };
}

export function mapToTrainingDiagramElement(m: Doc): TrainingDiagramElement {
  return {
    id: (m.id as string) ?? crypto.randomUUID(),
    type: (m.type as string) ?? "",
    x: Number(m.x) || 0,
    y: Number(m.y) || 0,
    color: (m.color as string) ?? undefined,
    rotation: typeof m.rotation === "number" ? m.rotation : undefined,
    scale: typeof m.scale === "number" ? m.scale : undefined,
  };
}

export function trainingDiagramArrowToMap(a: TrainingDiagramArrow): Doc {
  return { id: a.id, points: a.points.map((p) => ({ x: p.x, y: p.y })), style: a.style, number: a.number };
}

export function mapToTrainingDiagramArrow(m: Doc): TrainingDiagramArrow {
  const pointsRaw = Array.isArray(m.points) ? (m.points as Doc[]) : [];
  return {
    id: (m.id as string) ?? crypto.randomUUID(),
    points: pointsRaw.map((p) => ({ x: Number(p.x) || 0, y: Number(p.y) || 0 })),
    style: (m.style as string) ?? "",
    number: typeof m.number === "number" ? m.number : null,
  };
}

export function trainingDiagramToMap(d: TrainingDiagram): Doc {
  return {
    name: d.name,
    background: d.background,
    elements: d.elements.map(trainingDiagramElementToMap),
    arrows: d.arrows.map(trainingDiagramArrowToMap),
  };
}

export function mapToTrainingDiagram(id: string, data: Doc): TrainingDiagram {
  const elementsRaw = Array.isArray(data.elements) ? (data.elements as Doc[]) : [];
  const arrowsRaw = Array.isArray(data.arrows) ? (data.arrows as Doc[]) : [];
  return {
    id,
    name: (data.name as string) ?? "",
    background: (data.background as string) ?? DiagramBackground.FULL,
    elements: elementsRaw.map(mapToTrainingDiagramElement),
    arrows: arrowsRaw.map(mapToTrainingDiagramArrow),
  };
}

export function trainingTemplateToMap(t: TrainingTemplate): Doc {
  return { name: t.name, blocks: t.blocks.map(trainingBlockToMap) };
}

export function mapToTrainingTemplate(id: string, data: Doc): TrainingTemplate {
  const blocksRaw = Array.isArray(data.blocks) ? (data.blocks as Doc[]) : [];
  return { id, name: (data.name as string) ?? "", blocks: blocksRaw.map(mapToTrainingBlock) };
}
