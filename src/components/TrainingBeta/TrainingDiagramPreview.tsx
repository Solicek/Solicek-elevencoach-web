import { useEffect, useRef, useState } from "react";
import { arrowMidpoint, drawArrow, drawHalfPitchLines, drawPitchLines, sizeCanvasToContainer } from "../../lib/drawing";
import { DiagramBackground } from "../../types";
import type { TrainingDiagram } from "../../types";
import { DiagramElementIcon } from "./DiagramElementIcon";

interface Point {
  x: number;
  y: number;
}

interface Props {
  diagram: TrainingDiagram;
  style?: React.CSSProperties;
  /** Umožní přiblížení/oddálení gestem dvou prstů (pinch) – zapnuto jen u celoobrazovkového
   * náhledu, ne u malých dlaždic v galerii, kde by to nemělo smysl. */
  zoomable?: boolean;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/** Čtecí náhled uloženého nákresu – hřiště + šipky na canvasu, ikony a čísla jako overlay nad ním. */
export function TrainingDiagramPreview({ diagram, style, zoomable = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panRef = useRef<Point>({ x: 0, y: 0 });
  zoomRef.current = zoom;
  panRef.current = pan;

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

  // Přiblížení náhledu gestem dvou prstů (pinch-to-zoom) + posun (pan) při přiblíženém
  // pohledu – stejný princip jako v editoru nákresu, jen bez kreslicích gest, která by
  // se musela hlídat (náhled je čistě needitovatelný).
  useEffect(() => {
    if (!zoomable) return;
    const container = containerRef.current;
    if (!container) return;

    const activePointers = new Map<number, Point>();
    let isPinching = false;
    let pinchState: { startDist: number; startZoom: number; localAnchor: Point } | null = null;

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
      const pts = Array.from(activePointers.values());
      if (pts.length !== 2 || !pinchState) return;
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const { startDist, startZoom, localAnchor } = pinchState;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, startZoom * (dist / startDist)));
      const newPan = clampPan(newZoom, { x: mid.x - newZoom * localAnchor.x, y: mid.y - newZoom * localAnchor.y });
      setZoom(newZoom);
      setPan(newPan);
    }

    function onDown(e: PointerEvent) {
      activePointers.set(e.pointerId, relToContainer(e));
      if (activePointers.size === 2) {
        isPinching = true;
        const pts = Array.from(activePointers.values());
        const [a, b] = pts;
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        pinchState = {
          startDist: dist,
          startZoom: zoomRef.current,
          localAnchor: { x: (mid.x - panRef.current.x) / zoomRef.current, y: (mid.y - panRef.current.y) / zoomRef.current },
        };
      }
    }

    function onMove(e: PointerEvent) {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, relToContainer(e));
      if (isPinching) {
        e.preventDefault();
        updatePinch();
      }
    }

    function onUp(e: PointerEvent) {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) {
        isPinching = false;
        pinchState = null;
      }
    }

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
  }, [zoomable, size.width, size.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;
    const ctx = sizeCanvasToContainer(canvas, size.width, size.height);
    ctx.clearRect(0, 0, size.width, size.height);
    if (diagram.background === DiagramBackground.HALF) drawHalfPitchLines(ctx, size.width, size.height);
    else drawPitchLines(ctx, size.width, size.height);
    for (const arrow of diagram.arrows) {
      drawArrow(
        ctx,
        arrow.points.map((p) => ({ x: p.x * size.width, y: p.y * size.height })),
        arrow.style
      );
    }
  }, [diagram, size]);

  const aspectRatio = diagram.background === DiagramBackground.HALF ? "1.3" : "0.62";

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        background: "var(--pitch-green)",
        border: "1px solid white",
        overflow: "hidden",
        aspectRatio,
        touchAction: zoomable ? "none" : undefined,
        ...style,
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
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
        {diagram.arrows.map((arrow) => {
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
                }}
              >
                {arrow.number}
              </div>
            )
          );
        })}
        {diagram.elements.map((el) => (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: `${el.x * 100}%`,
              top: `${el.y * 100}%`,
              transform: `translate(-50%, -50%) rotate(${el.rotation ?? 0}deg) scale(${el.scale ?? 1})`,
            }}
          >
            <DiagramElementIcon type={el.type} color={el.color} />
          </div>
        ))}
      </div>
      {zoomable && zoom > 1.01 && (
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
  );
}
