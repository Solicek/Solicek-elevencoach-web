import { useEffect, useRef, useState } from "react";
import { drawArrow, drawPitchLines, drawStroke, sizeCanvasToContainer } from "../../lib/drawing";
import { allArrowStyles, ArrowStyle } from "../../types";
import { ArrowStyleIcon } from "../TrainingBeta/ArrowStyleIcon";
import { formations } from "../../formations";

interface Point {
  x: number;
  y: number;
}

interface TacticsArrow {
  points: Point[];
  /** `null` = volný náčrtek (libovolný tvar/čára), ne jedna z pevných stylů šipky. */
  style: string | null;
}

const ARROW_MIN_DISTANCE = 15;

interface Props {
  formationName: string;
  names: Record<string, string>;
  /** Když existuje nejbližší nadcházející (ještě neuzavřený) zápas, zobrazí se jeho sestava
   * místo živé – matchLabel pak popisuje KTERÝ zápas se tu právě připravuje. `null`, když se
   * zobrazuje živá sestava (žádný takový zápas není). */
  matchLabel?: string | null;
}

/**
 * Taktická tabule – sestava (nejbližšího nadcházejícího zápasu, nebo živá, viz matchLabel) +
 * kreslení šipek přes hřiště, nic se neukládá. Záměrně jen "nakreslím, ukážu, smažu": vybere
 * se styl a tahem od-do se nakreslí JEDNODUCHÁ šipka (bez editace bodů/čísel po nakreslení,
 * jako má Trénink (beta)) – jen rychlý tah pro poradu.
 */
export function TacticsTab({ formationName, names, matchLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const linesCanvasRef = useRef<HTMLCanvasElement>(null);
  const arrowsCanvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [arrows, setArrows] = useState<TacticsArrow[]>([]);
  // `null` = volné kreslení (žádný styl šipky není aktivní) – přepíná se klepnutím na už
  // vybraný styl šipky znovu (viz tlačítka stylů níže), ne samostatným přepínačem navíc.
  const [activeStyle, setActiveStyle] = useState<string | null>(ArrowStyle.DRIBBLE);
  const [preview, setPreview] = useState<Point[] | null>(null);
  const dragStartRef = useRef<Point | null>(null);
  const freePointsRef = useRef<Point[]>([]);
  const positions = formations[formationName] ?? [];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = linesCanvasRef.current;
    if (!canvas || size.width === 0) return;
    const ctx = sizeCanvasToContainer(canvas, size.width, size.height);
    drawPitchLines(ctx, size.width, size.height);
  }, [size]);

  useEffect(() => {
    const canvas = arrowsCanvasRef.current;
    if (!canvas || size.width === 0) return;
    const ctx = sizeCanvasToContainer(canvas, size.width, size.height);
    ctx.clearRect(0, 0, size.width, size.height);
    for (const arrow of arrows) {
      if (arrow.style === null) drawStroke(ctx, arrow.points);
      else drawArrow(ctx, arrow.points, arrow.style);
    }
    if (preview && preview.length >= 2) {
      if (activeStyle === null) drawStroke(ctx, preview);
      else drawArrow(ctx, preview, activeStyle);
    }
  }, [arrows, preview, size, activeStyle]);

  function relativePoint(e: React.PointerEvent<HTMLDivElement>): Point {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function pathLength(points: Point[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i++) total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    return total;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const start = relativePoint(e);
    dragStartRef.current = start;
    freePointsRef.current = [start];
    setPreview([start, start]);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const start = dragStartRef.current;
    if (!start) return;
    const current = relativePoint(e);
    if (activeStyle === null) {
      freePointsRef.current.push(current);
      setPreview([...freePointsRef.current]);
    } else {
      setPreview([start, current]);
    }
  }
  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    setPreview(null);
    if (!start) return;
    if (activeStyle === null) {
      const points = freePointsRef.current;
      freePointsRef.current = [];
      if (points.length < 2 || pathLength(points) < ARROW_MIN_DISTANCE) return;
      setArrows((a) => [...a, { points, style: null }]);
      return;
    }
    const end = relativePoint(e);
    if (Math.hypot(end.x - start.x, end.y - start.y) < ARROW_MIN_DISTANCE) return;
    setArrows((a) => [...a, { points: [start, end], style: activeStyle }]);
  }

  const slotWidth = 64;

  return (
    <div>
      <p className="text-bold" style={{ fontSize: "0.85rem" }}>
        {matchLabel ? `Příprava na: ${matchLabel}` : "Živá sestava"}
      </p>
      <div className="spacer-8" />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <p className="text-gray" style={{ fontSize: "0.8rem", flex: 1 }}>
          Rozestavení: {formationName}
        </p>
        <button className="btn-text" onClick={() => setArrows((a) => a.slice(0, -1))}>
          Zpět
        </button>
        <button className="btn-text danger" onClick={() => setArrows([])}>
          Vymazat
        </button>
      </div>

      <div className="spacer-8" />
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {allArrowStyles.map((style) => (
          <button
            key={style}
            onClick={() => setActiveStyle((prev) => (prev === style ? null : style))}
            title={style}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
              borderRadius: 8,
              border: activeStyle === style ? "2px solid var(--primary)" : "2px solid transparent",
              background: "var(--surface-variant)",
              cursor: "pointer",
            }}
          >
            <ArrowStyleIcon style={style} />
          </button>
        ))}
      </div>
      {activeStyle === null && (
        <p className="text-gray" style={{ fontSize: "0.75rem", marginTop: 4 }}>
          Volné kreslení – tažením nakreslíš libovolný tvar. Klepnutím na styl šipky se vrátíš k šipkám.
        </p>
      )}

      <div className="spacer-8" />
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: "relative",
          background: "var(--pitch-green)",
          border: "2px solid white",
          overflow: "hidden",
          touchAction: "none",
          width: "100%",
          aspectRatio: "0.62",
        }}
      >
        <canvas ref={linesCanvasRef} style={{ position: "absolute", inset: 0 }} />
        {positions.map((pos) => {
          const offsetX = size.width * pos.xPercent - slotWidth / 2;
          const offsetY = size.height * pos.yPercent - 28;
          const key = `${formationName}|${pos.id}`;
          const name = names[key]?.trim();
          return (
            <div
              key={pos.id}
              style={{ position: "absolute", left: offsetX, top: offsetY, width: slotWidth, display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--pitch-green)",
                }}
              >
                {pos.label}
              </div>
              {name && (
                <div
                  style={{
                    marginTop: 2,
                    width: "100%",
                    background: "rgba(0,0,0,0.35)",
                    color: "white",
                    fontSize: 10,
                    textAlign: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </div>
              )}
            </div>
          );
        })}
        <canvas ref={arrowsCanvasRef} style={{ position: "absolute", inset: 0 }} />
      </div>
    </div>
  );
}
