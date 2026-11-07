/**
 * Přehrání nákresu z Tréninku (beta) jako animace.
 *
 * Nic nového se do nákresu neukládá – scénář se odvodí z toho, co nakreslený nákres už má:
 *  - ŠIPKY mají pořadové číslo (to, co se v editoru nastavuje tlačítky +/−). Šipky se stejným
 *    číslem se přehrají NAJEDNOU, různá čísla jdou po sobě. Šipky bez čísla tvoří první krok,
 *    takže i nečíslovaný nákres se dá přehrát (všechno naráz).
 *  - STYL šipky říká, co se po ní pohybuje: u přihrávky a střelby letí míč sám, u vedení míče
 *    se hýbe hráč i s míčem, u pohybu bez míče jen hráč.
 *  - HRÁČ patřící k šipce se najde jako nejbližší prvek k jejímu začátku (do ACTOR_RADIUS),
 *    protože šipka se kreslí od hráče. Když tam žádný není, pohne se jen míč.
 */
import type { TrainingDiagram, TrainingDiagramArrow, TrainingDiagramElement } from "../types";
import { ArrowStyle, DiagramElementType } from "../types";
import { isCurvedArrowStyle } from "./drawing";

export interface Point {
  x: number;
  y: number;
}

/** Jak daleko od začátku šipky se ještě hledá hráč, který se po ní vydá (v dílech plochy). */
const ACTOR_RADIUS = 0.08;
/** Délka kroku: základ + čas úměrný délce dráhy, ať krátká přihrávka netrvá jako sprint. */
const STEP_BASE_MS = 450;
const STEP_PER_LENGTH_MS = 1600;
const STEP_MAX_MS = 2600;
/** Pauza mezi kroky, ať je poznat, že jeden skončil a druhý začíná. */
const STEP_GAP_MS = 250;

/** Styly, u kterých se po šipce veze míč. */
const BALL_STYLES = new Set<string>([
  ArrowStyle.DRIBBLE,
  ArrowStyle.DRIBBLE_ACCEL,
  ArrowStyle.DRIBBLE_AROUND,
  ArrowStyle.PASS,
  ArrowStyle.PASS_AERIAL,
  ArrowStyle.SHOT,
]);

/** Styly, u kterých se po šipce vydá i hráč (u přihrávky a střelby zůstává stát). */
const PLAYER_MOVES_STYLES = new Set<string>([
  ArrowStyle.DRIBBLE,
  ArrowStyle.DRIBBLE_ACCEL,
  ArrowStyle.DRIBBLE_AROUND,
  ArrowStyle.MOVEMENT,
]);

/** Prvky, které se vůbec můžou hýbat – kužel ani branka po šipce nikam nejdou. */
const MOVABLE_TYPES = new Set<string>([
  DiagramElementType.PLAYER_RED,
  DiagramElementType.PLAYER_BLACK,
  DiagramElementType.GOALKEEPER,
]);

export interface AnimationMove {
  arrowId: string;
  path: Point[];
  style: string;
  /** Prvek (hráč), který se po dráze pohybuje; null = pohybuje se jen míč. */
  playerId: string | null;
  /** Veze se po dráze i míč (vedení míče, přihrávka, střelba)? */
  movesBall: boolean;
}

export interface AnimationStep {
  startMs: number;
  durationMs: number;
  moves: AnimationMove[];
}

export interface Animation {
  steps: AnimationStep[];
  totalMs: number;
}

/** Už projetá část dráhy – kreslí se jako stopa za hráčem/míčem. */
export interface AnimationTrace {
  arrowId: string;
  points: Point[];
  /** Probíhá tahle dráha právě teď? Aktivní stopa je výraznější než ty dojeté. */
  active: boolean;
  movesBall: boolean;
}

export interface AnimationFrame {
  /** Pozice prvků v daném čase – klíč je id prvku; co tam není, se nehýbalo. */
  elementPositions: Map<string, Point>;
  /** Pozice míče, nebo null, když nákres s míčem vůbec nepracuje. */
  ball: Point | null;
  /** Šipky, po kterých se právě někdo pohybuje – pro zvýraznění probíhající akce. */
  activeArrowIds: Set<string>;
  /** Prvky, které se právě hýbou – zvýrazní se kroužkem, ať je vidět, kdo jde. */
  movingElementIds: Set<string>;
  /** Stopy za pohybem, v pořadí od nejstarší. */
  traces: AnimationTrace[];
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Délka dráhy (lomené čáry) v dílech plochy. */
function pathLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i]);
  return total;
}

/**
 * Bod na dráze v poměrné části t (0..1). Přihrávka vzduchem se vykresluje jako kvadratická
 * křivka přes prostřední bod, takže se po ní i animuje jako křivka – jinak by míč letěl
 * jinudy, než kudy vede nakreslená čára.
 */
export function pointOnPath(points: Point[], t: number, style?: string): Point {
  const clamped = Math.min(1, Math.max(0, t));
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  if (style && isCurvedArrowStyle(style) && points.length === 3) {
    const [p0, p1, p2] = points;
    const inv = 1 - clamped;
    return {
      x: inv * inv * p0.x + 2 * inv * clamped * p1.x + clamped * clamped * p2.x,
      y: inv * inv * p0.y + 2 * inv * clamped * p1.y + clamped * clamped * p2.y,
    };
  }

  const total = pathLength(points);
  if (total === 0) return points[0];
  let remaining = total * clamped;
  for (let i = 1; i < points.length; i++) {
    const segment = distance(points[i - 1], points[i]);
    if (remaining <= segment || i === points.length - 1) {
      const ratio = segment === 0 ? 0 : Math.min(1, remaining / segment);
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * ratio,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * ratio,
      };
    }
    remaining -= segment;
  }
  return points[points.length - 1];
}

