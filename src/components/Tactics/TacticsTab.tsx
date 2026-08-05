import { useEffect, useRef, useState } from "react";
import { drawPitchLines, drawStroke, sizeCanvasToContainer } from "../../lib/drawing";
import { formations } from "../../formations";

interface Props {
  formationName: string;
  names: Record<string, string>;
}

/** Taktická tabule – volné kreslení tahů přes hřiště s aktuální sestavou; nic se neukládá. */
export function TacticsTab({ formationName, names }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const linesCanvasRef = useRef<HTMLCanvasElement>(null);
  const strokesCanvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);
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
    const canvas = strokesCanvasRef.current;
    if (!canvas || size.width === 0) return;
    sizeCanvasToContainer(canvas, size.width, size.height);
    redrawStrokes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  function redrawStrokes() {
    const canvas = strokesCanvasRef.current;
    if (!canvas || size.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size.width, size.height);
    for (const stroke of strokes) drawStroke(ctx, stroke);
    if (currentPointsRef.current.length >= 2) drawStroke(ctx, currentPointsRef.current);
  }

  useEffect(redrawStrokes, [strokes]);

  function relativePoint(e: React.PointerEvent<HTMLDivElement>): { x: number; y: number } {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    currentPointsRef.current = [relativePoint(e)];
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (currentPointsRef.current.length === 0) return;
    currentPointsRef.current = [...currentPointsRef.current, relativePoint(e)];
    redrawStrokes();
  }
  function handlePointerUp() {
    const points = currentPointsRef.current;
    currentPointsRef.current = [];
    if (points.length >= 2) {
      setStrokes((s) => [...s, points]);
    }
  }

  const slotWidth = 64;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <p className="text-gray" style={{ fontSize: "0.8rem", flex: 1 }}>
          Rozestavení: {formationName}
        </p>
        <button className="btn-text" onClick={() => setStrokes((s) => s.slice(0, -1))}>
          Zpět
        </button>
        <button className="btn-text danger" onClick={() => setStrokes([])}>
          Vymazat
        </button>
      </div>

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
        <canvas ref={strokesCanvasRef} style={{ position: "absolute", inset: 0 }} />
      </div>
    </div>
  );
}
