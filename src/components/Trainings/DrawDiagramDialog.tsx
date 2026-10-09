import { useEffect, useRef, useState } from "react";
import { drawPitchLines, drawStroke, sizeCanvasToContainer } from "../../lib/drawing";
import type { DiagramPoint } from "../../types";

interface Props {
  initialDiagram: DiagramPoint[][];
  onDismiss: () => void;
  onSave: (diagram: DiagramPoint[][]) => void;
}

/** Celoobrazovkový editor náčrtku cvičení – kreslení prstem/myší přes Pointer Events. */
export function DrawDiagramDialog({ initialDiagram, onDismiss, onSave }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>(() => initialDiagram.map((s) => s.map((p) => ({ ...p }))));
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);
  const [, forceRedraw] = useState(0);
  const sizeRef = useRef({ width: 0, height: 0 });

  function redraw() {
    const canvas = canvasRef.current;
    const { width, height } = sizeRef.current;
    if (!canvas || width === 0 || height === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    drawPitchLines(ctx, width, height);
    for (const stroke of strokes) drawStroke(ctx, stroke);
    if (currentPointsRef.current.length >= 2) drawStroke(ctx, currentPointsRef.current);
  }

  useEffect(() => {
    function resize() {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const { width, height } = container.getBoundingClientRect();
      sizeRef.current = { width, height };
      sizeCanvasToContainer(canvas, width, height);
      redraw();
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(redraw, [strokes]);

  function relativePoint(e: React.PointerEvent<HTMLDivElement>): { x: number; y: number } {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    currentPointsRef.current = [relativePoint(e)];
    forceRedraw((n) => n + 1);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (currentPointsRef.current.length === 0) return;
    currentPointsRef.current = [...currentPointsRef.current, relativePoint(e)];
    redraw();
  }
  function handlePointerUp() {
    const points = currentPointsRef.current;
    currentPointsRef.current = [];
    if (points.length >= 2) {
      setStrokes((s) => [...s, points]);
    }
  }

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
        background: "var(--surface)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        padding: 16,
        paddingTop: "max(16px, env(safe-area-inset-top))",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="text-bold">Náčrtek cvičení</p>
        <button className="btn-text" onClick={onDismiss}>
          Zrušit
        </button>
      </div>

      <div className="spacer-8" />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-outline" style={{ width: "auto", padding: "8px 14px" }} onClick={() => setStrokes((s) => s.slice(0, -1))}>
          Zpět
        </button>
        <button className="btn-outline danger" style={{ width: "auto", padding: "8px 14px" }} onClick={() => setStrokes([])}>
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
          flex: 1,
          background: "var(--pitch-green)",
          border: "2px solid white",
          touchAction: "none",
          position: "relative",
        }}
      >
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
      </div>

      <div className="spacer-12" />
      <button
        className="btn"
        onClick={() => {
          const { width, height } = sizeRef.current;
          const w = width || 1;
          const h = height || 1;
          onSave(strokes.map((stroke) => stroke.map((p) => ({ x: p.x / w, y: p.y / h }))));
        }}
      >
        Uložit náčrtek
      </button>
    </div>
  );
}
