import { useEffect, useRef, useState } from "react";
import { PlayerSlot } from "./PlayerSlot";
import { PlayerPickerDialog } from "./PlayerPickerDialog";
import { drawPitchLines, sizeCanvasToContainer } from "../../lib/drawing";
import { positionNames } from "../../lib/assignment";
import type { Player, PlayerPosition } from "../../types";

interface Props {
  positions: PlayerPosition[];
  formationName: string;
  names: Record<string, string>;
  players: Player[];
  onAssignPlayer: (player: Player, pos: PlayerPosition) => void;
  onUnassignSlot: (key: string) => void;
  onCreatePlayer: (name: string, pos: PlayerPosition) => void;
  readOnly?: boolean;
  style?: React.CSSProperties;
}

export function Pitch({ positions, formationName, names, players, onAssignPlayer, onUnassignSlot, onCreatePlayer, readOnly = false, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pickerPosition, setPickerPosition] = useState<PlayerPosition | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

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
    <div
      ref={containerRef}
      style={{
        position: "relative",
        background: "var(--pitch-green)",
        border: "2px solid white",
        overflow: "hidden",
        ...style,
      }}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
      {positions.map((pos) => {
        const offsetX = size.width * pos.xPercent - slotWidth / 2;
        const offsetY = size.height * pos.yPercent - 28;
        const key = `${formationName}|${pos.id}`;
        return (
          <PlayerSlot
            key={pos.id}
            label={pos.label}
            name={names[key] ?? ""}
            onTap={() => setPickerPosition(pos)}
            readOnly={readOnly}
            style={{ left: offsetX, top: offsetY }}
          />
        );
      })}

      {!readOnly && pickerPosition &&
        (() => {
          const key = `${formationName}|${pickerPosition.id}`;
          return (
            <PlayerPickerDialog
              positionLabel={positionNames[pickerPosition.label] ?? pickerPosition.label}
              positionCode={pickerPosition.label}
              currentName={names[key] ?? null}
              players={players}
              onDismiss={() => setPickerPosition(null)}
              onSelectPlayer={(player) => {
                onAssignPlayer(player, pickerPosition);
                setPickerPosition(null);
              }}
              onCreatePlayer={(name) => {
                onCreatePlayer(name, pickerPosition);
                setPickerPosition(null);
              }}
              onClearSlot={() => {
                onUnassignSlot(key);
                setPickerPosition(null);
              }}
            />
          );
        })()}
    </div>
  );
}
