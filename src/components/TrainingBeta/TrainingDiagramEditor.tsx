import { useEffect, useRef, useState } from "react";
import { ChipSelector } from "../Shell/ChipSelector";
import { arrowMidpoint, defaultCurveControlPoint, drawArrow, drawHalfPitchLines, drawPitchLines, isCurvedArrowStyle, sizeCanvasToContainer } from "../../lib/drawing";
import {
  allArrowStyles,
  allDiagramBackgrounds,
  allDiagramElementTypes,
  ArrowStyle,
  DiagramBackground,
  DiagramElementType,
} from "../../types";
import type { TrainingDiagram, TrainingDiagramArrow, TrainingDiagramElement } from "../../types";
import { DiagramElementIcon } from "./DiagramElementIcon";
import { ArrowStyleIcon } from "./ArrowStyleIcon";

interface Props {
  initialDiagram: TrainingDiagram;
  onDismiss: () => void;
  onSave: (diagram: TrainingDiagram) => void;
}

interface Point {
  x: number;
  y: number;
}

const DRAG_THRESHOLD = 6;
const ARROW_MIN_DISTANCE = 15;
const WAYPOINT_SNAP_RADIUS = 26;
const ARROW_TAP_HIT_RADIUS = 16;
const ALIGN_SNAP_PX = 8;
const SQUARE_TOLERANCE_RATIO = 0.12;

/** Nejkratší vzdálenost bodu od lomené čáry (úsečka po úsečce) – pro klepnutí na šipku. */
function distanceToPolyline(pt: Point, points: Point[]): number {
  let best = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const lenSq = abx * abx + aby * aby;
    const t = lenSq < 1e-6 ? 0 : Math.max(0, Math.min(1, ((pt.x - a.x) * abx + (pt.y - a.y) * aby) / lenSq));
    const closest = { x: a.x + abx * t, y: a.y + aby * t };
    best = Math.min(best, Math.hypot(pt.x - closest.x, pt.y - closest.y));
  }
  return best;
}

