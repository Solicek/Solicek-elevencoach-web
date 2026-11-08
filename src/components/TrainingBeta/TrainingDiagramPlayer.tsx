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
/** Hráči i míč jsou v animaci větší než ve statickém nákresu – jsou to hlavní aktéři. */
const PLAYER_SIZE = 36;
const BALL_SIZE = 24;

/**
 * Přehrání nákresu jako animace – hráči a míč se pohybují po nakreslených šipkách v pořadí,
 * které mají nastavené. Scénář počítá lib/diagramAnimation.ts, tady je jen vykreslení a ovládání.
 *
 * Záměrně se NEkreslí celé šipky: na plný nákres se trenér může podívat na vedlejší záložce,
 * tady má být vidět hlavně POHYB. Místo šipek se za hráčem/míčem kreslí stopa toho, co už
 * projel, takže je pořád jasné, kudy se šlo, ale plocha zůstane čistá.
 */
export function TrainingDiagramPlayer({ diagram, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [animation, setAnimation] = useState<Animation>(() => buildAnimation(diagram));
  const [timeMs, setTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showArrows, setShowArrows] = useState(false);

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

    // Celé šipky jen na vyžádání a hodně potlačeně, ať nepřebijí pohyb.
    if (showArrows) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      for (const arrow of diagram.arrows) {
        drawArrow(
          ctx,
          arrow.points.map((p) => ({ x: p.x * size.width, y: p.y * size.height })),
          arrow.style
        );
      }
      ctx.restore();
    }

    // Stopa za pohybem: co se právě jede, je výrazné; dojeté dráhy zůstanou slabě vidět,
    // aby bylo na konci poznat, kudy celé cvičení vedlo.
    for (const trace of frame.traces) {
      if (trace.points.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = trace.movesBall ? "#ffd54f" : "#ffffff";
      ctx.globalAlpha = trace.active ? 0.9 : 0.3;
      ctx.lineWidth = trace.active ? 4 : 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash(trace.movesBall ? [] : [6, 6]);
      ctx.beginPath();
      ctx.moveTo(trace.points[0].x * size.width, trace.points[0].y * size.height);
      for (const p of trace.points.slice(1)) ctx.lineTo(p.x * size.width, p.y * size.height);
      ctx.stroke();
      ctx.restore();
    }
  }, [diagram, size, frame.traces, showArrows]);

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
          const isMoving = frame.movingElementIds.has(el.id);
          const isPlayer =
            el.type === DiagramElementType.PLAYER_RED ||
            el.type === DiagramElementType.PLAYER_BLACK ||
            el.type === DiagramElementType.GOALKEEPER;
          return (
            <div
              key={el.id}
              style={{
                position: "absolute",
                left: `${position.x * 100}%`,
                top: `${position.y * 100}%`,
                transform: `translate(-50%, -50%) rotate(${el.rotation ?? 0}deg) scale(${el.scale ?? 1})`,
                // Kdo se právě hýbe, dostane světlý kroužek – v pohybu se oko chytne kontrastu.
                borderRadius: "50%",
                boxShadow: isMoving ? "0 0 0 3px rgba(255,255,255,0.9), 0 0 12px rgba(0,0,0,0.5)" : undefined,
                filter: isPlayer ? "drop-shadow(0 2px 3px rgba(0,0,0,0.55))" : undefined,
              }}
            >
              <DiagramElementIcon type={el.type} color={el.color} size={isPlayer ? PLAYER_SIZE : 28} />
            </div>
          );
        })}

        {/* Míčů může být v nákresu víc – každý se kreslí tam, kam ho animace dovedla. */}
        {Array.from(frame.balls.entries()).map(([ballId, position]) => (
          <div
            key={ballId}
            style={{
              position: "absolute",
              left: `${position.x * 100}%`,
              top: `${position.y * 100}%`,
              transform: "translate(-50%, -50%)",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.65))",
            }}
          >
            <DiagramElementIcon type={DiagramElementType.BALL} size={BALL_SIZE} />
          </div>
        ))}

        {/* Ovládání leží přímo ve spodní části hřiště – na výšku telefonu je hřiště vysoké
            a lišta pod ním by byla až pod okrajem obrazovky, takže by se na přehrání muselo
            scrollovat. Poloprůhledný podklad, ať jsou čísla čitelná i nad zelenou. */}
        {hasAnimation && (
          <div
            style={{
              position: "absolute",
              left: 8,
              right: 8,
              bottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 12,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(2px)",
            }}
          >
            <button
              className="btn"
              style={{ width: "auto", padding: "8px 16px", flexShrink: 0 }}
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
              style={{ flex: 1, minWidth: 40 }}
            />
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {SPEEDS.map((value) => (
                <button
                  key={value}
                  className={`chip ${value === speed ? "selected" : ""}`}
                  style={{ padding: "4px 7px", fontSize: "0.7rem" }}
                  onClick={() => setSpeed(value)}
                >
                  {value}×
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="spacer-8" />
      {hasAnimation ? (
        <label className="checkbox-row" style={{ fontSize: "0.8rem" }}>
          <input type="checkbox" checked={showArrows} onChange={(e) => setShowArrows(e.target.checked)} />
          <span>{t("beta.showArrows")}</span>
        </label>
      ) : (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          {t("beta.nothingToPlay")}
        </p>
      )}
    </div>
  );
}
