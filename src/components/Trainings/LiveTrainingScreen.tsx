import { useEffect, useRef, useState } from "react";
import type { TrainingSession } from "../../types";
import { t, tf } from "../../lib/i18n";
import { drillText } from "../../lib/drillLabels";

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
          {t("tr.liveTitle")}
        </p>
        <button className="btn-text" onClick={onExit}>
          {t("tr.exit")}
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
            {i + 1}. {drillText(block.title)}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {isFinished ? (
          <p className="text-bold" style={{ fontSize: "1.4rem" }}>
            {t("tr.finished")}
          </p>
        ) : (
          <div style={{ textAlign: "center" }}>
            <p className="text-gray" style={{ fontSize: "0.9rem" }}>
              {tf("tr.blockOf", { index: String(index + 1), total: String(blocks.length) })}
            </p>
            <div className="spacer-8" />
            <p className="text-bold" style={{ fontSize: "1.4rem" }}>
              {drillText(currentBlock.title)}
            </p>
            {currentBlock.description && (
              <>
                <div className="spacer-8" />
                <p className="text-gray" style={{ fontSize: "0.9rem" }}>
                  {drillText(currentBlock.description)}
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
                {t("tr.timeUp")}
              </p>
            )}

            <div className="spacer-24" />
            <button className="btn-outline" style={{ width: "auto", padding: "10px 24px" }} disabled={isTimeUp} onClick={() => setIsRunning((r) => !r)}>
              {isRunning ? t("tr.pause") : t("tr.resume")}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-outline" style={{ flex: 1 }} disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
          {t("tr.previous")}
        </button>
        <button
          className="btn"
          style={{ flex: 1 }}
          disabled={index >= blocks.length}
          onClick={() => setIndex((i) => Math.min(blocks.length, i + 1))}
        >
          {index === blocks.length - 1 ? t("tr.finish") : t("tr.nextBlock")}
        </button>
      </div>
    </div>
  );
}
