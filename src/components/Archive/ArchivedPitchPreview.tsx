import { useEffect, useRef, useState } from "react";
import { drawPitchLines, sizeCanvasToContainer } from "../../lib/drawing";
import { formations } from "../../formations";

interface Props {
  formationName: string;
  names: Record<string, string>;
  style?: React.CSSProperties;
}

/** Náhled uložené sestavy – jen ke čtení, žádné kliknutí neotevírá výběr hráče. */
export function ArchivedPitchPreview({ formationName, names, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
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
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;
    const ctx = sizeCanvasToContainer(canvas, size.width, size.height);
    drawPitchLines(ctx, size.width, size.height);
  }, [size]);

  const slotWidth = 64;

  return (
    <div ref={containerRef} style={{ position: "relative", background: "var(--pitch-green)", border: "2px solid white", overflow: "hidden", ...style }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
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
    </div>
  );
}