export function TrainingDiagramEditor({ initialDiagram, onDismiss, onSave }: Props) {
  const [name, setName] = useState(initialDiagram.name);
  const [background, setBackground] = useState(initialDiagram.background);
  const [elements, setElements] = useState<TrainingDiagramElement[]>(initialDiagram.elements);
  const [arrows, setArrows] = useState<TrainingDiagramArrow[]>(initialDiagram.arrows);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [activeArrowStyle, setActiveArrowStyle] = useState<string>(ArrowStyle.DRIBBLE);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [arrowPreview, setArrowPreview] = useState<Point[] | null>(null);
  const [placementPreview, setPlacementPreview] = useState<{ type: string; point: Point } | null>(null);
  const [alignGuides, setAlignGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [squareGuide, setSquareGuide] = useState<{ corners: Point[]; isSquare: boolean } | null>(null);
  const placingRef = useRef<{ type: string; point: Point } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const linesCanvasRef = useRef<HTMLCanvasElement>(null);
  const arrowsCanvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const dragWaypointsRef = useRef<Point[] | null>(null);
  const lastRawPointRef = useRef<Point | null>(null);

  const elementDragRef = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  // Přiblížení plochy hřiště gestem dvou prstů (pinch-to-zoom) + posun (pan) při
  // přiblíženém pohledu. Jedním prstem se dál kreslí/přesouvá jako dřív – jakmile
  // přibude druhý prst, rozdělané jednoprsté gesto se zruší a začne pinch.
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panRef = useRef<Point>({ x: 0, y: 0 });
  zoomRef.current = zoom;
  panRef.current = pan;
  const activePointersRef = useRef<Map<number, Point>>(new Map());
  const isPinchingRef = useRef(false);
  const pinchStateRef = useRef<{ startDist: number; startZoom: number; localAnchor: Point } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function relToContainer(e: PointerEvent): Point {
      const rect = container!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function clampPan(z: number, p: Point): Point {
      if (size.width === 0 || size.height === 0 || z <= 1) return { x: 0, y: 0 };
      const minX = size.width * (1 - z);
      const minY = size.height * (1 - z);
      return { x: Math.min(0, Math.max(minX, p.x)), y: Math.min(0, Math.max(minY, p.y)) };
    }

    function updatePinch() {
      const pts = Array.from(activePointersRef.current.values());
      if (pts.length !== 2 || !pinchStateRef.current) return;
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const { startDist, startZoom, localAnchor } = pinchStateRef.current;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, startZoom * (dist / startDist)));
      const newPan = clampPan(newZoom, { x: mid.x - newZoom * localAnchor.x, y: mid.y - newZoom * localAnchor.y });
      setZoom(newZoom);
      setPan(newPan);
    }

    function onDown(e: PointerEvent) {
      activePointersRef.current.set(e.pointerId, relToContainer(e));
      if (activePointersRef.current.size === 2) {
        isPinchingRef.current = true;
        // Zrušit rozdělané jednoprsté gesto (kreslení šipky / tažení prvku) – teď
        // začíná pinch dvou prstů.
        dragWaypointsRef.current = null;
        setArrowPreview(null);
        elementDragRef.current = null;
        placingRef.current = null;
        setPlacementPreview(null);
        setAlignGuides({ x: null, y: null });
        setSquareGuide(null);
        arrowHandleDragRef.current = null;
        const pts = Array.from(activePointersRef.current.values());
        const [a, b] = pts;
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        pinchStateRef.current = {
          startDist: dist,
          startZoom: zoomRef.current,
          localAnchor: { x: (mid.x - panRef.current.x) / zoomRef.current, y: (mid.y - panRef.current.y) / zoomRef.current },
        };
      }
    }

    function onMove(e: PointerEvent) {
      if (!activePointersRef.current.has(e.pointerId)) return;
      activePointersRef.current.set(e.pointerId, relToContainer(e));
      if (isPinchingRef.current) {
        e.preventDefault();
        updatePinch();
      }
    }

    function onUp(e: PointerEvent) {
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size < 2) {
        isPinchingRef.current = false;
        pinchStateRef.current = null;
      }
    }

    // Capture fáze, ať se počet prstů spolehlivě sleduje i když jednotlivé prvky
    // (šipky/umístěné prvky) svým vlastním handlerem zavolají stopPropagation.
    container.addEventListener("pointerdown", onDown, { capture: true });
    container.addEventListener("pointermove", onMove, { capture: true });
    container.addEventListener("pointerup", onUp, { capture: true });
    container.addEventListener("pointercancel", onUp, { capture: true });
    return () => {
      container.removeEventListener("pointerdown", onDown, { capture: true } as EventListenerOptions);
      container.removeEventListener("pointermove", onMove, { capture: true } as EventListenerOptions);
      container.removeEventListener("pointerup", onUp, { capture: true } as EventListenerOptions);
      container.removeEventListener("pointercancel", onUp, { capture: true } as EventListenerOptions);
    };
  }, [size.width, size.height]);

  useEffect(() => {
    const canvas = linesCanvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;
    const ctx = sizeCanvasToContainer(canvas, size.width, size.height);
    ctx.clearRect(0, 0, size.width, size.height);
    if (background === DiagramBackground.HALF) drawHalfPitchLines(ctx, size.width, size.height);
    else drawPitchLines(ctx, size.width, size.height);
  }, [background, size]);

  useEffect(() => {
    const canvas = arrowsCanvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;
    const ctx = sizeCanvasToContainer(canvas, size.width, size.height);
    ctx.clearRect(0, 0, size.width, size.height);
    for (const arrow of arrows) {
      const pxPoints = arrow.points.map((p) => ({ x: p.x * size.width, y: p.y * size.height }));
      if (arrow.id === selectedArrowId) {
        // Zvýraznění vybrané šipky – tlustá bílá čára pod ní, ať je jasně vidět, která
        // se právě chystá smazat.
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(pxPoints[0].x, pxPoints[0].y);
        for (const p of pxPoints.slice(1)) ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.restore();
      }
      drawArrow(ctx, pxPoints, arrow.style);
    }
    if (arrowPreview && arrowPreview.length >= 2) {
      drawArrow(ctx, arrowPreview, activeArrowStyle);
    }
  }, [arrows, arrowPreview, size, activeArrowStyle, selectedArrowId]);

  function relativePoint(e: { clientX: number; clientY: number }): Point {
    // contentRef je vrstva se zoom/pan transformem – dělení zlomkem podle JEJÍ
    // aktuální (transformované) velikosti na obrazovce automaticky funguje správně
    // při libovolném přiblížení, bez ruční inverze transform matice.
    const rect = contentRef.current!.getBoundingClientRect();
    const fx = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0;
    const fy = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0;
    return { x: fx * size.width, y: fy * size.height };
  }

  // Nápověda zarovnání ("smart guides") – při umísťování/přesouvání prvku najde nejbližší
  // osu X/Y už umístěného prvku v okolí ALIGN_SNAP_PX a k ní bod přichytí, ať jde snadno
  // postavit rovnou řadu/čtverec kuželů apod. `excludeId` vynechá přesouvaný prvek sám.
  function computeAlignmentSnap(
    pt: Point,
    excludeId: string | null
  ): { point: Point; guideX: number | null; guideY: number | null; square: { corners: Point[]; isSquare: boolean } | null } {
    const width = size.width || 1;
    const height = size.height || 1;
    let guideX: number | null = null;
    let guideY: number | null = null;
    let matchedXEl: TrainingDiagramElement | null = null;
    let matchedYEl: TrainingDiagramElement | null = null;
    let bestXDist = ALIGN_SNAP_PX;
    let bestYDist = ALIGN_SNAP_PX;
    for (const el of elements) {
      if (el.id === excludeId) continue;
      const ex = el.x * width;
      const ey = el.y * height;
      const dx = Math.abs(pt.x - ex);
      if (dx < bestXDist) {
        bestXDist = dx;
        guideX = ex;
        matchedXEl = el;
      }
      const dy = Math.abs(pt.y - ey);
      if (dy < bestYDist) {
        bestYDist = dy;
        guideY = ey;
        matchedYEl = el;
      }
    }

    let point: Point = { x: guideX ?? pt.x, y: guideY ?? pt.y };
    let square: { corners: Point[]; isSquare: boolean } | null = null;

    // Když se bod zarovnává NAJEDNOU na X jednoho prvku a Y jiného, jde o roh obdélníka –
    // pokud navíc existuje třetí prvek zarovnaný na Y toho prvního A na X toho druhého
    // (protější roh), máme kompletní čtyřúhelník a lze porovnat, jestli jsou strany stejně
    // dlouhé (= pravidelný čtverec), případně na to délku strany jemně dorovnat.
    if (matchedXEl && matchedYEl && matchedXEl.id !== matchedYEl.id) {
      const e1x = matchedXEl.x * width;
      const e1y = matchedXEl.y * height;
      const e2x = matchedYEl.x * width;
      const e2y = matchedYEl.y * height;
      const opposite = elements.find(
        (el) =>
          el.id !== excludeId &&
          el.id !== matchedXEl!.id &&
          el.id !== matchedYEl!.id &&
          Math.abs(el.y * height - e1y) < ALIGN_SNAP_PX &&
          Math.abs(el.x * width - e2x) < ALIGN_SNAP_PX
      );
      if (opposite) {
        const ox = opposite.x * width;
        const oy = opposite.y * height;
        const sideTop = Math.abs(e1x - ox);
        const sideLeft = Math.abs(e2y - oy);
        if (sideTop > 4 && sideLeft > 4) {
          const ratio = Math.min(sideTop, sideLeft) / Math.max(sideTop, sideLeft);
          const isSquare = ratio > 1 - SQUARE_TOLERANCE_RATIO;
          if (isSquare) {
            // Skoro čtverec – jemně dorovnat obě strany na přesně stejnou délku.
            const target = (sideTop + sideLeft) / 2;
            const signX = Math.sign(point.x - e2x) || 1;
            const signY = Math.sign(point.y - e1y) || 1;
            point = { x: e2x + signX * target, y: e1y + signY * target };
          }
          square = { corners: [{ x: ox, y: oy }, { x: e1x, y: e1y }, point, { x: e2x, y: e2y }], isSquare };
        }
      }
    }

    return { point, guideX, guideY, square };
  }

  function handleCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (isPinchingRef.current) return;
    const pt = relativePoint(e);
    if (activeTool) {
      const snap = computeAlignmentSnap(pt, null);
      placingRef.current = { type: activeTool, point: snap.point };
      setPlacementPreview({ type: activeTool, point: snap.point });
      setAlignGuides({ x: snap.guideX, y: snap.guideY });
      setSquareGuide(snap.square);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    setSelectedElementId(null);
    dragWaypointsRef.current = [pt];
    lastRawPointRef.current = pt;
    setArrowPreview([pt, pt]);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (placingRef.current) {
      const snap = computeAlignmentSnap(relativePoint(e), null);
      placingRef.current = { type: placingRef.current.type, point: snap.point };
      setPlacementPreview({ type: placingRef.current.type, point: snap.point });
      setAlignGuides({ x: snap.guideX, y: snap.guideY });
      setSquareGuide(snap.square);
      return;
    }
    const waypoints = dragWaypointsRef.current;
    if (!waypoints) return;
    const curRaw = relativePoint(e);
    const prevRaw = lastRawPointRef.current ?? curRaw;
    // Přichytávání na mezilehlé prvky (aby šipka "obtékala" kužely) dává smysl jen pro
    // vedení míče/slalom – u ostatních stylů (přihrávka, střelba, pohyb…) má tažení
    // vždy vést přímo od začátku ke konci, i když prst mine nějaký prvek po cestě.
    const isDribbleStyle = activeArrowStyle === ArrowStyle.DRIBBLE || activeArrowStyle === ArrowStyle.DRIBBLE_ACCEL;
    if (isDribbleStyle) {
      // Rychlé tažení dorazí do JS jako řídké pointermove události (prohlížeč slučuje
      // sousední pozice do jedné) – proto se blízkost prvku netestuje jen vůči poslední
      // bodové pozici, ale vůči CELÉ ÚSEČCE od minulé po aktuální pozici, ať tažení
      // nepřeskočí kužel, kolem kterého ve skutečnosti prošlo.
      const candidates: { elPt: Point; t: number }[] = [];
      for (const el of elements) {
        const elPt = { x: el.x * (size.width || 1), y: el.y * (size.height || 1) };
        const alreadyIncluded = waypoints.some((w) => Math.hypot(w.x - elPt.x, w.y - elPt.y) < WAYPOINT_SNAP_RADIUS);
        if (alreadyIncluded) continue;
        const abx = curRaw.x - prevRaw.x;
        const aby = curRaw.y - prevRaw.y;
        const lenSq = abx * abx + aby * aby;
        const t = lenSq < 1e-6 ? 0 : Math.max(0, Math.min(1, ((elPt.x - prevRaw.x) * abx + (elPt.y - prevRaw.y) * aby) / lenSq));
        const closest = { x: prevRaw.x + abx * t, y: prevRaw.y + aby * t };
        if (Math.hypot(elPt.x - closest.x, elPt.y - closest.y) < WAYPOINT_SNAP_RADIUS) candidates.push({ elPt, t });
      }
      candidates.sort((a, b) => a.t - b.t);
      for (const c of candidates) waypoints.push(c.elPt);
    }
    lastRawPointRef.current = curRaw;
    setArrowPreview([...waypoints, curRaw]);
  }

  function handleCanvasPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (placingRef.current) {
      const { type, point } = placingRef.current;
      placingRef.current = null;
      setPlacementPreview(null);
      setAlignGuides({ x: null, y: null });
      setSquareGuide(null);
      const width = size.width || 1;
      const height = size.height || 1;
      const newElement: TrainingDiagramElement = {
        id: crypto.randomUUID(),
        type,
        x: point.x / width,
        y: point.y / height,
      };
      setElements((prev) => [...prev, newElement]);
      setSelectedArrowId(null);
      // Po umístění se nástroj sám odzbrojí – ať se omylem dalším klepnutím nezakreslí
      // další stejný prvek; na další je potřeba znovu klepnout do palety.
      setActiveTool(null);
      return;
    }
    const waypoints = dragWaypointsRef.current;
    dragWaypointsRef.current = null;
    setArrowPreview(null);
    if (!waypoints) return;
    const end = relativePoint(e);
    const start = waypoints[0];

    // Klepnutí (bez tažení) blízko existující šipky ji vybere (zobrazí mazací tlačítko
    // u ní) místo aby se začala kreslit nová šipka.
    if (waypoints.length === 1 && Math.hypot(end.x - start.x, end.y - start.y) < DRAG_THRESHOLD) {
      let hitId: string | null = null;
      let hitDist = ARROW_TAP_HIT_RADIUS;
      for (const arrow of arrows) {
        const w = size.width || 1;
        const h = size.height || 1;
        const pxPoints = arrow.points.map((p) => ({ x: p.x * w, y: p.y * h }));
        const d = distanceToPolyline(end, pxPoints);
        if (d < hitDist) {
          hitDist = d;
          hitId = arrow.id;
        }
      }
      setSelectedArrowId(hitId);
      return;
    }

    const last = waypoints[waypoints.length - 1];
    let points = Math.hypot(end.x - last.x, end.y - last.y) > ARROW_MIN_DISTANCE ? [...waypoints, end] : waypoints;
    if (points.length < 2) return;
    const totalLength = points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0);
    if (totalLength < ARROW_MIN_DISTANCE) return;
    // Přihrávka vzduchem: prostřední bod pole je přímo tažitelný ovládací bod oblouku
    // (ne mezilehlý waypoint) – při vzniku šipky se rovnou vloží na výchozí pozici oblouku.
    if (isCurvedArrowStyle(activeArrowStyle) && points.length === 2) {
      points = [points[0], defaultCurveControlPoint(points[0], points[1]), points[1]];
    }
    const width = size.width || 1;
    const height = size.height || 1;
    const newArrow: TrainingDiagramArrow = {
      id: crypto.randomUUID(),
      points: points.map((p) => ({ x: p.x / width, y: p.y / height })),
      style: activeArrowStyle,
      number: null,
    };
    setArrows((prev) => [...prev, newArrow]);
    setSelectedArrowId(null);
  }

  // Úchyty na jednotlivých bodech vybrané šipky – tažením koncového bodu se mění délka i
  // směr, tažením mezilehlého bodu (kužel na trase) se posouvá zákrut, stejně jako se dá
  // tažením přesouvat kterýkoliv jiný prvek (hráč, kužel...).
  const arrowHandleDragRef = useRef<{
    arrowId: string;
    pointIndex: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  function handleArrowHandlePointerDown(e: React.PointerEvent<HTMLDivElement>, arrowId: string, pointIndex: number, point: Point) {
    if (isPinchingRef.current) return;
    e.stopPropagation();
    arrowHandleDragRef.current = {
      arrowId,
      pointIndex,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: point.x,
      startY: point.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleArrowHandlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = arrowHandleDragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.startClientX) / zoomRef.current;
    const dy = (e.clientY - drag.startClientY) / zoomRef.current;
    const width = size.width || 1;
    const height = size.height || 1;
    const newX = Math.min(1, Math.max(0, drag.startX + dx / width));
    const newY = Math.min(1, Math.max(0, drag.startY + dy / height));
    setArrows((prev) =>
      prev.map((a) =>
        a.id === drag.arrowId ? { ...a, points: a.points.map((p, i) => (i === drag.pointIndex ? { x: newX, y: newY } : p)) } : a
      )
    );
  }

  function handleArrowHandlePointerUp() {
    arrowHandleDragRef.current = null;
  }

  function handleElementPointerDown(e: React.PointerEvent<HTMLDivElement>, el: TrainingDiagramElement) {
    if (isPinchingRef.current) return;
    setSelectedArrowId(null);
    e.stopPropagation();
    elementDragRef.current = {
      id: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: el.x,
      startY: el.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleElementPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = elementDragRef.current;
    if (!drag) return;
    const rawDx = e.clientX - drag.startClientX;
    const rawDy = e.clientY - drag.startClientY;
    if (Math.hypot(rawDx, rawDy) > DRAG_THRESHOLD) drag.moved = true;
    if (!drag.moved) return;
    // Posun na obrazovce dělíme aktuálním přiblížením – při zoomu odpovídá stejný
    // pohyb prstu menší logické vzdálenosti na ploše hřiště.
    const dx = rawDx / zoomRef.current;
    const dy = rawDy / zoomRef.current;
    const width = size.width || 1;
    const height = size.height || 1;
    const rawX = Math.min(1, Math.max(0, drag.startX + dx / width));
    const rawY = Math.min(1, Math.max(0, drag.startY + dy / height));
    const snap = computeAlignmentSnap({ x: rawX * width, y: rawY * height }, drag.id);
    setAlignGuides({ x: snap.guideX, y: snap.guideY });
    setSquareGuide(snap.square);
    const newX = snap.point.x / width;
    const newY = snap.point.y / height;
    setElements((prev) => prev.map((el) => (el.id === drag.id ? { ...el, x: newX, y: newY } : el)));
  }

  function handleElementPointerUp() {
    const drag = elementDragRef.current;
    elementDragRef.current = null;
    setAlignGuides({ x: null, y: null });
    setSquareGuide(null);
    if (!drag) return;
    if (!drag.moved) {
      setSelectedElementId((prev) => (prev === drag.id ? null : drag.id));
    }
  }

  function removeElement(id: string) {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedElementId(null);
  }

  function rotateElement(id: string) {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, rotation: ((el.rotation ?? 0) + 45) % 360 } : el)));
  }

  const SCALE_STEP = 0.15;
  const SCALE_MIN = 0.4;
  const SCALE_MAX = 2.5;

  function scaleElement(id: string, delta: number) {
    setElements((prev) =>
      prev.map((el) =>
        el.id === id ? { ...el, scale: Math.min(SCALE_MAX, Math.max(SCALE_MIN, (el.scale ?? 1) + delta)) } : el
      )
    );
  }

  function removeArrow(id: string) {
    setArrows((prev) => prev.filter((a) => a.id !== id));
    setSelectedArrowId((prev) => (prev === id ? null : prev));
  }

  /** +1/-1 k číslu pořadí šipky přímo z plochy hřiště; pod 1 se číslo úplně zruší. */
  function bumpArrowNumber(id: string, delta: number) {
    setArrows((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next = (a.number ?? 0) + delta;
        return { ...a, number: next > 0 ? next : null };
      })
    );
  }

  function handleToolSelect(type: string) {
    setSelectedElementId(null);
    setSelectedArrowId(null);
    setActiveTool((prev) => (prev === type ? null : type));
  }

  const aspectRatio = background === DiagramBackground.HALF ? "1.3" : "0.62";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        // dvw/dvh místo inset:0 – v mobilním Safari (iPhone) "fixed" element s inset:0
        // nesleduje spolehlivě skutečnou viditelnou výšku při schovávání adresního řádku.
        width: "100dvw",
        height: "100dvh",
        zIndex: 100,
        background: "var(--surface)",
        overflowY: "auto",
        padding: 16,
        paddingTop: "max(16px, env(safe-area-inset-top))",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn-text" onClick={onDismiss}>
          Zrušit
        </button>
        <button className="btn" style={{ width: "auto", padding: "10px 20px" }} onClick={() => onSave({ ...initialDiagram, name, background, elements, arrows })}>
          Uložit
        </button>
      </div>

      <div className="spacer-12" />
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Název nákresu" />

      <div className="spacer-12" />
      <ChipSelector options={allDiagramBackgrounds} selected={background} onSelect={setBackground} />

      <div className="spacer-12" />
      <div className="diagram-palette" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {allDiagramElementTypes.map((type) => (
          <button
            key={type}
            data-element-type={type}
            onClick={() => handleToolSelect(type)}
            title={type}
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: 6,
              borderRadius: 8,
              border: activeTool === type ? "2px solid var(--primary)" : "2px solid transparent",
              background: "var(--surface-variant)",
              cursor: "pointer",
            }}
          >
            <DiagramElementIcon type={type} size={26} />
          </button>
        ))}
      </div>

      <div className="spacer-8" />
      <p className="text-gray" style={{ fontSize: "0.75rem", marginBottom: 4 }}>
        Styl šipky (vyber a pak kresli tažením po ploše)
      </p>
      <div className="diagram-palette" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {allArrowStyles.map((style) => (
          <button
            key={style}
            data-arrow-style={style}
            onClick={() => {
              setActiveArrowStyle(style);
              setActiveTool(null);
              setSelectedElementId(null);
              setSelectedArrowId(null);
            }}
            title={style}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
              borderRadius: 8,
              border: activeArrowStyle === style && !activeTool ? "2px solid var(--primary)" : "2px solid transparent",
              background: "var(--surface-variant)",
              cursor: "pointer",
            }}
          >
            <ArrowStyleIcon style={style} />
          </button>
        ))}
      </div>

      <div className="spacer-12" />
      <p className="text-gray" style={{ fontSize: "0.75rem", marginBottom: 4 }}>
        Přiblížíš gestem dvou prstů (pinch)
      </p>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          background: "var(--pitch-green)",
          border: "2px solid white",
          overflow: "hidden",
          aspectRatio,
          touchAction: "none",
        }}
      >
        <div
          ref={contentRef}
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "0 0",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <canvas ref={linesCanvasRef} style={{ position: "absolute", inset: 0 }} />
          <canvas
            ref={arrowsCanvasRef}
            data-testid="pitch-arrows-canvas"
            style={{ position: "absolute", inset: 0 }}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
          />
        {alignGuides.x != null && (
          <div
            style={{
              position: "absolute",
              left: alignGuides.x,
              top: 0,
              bottom: 0,
              width: 0,
              borderLeft: "1px dashed #00e5ff",
              pointerEvents: "none",
            }}
          />
        )}
        {alignGuides.y != null && (
          <div
            style={{
              position: "absolute",
              top: alignGuides.y,
              left: 0,
              right: 0,
              height: 0,
              borderTop: "1px dashed #00e5ff",
              pointerEvents: "none",
            }}
          />
        )}
        {squareGuide && (
          <svg
            width={size.width || 0}
            height={size.height || 0}
            style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
          >
            <polygon
              points={squareGuide.corners.map((c) => `${c.x},${c.y}`).join(" ")}
              fill="none"
              stroke={squareGuide.isSquare ? "#00e676" : "#00e5ff"}
              strokeWidth={1.5}
              strokeDasharray="6 5"
            />
          </svg>
        )}
        {placementPreview && (
          <div
            style={{
              position: "absolute",
              left: `${(placementPreview.point.x / (size.width || 1)) * 100}%`,
              top: `${(placementPreview.point.y / (size.height || 1)) * 100}%`,
              transform: "translate(-50%, -50%)",
              opacity: 0.55,
              pointerEvents: "none",
            }}
          >
            <DiagramElementIcon type={placementPreview.type} />
          </div>
        )}
        {arrows.map((arrow) => {
          const mid = arrowMidpoint(arrow.points, arrow.style);
          return (
            arrow.number != null && (
              <div
                key={arrow.id}
                style={{
                  position: "absolute",
                  left: `${mid.x * 100}%`,
                  top: `${mid.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#ffca28",
                  color: "#000",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                {arrow.number}
              </div>
            )
          );
        })}
        {selectedArrowId &&
          (() => {
            const selected = arrows.find((a) => a.id === selectedArrowId);
            if (!selected) return null;
            const mid = arrowMidpoint(selected.points, selected.style);
            return (
              <>
                {selected.points.map((p, i) => (
                  <div
                    key={i}
                    onPointerDown={(e) => handleArrowHandlePointerDown(e, selected.id, i, p)}
                    onPointerMove={handleArrowHandlePointerMove}
                    onPointerUp={handleArrowHandlePointerUp}
                    title="Tažením uprav délku/směr šipky"
                    style={{
                      position: "absolute",
                      left: `${p.x * 100}%`,
                      top: `${p.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "white",
                      border: "2px solid var(--primary)",
                      cursor: "grab",
                      touchAction: "none",
                    }}
                  />
                ))}
                {/* Ovládací shluk vybrané šipky: mazání nad středem, +/- na číslo pořadí pod
                    středem (vlevo/vpravo) – bublinka s číslem zůstává přesně uprostřed. */}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeArrow(selected.id);
                  }}
                  style={{
                    position: "absolute",
                    left: `${mid.x * 100}%`,
                    top: `${mid.y * 100}%`,
                    transform: "translate(calc(-50% - 0px), calc(-50% - 28px))",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--error)",
                    color: "white",
                    border: "2px solid white",
                    fontSize: 15,
                    lineHeight: 1,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    bumpArrowNumber(selected.id, -1);
                  }}
                  title="Snížit číslo pořadí"
                  style={{
                    position: "absolute",
                    left: `${mid.x * 100}%`,
                    top: `${mid.y * 100}%`,
                    transform: "translate(calc(-50% - 26px), calc(-50% + 26px))",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--surface-variant)",
                    color: "white",
                    border: "2px solid var(--primary)",
                    fontSize: 16,
                    lineHeight: 1,
                    cursor: "pointer",
                  }}
                >
                  −
                </button>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    bumpArrowNumber(selected.id, 1);
                  }}
                  title="Zvýšit číslo pořadí / přidat číslo"
                  style={{
                    position: "absolute",
                    left: `${mid.x * 100}%`,
                    top: `${mid.y * 100}%`,
                    transform: "translate(calc(-50% + 26px), calc(-50% + 26px))",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--surface-variant)",
                    color: "white",
                    border: "2px solid var(--primary)",
                    fontSize: 16,
                    lineHeight: 1,
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </>
            );
          })()}
        {elements.map((el) => (
          <div
            key={el.id}
            onPointerDown={(e) => handleElementPointerDown(e, el)}
            onPointerMove={handleElementPointerMove}
            onPointerUp={handleElementPointerUp}
            style={{
              position: "absolute",
              left: `${el.x * 100}%`,
              top: `${el.y * 100}%`,
              transform: `translate(-50%, -50%) scale(${el.scale ?? 1})`,
              touchAction: "none",
              cursor: "grab",
            }}
          >
            <div style={{ transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined }}>
              <DiagramElementIcon type={el.type} color={el.color} />
            </div>
          </div>
        ))}
        {/* Ovládací tlačítka vybraného prvku se kreslí ODDĚLENĚ od jeho vlastního (škálovaného)
            wrapperu – jinak by se při zmenšení/zvětšení brány zmenšila/zvětšila i tlačítka
            a byla by nepoužitelně malá nebo nesmyslně velká. Pozice je stejná (fixní odsazení
            od rohu), jen navázaná přímo na el.x/el.y, ne na transformovaný box ikony. */}
        {(() => {
          const selected = elements.find((e) => e.id === selectedElementId);
          if (!selected) return null;
          const isGoal = selected.type === DiagramElementType.GOAL_MINI || selected.type === DiagramElementType.GOAL_FULL;
          return (
            <>
              {isGoal && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    rotateElement(selected.id);
                  }}
                  title="Otočit o 45°"
                  style={{
                    position: "absolute",
                    left: `${selected.x * 100}%`,
                    top: `${selected.y * 100}%`,
                    transform: "translate(calc(-50% - 22px), calc(-50% - 22px))",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    fontSize: 12,
                    lineHeight: 1,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ↻
                </button>
              )}
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  removeElement(selected.id);
                }}
                style={{
                  position: "absolute",
                  left: `${selected.x * 100}%`,
                  top: `${selected.y * 100}%`,
                  transform: "translate(calc(-50% + 22px), calc(-50% - 22px))",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--error)",
                  color: "white",
                  border: "none",
                  fontSize: 12,
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
              {isGoal && (
                <>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      scaleElement(selected.id, -SCALE_STEP);
                    }}
                    title="Zmenšit"
                    style={{
                      position: "absolute",
                      left: `${selected.x * 100}%`,
                      top: `${selected.y * 100}%`,
                      transform: "translate(calc(-50% - 22px), calc(-50% + 22px))",
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "var(--surface-variant)",
                      color: "white",
                      border: "2px solid var(--primary)",
                      fontSize: 13,
                      lineHeight: 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    −
                  </button>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      scaleElement(selected.id, SCALE_STEP);
                    }}
                    title="Zvětšit"
                    style={{
                      position: "absolute",
                      left: `${selected.x * 100}%`,
                      top: `${selected.y * 100}%`,
                      transform: "translate(calc(-50% + 22px), calc(-50% + 22px))",
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "var(--surface-variant)",
                      color: "white",
                      border: "2px solid var(--primary)",
                      fontSize: 13,
                      lineHeight: 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    +
                  </button>
                </>
              )}
            </>
          );
        })()}
        </div>
        {zoom > 1.01 && (
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              padding: "6px 10px",
              borderRadius: 8,
              border: "none",
              background: "rgba(0,0,0,0.6)",
              color: "white",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Zrušit přiblížení
          </button>
        )}
      </div>

      <div className="spacer-16" />
      {(elements.length > 0 || arrows.length > 0) && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="btn-text danger"
            onClick={() => {
              setElements([]);
              setArrows([]);
              setSelectedElementId(null);
              setSelectedArrowId(null);
            }}
          >
            Vymazat vše
          </button>
        </div>
      )}
    </div>
  );
}
