import { useEffect, useRef } from "react";
import { drawArrow } from "../../lib/drawing";

interface Props {
  style: string;
  width?: number;
  height?: number;
}

/** Malá ikona ukazující reálný vzhled daného stylu šipky – kreslí přes stejnou drawArrow jako plátno. */
export function ArrowStyleIcon({ style, width = 44, height = 26 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const margin = 8;
    drawArrow(
      ctx,
      [
        { x: margin, y: height / 2 },
        { x: width - margin, y: height / 2 },
      ],
      style
    );
  }, [style, width, height]);

  return <canvas ref={canvasRef} />;
}
