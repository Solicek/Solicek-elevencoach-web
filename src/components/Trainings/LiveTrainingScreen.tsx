import { useEffect, useRef, useState } from "react";
import type { TrainingSession } from "../../types";

interface Props {
  session: TrainingSession;
  onExit: () => void;
}

/**
 * Živý režim tréninku – odpočet času pro aktuální blok, na signál (0:00) se čeká na ruční
 * potvrzení "Další blok", ať trenér nepřijde o kontrolu nad tempem tréninku.
 */
export function LiveTrainingScreen({ session, onExit }: Props) {
  const blocks = session.blocks;
  const [index, setIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState((blocks[0]?.minutes ?? 0) * 60);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemainingSeconds((blocks[index]?.minutes ?? 0) * 60);
    setIsRunning(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((s) => (s > 0 ? s - 1 : s));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const currentBlock = blocks[index];
  const isFinished = currentBlock === undefined;
  const isTimeUp = remainingSeconds <= 0 && currentBlock !== undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="text-bold" style={{ fontSize: "1.1rem" }}>
          Živý trénink
        </p>
        <button className="btn-text" onClick={onExit}>
          Ukončit
        </button>
      </div>

      <div className="spacer-8" />
      <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {blocks.map((block, i) => (
          <button
            key={block.id}
            className="chip"
            style={i === index ? { background: "var(--primary)", color: "var(--on-primary)" } : undefined}
            onClick={() => setIndex(i)}
          >
            {i + 1}. {block.title}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {isFinished ? (
          <p className="text-bold" style={{ fontSize: "1.4rem" }}>
            Trénink dokončen! 🎉
          </p>
        ) : (
          <div style={{ textAlign: "center" }}>
            <p className="text-gray" style={{ fontSize: "0.9rem" }}>
              Blok {index + 1} z {blocks.length}
            </p>
            <div className="spacer-8" />
            <p className="text-bold" style={{ fontSize: "1.4rem" }}>
              {currentBlock.title}
            </p>
            {currentBlock.description && (
              <>
                <div className="spacer-8" />
                <p className="text-gray" style={{ fontSize: "0.9rem" }}>
                  {currentBlock.description}
                </p>
              </>
            )}

            <div className="spacer-24" />
            <p
              className="text-bold"
              style={{ fontSize: "4rem", color: isTimeUp ? "var(--error)" : "var(--text)" }}
            >
              {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}
            </p>
            {isTimeUp && (
              <p className="text-error" style={{ fontSize: "0.9rem" }}>
                Čas vypršel
              </p>
            )}

            <div className="spacer-24" />
            <button className="btn-outline" style={{ width: "auto", padding: "10px 24px" }} disabled={isTimeUp} onClick={() => setIsRunning((r) => !r)}>
              {isRunning ? "Pauza" : "Pokračovat"}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-outline" style={{ flex: 1 }} disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
          ← Předchozí
        </button>
        <button
          className="btn"
          style={{ flex: 1 }}
          disabled={index >= blocks.length}
          onClick={() => setIndex((i) => Math.min(blocks.length, i + 1))}
        >
          {index === blocks.length - 1 ? "Dokončit" : "Další blok →"}
        </button>
      </div>
    </div>
  );
}
