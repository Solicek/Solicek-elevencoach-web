import { useEffect, useRef, useState } from "react";
import { drawArrow, drawHalfPitchLines, drawPitchLines, sizeCanvasToContainer } from "../../lib/drawing";
import { buildAnimation, sampleAnimation, type Animation } from "../../lib/diagramAnimation";
import { DiagramBackground, DiagramElementType } from "../../types";
import type { TrainingDiagram } from "../../types";
import { DiagramElementIcon } from "./DiagramElementIcon";
import { t } from "../../lib/i18n";

interface Props {
  diagram: TrainingDiagram;
  style?: React.CSSProperties;
}

const SPEEDS = [0.5, 1, 1.5];

/**
 * Přehrání nákresu jako animace – hráči a míč se pohybují po nakreslených šipkách v pořadí,
 * které mají nastavené. Scénář počítá lib/diagramAnimation.ts, tady je jen vykreslení a ovládání.
 *
 * Šipky zůstávají vidět pod animací (jako stopa, kudy se jde) a ta právě probíhající se
 * zvýrazní – jinak by se trenér v půlce cvičení ztratil.
 */
export function TrainingDiagramPlayer({ diagram, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [animation, setAnimation] = useState<Animation>(() => buildAnimation(diagram));
  const [timeMs, setTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setAnimation(buildAnimation(diagram));
    setTimeMs(0);
    setIsPlaying(false);
  }, [diagram]);

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

  // Posun času podle skutečně uplynulých milisekund (ne podle počtu snímků), ať animace trvá
  // stejně dlouho na pomalém i rychlém zařízení. Na konci se sama zastaví.
  useEffect(() => {
    if (!isPlaying) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = (now - last) * speed;
      last = now;
      setTimeMs((prev) => {
        const next = prev + delta;
        if (next >= animation.totalMs) {
          setIsPlaying(false);
          return animation.totalMs;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, speed, animation.totalMs]);

  const frame = sampleAnimation(animation, diagram, timeMs);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;
    const ctx = sizeCanvasToContainer(canvas, size.width, size.height);
    ctx.clearRect(0, 0, size.width, size.height);
    if (diagram.background === DiagramBackground.HALF) drawHalfPitchLines(ctx, size.width, size.height);
    else drawPitchLines(ctx, size.width, size.height);

    for (const arrow of diagram.arrows) {
      const points = arrow.points.map((p) => ({ x: p.x * size.width, y: p.y * size.height }));
      const isActive = frame.activeArrowIds.has(arrow.id);
      // Neaktivní šipky zeslabené, aktivní v plné sytosti – oko tak jde za probíhající akcí.
      ctx.save();
      ctx.globalAlpha = isActive ? 1 : 0.35;
      drawArrow(ctx, points, arrow.style);
      ctx.restore();
    }
  }, [diagram, size, frame.activeArrowIds]);

  const aspectRatio = diagram.background === DiagramBackground.HALF ? "1.3" : "0.62";
  const hasAnimation = animation.totalMs > 0;
  const atEnd = timeMs >= animation.totalMs;

  return (
    <div style={style}>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          background: "var(--pitch-green)",
          border: "1px solid white",
          overflow: "hidden",
          aspectRatio,
        }}
      >
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />

        {diagram.elements.map((el) => {
          // Míč se vykresluje zvlášť (putuje po přihrávkách), ostatní prvky na svém místě
          // nebo tam, kam je dotáhla animace.
          if (el.type === DiagramElementType.BALL) return null;
          const moved = frame.elementPositions.get(el.id);
          const position = moved ?? { x: el.x, y: el.y };
          return (
            <div
              key={el.id}
              style={{
                position: "absolute",
                left: `${position.x * 100}%`,
                top: `${position.y * 100}%`,
                transform: `translate(-50%, -50%) rotate(${el.rotation ?? 0}deg) scale(${el.scale ?? 1})`,
              }}
            >
              <DiagramElementIcon type={el.type} color={el.color} />
            </div>
          );
        })}

        {frame.ball && (
          <div
            style={{
              position: "absolute",
              left: `${frame.ball.x * 100}%`,
              top: `${frame.ball.y * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <DiagramElementIcon type={DiagramElementType.BALL} />
          </div>
        )}
      </div>

      <div className="spacer-8" />
      {hasAnimation ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="btn"
            style={{ width: "auto", padding: "8px 18px" }}
            onClick={() => {
              if (atEnd) setTimeMs(0);
              setIsPlaying(!isPlaying);
            }}
          >
            {isPlaying ? t("beta.pause") : atEnd ? t("beta.replay") : t("beta.play")}
          </button>
          <input
            type="range"
            min={0}
            max={Math.round(animation.totalMs)}
            value={Math.round(timeMs)}
            onChange={(e) => {
              setIsPlaying(false);
              setTimeMs(Number(e.target.value));
            }}
            style={{ flex: 1 }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            {SPEEDS.map((value) => (
              <button
                key={value}
                className={`chip ${value === speed ? "selected" : ""}`}
                style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                onClick={() => setSpeed(value)}
              >
                {value}×
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          {t("beta.nothingToPlay")}
        </p>
      )}
    </div>
  );
}