/**
 * Část dráhy od začátku po poměrnou část t – kreslí se jako stopa za pohybem. Oblouk se
 * navzorkuje na víc bodů, aby stopa kopírovala křivku, ne tětivu.
 */
export function pathUpTo(points: Point[], t: number, style?: string): Point[] {
  const clamped = Math.min(1, Math.max(0, t));
  if (points.length < 2 || clamped <= 0) return [];

  if (style && isCurvedArrowStyle(style) && points.length === 3) {
    const samples = 24;
    const result: Point[] = [];
    for (let i = 0; i <= samples; i++) result.push(pointOnPath(points, (clamped * i) / samples, style));
    return result;
  }

  const total = pathLength(points);
  if (total === 0) return [];
  const target = total * clamped;
  const result: Point[] = [points[0]];
  let travelled = 0;
  for (let i = 1; i < points.length; i++) {
    const segment = distance(points[i - 1], points[i]);
    if (travelled + segment >= target) {
      result.push(pointOnPath(points, clamped));
      break;
    }
    travelled += segment;
    result.push(points[i]);
  }
  return result;
}

/** Hráč nejblíž začátku šipky – ten se po ní vydá. */
function findActor(arrow: TrainingDiagramArrow, elements: TrainingDiagramElement[]): string | null {
  const start = arrow.points[0];
  if (!start) return null;
  let bestId: string | null = null;
  let bestDistance = ACTOR_RADIUS;
  for (const element of elements) {
    if (!MOVABLE_TYPES.has(element.type)) continue;
    const d = distance(start, element);
    if (d <= bestDistance) {
      bestDistance = d;
      bestId = element.id;
    }
  }
  return bestId;
}

/** Scénář animace složený ze šipek nákresu. Nákres bez šipek vrací prázdnou animaci. */
export function buildAnimation(diagram: TrainingDiagram): Animation {
  const usable = diagram.arrows.filter((a) => a.points.length >= 2);
  if (usable.length === 0) return { steps: [], totalMs: 0 };

  // Nečíslované šipky dostanou pořadí 0, takže se přehrají jako první krok (a společně).
  const byNumber = new Map<number, TrainingDiagramArrow[]>();
  for (const arrow of usable) {
    const order = arrow.number ?? 0;
    if (!byNumber.has(order)) byNumber.set(order, []);
    byNumber.get(order)!.push(arrow);
  }

  const steps: AnimationStep[] = [];
  let cursor = 0;
  for (const order of Array.from(byNumber.keys()).sort((a, b) => a - b)) {
    const arrows = byNumber.get(order)!;
    const moves: AnimationMove[] = arrows.map((arrow) => ({
      arrowId: arrow.id,
      path: arrow.points.map((p) => ({ x: p.x, y: p.y })),
      style: arrow.style,
      playerId: PLAYER_MOVES_STYLES.has(arrow.style) ? findActor(arrow, diagram.elements) : null,
      movesBall: BALL_STYLES.has(arrow.style),
    }));
    // Krok trvá podle své nejdelší dráhy – souběžné šipky tak doběhnou společně.
    const longest = Math.max(...arrows.map((a) => pathLength(a.points)));
    const durationMs = Math.min(STEP_MAX_MS, STEP_BASE_MS + longest * STEP_PER_LENGTH_MS);
    steps.push({ startMs: cursor, durationMs, moves });
    cursor += durationMs + STEP_GAP_MS;
  }

  // Konec se bere z posledního kroku, ne jako "cursor - mezera" – odečítání float čísel
  // umí minout o setinu milisekundy a poslední krok by pak navždy vypadal jako probíhající.
  const last = steps[steps.length - 1];
  return { steps, totalMs: last ? last.startMs + last.durationMs : 0 };
}

/**
 * Stav nákresu v čase `timeMs`. Kroky, které už proběhly, se započítají celé – prvky tak
 * zůstanou tam, kam je předchozí šipka dovedla, a navazující šipka pokračuje odtud.
 */
export function sampleAnimation(animation: Animation, diagram: TrainingDiagram, timeMs: number): AnimationFrame {
  const elementPositions = new Map<string, Point>();
  const activeArrowIds = new Set<string>();
  const movingElementIds = new Set<string>();
  const traces: AnimationTrace[] = [];

  const ballElement = diagram.elements.find((e) => e.type === DiagramElementType.BALL);
  let ball: Point | null = ballElement ? { x: ballElement.x, y: ballElement.y } : null;

  for (const step of animation.steps) {
    const elapsed = timeMs - step.startMs;
    if (elapsed <= 0) break;
    const t = Math.min(1, elapsed / step.durationMs);
    // Dojetý krok se nesmí tvářit jako probíhající ani při zaokrouhlovací chybě.
    const isRunning = t < 0.999;

    for (const move of step.moves) {
      if (isRunning) {
        activeArrowIds.add(move.arrowId);
        if (move.playerId) movingElementIds.add(move.playerId);
      }
      if (move.playerId) elementPositions.set(move.playerId, pointOnPath(move.path, t));
      // Míč letí přesně po nakreslené čáře (u přihrávky vzduchem po oblouku).
      if (move.movesBall) ball = pointOnPath(move.path, t, move.style);
      traces.push({
        arrowId: move.arrowId,
        points: pathUpTo(move.path, t, move.style),
        active: isRunning,
        movesBall: move.movesBall,
      });
    }
  }

  return { elementPositions, ball, activeArrowIds, movingElementIds, traces };
}
