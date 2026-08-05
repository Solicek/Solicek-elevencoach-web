import { useEffect, useRef } from "react";
import { drawPitchLines, drawStroke, sizeCanvasToContainer } from "../../lib/drawing";
import type { DiagramPoint } from "../../types";

interface Props {
  diagram: DiagramPoint[][];
  style?: React.CSSProperties;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/** Malý (nebo velký) náhled náčrtku cvičení – zelené hřiště s uloženými tahy, jen ke čtení. */
export function DiagramPreview({ diagram, style, className, onClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    const ctx = sizeCanvasToContainer(canvas, width, height);
    ctx.clearRect(0, 0, width, height);
    drawPitchLines(ctx, width, height);
    for (const stroke of diagram) {
      drawStroke(
        ctx,
        stroke.map((p) => ({ x: p.x * width, y: p.y * height }))
      );
    }
  }, [diagram]);

  return (
    <div
      ref={containerRef}
      className={className}
      onClick={onClick}
      style={{ background: "var(--pitch-green)", border: "1px solid white", cursor: onClick ? "pointer" : undefined, ...style }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
