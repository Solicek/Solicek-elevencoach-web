import { useMemo, useState } from "react";
import { Dialog } from "../Shell/Dialog";
import type { ArchivedLineup, PlayerMatchStat } from "../../types";

const emptyStat: PlayerMatchStat = { goals: 0, assists: 0, yellowCards: 0, redCards: 0, rating: 0 };

function starDisplay(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

interface Props {
  entry: ArchivedLineup;
  onUpdateEntry: (entry: ArchivedLineup) => void;
}

export function PlayerStatsSection({ entry, onUpdateEntry }: Props) {
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);

  const participants = useMemo(() => {
    const fromNames = Object.values(entry.names).filter((n) => n.trim() !== "");
    const fromSubs = entry.substitutes.map((s) => s.name);
    return Array.from(new Set([...fromNames, ...fromSubs]));
  }, [entry.names, entry.substitutes]);

  return (
    <div>
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        Statistiky hráčů
      </p>
      <div className="spacer-8" />
      {participants.length === 0 ? (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          V sestavě zatím nejsou žádní hráči.
        </p>
      ) : (
        participants.map((name) => {
          const stat = entry.playerStats[name] ?? emptyStat;
          const parts = [`${stat.goals}G ${stat.assists}A`];
          if (stat.yellowCards > 0) parts.push(`${stat.yellowCards}Ž`);
          if (stat.redCards > 0) parts.push(`${stat.redCards}Č`);
          const line = parts.join(" ") + (stat.rating > 0 ? ` · ${starDisplay(stat.rating)}` : "");
          return (
            <div key={name} className="list-row" style={{ cursor: "pointer" }} onClick={() => setEditingPlayer(name)}>
              <span>{name}</span>
              <span className="text-gray" style={{ fontSize: "0.8rem" }}>
                {line}
              </span>
            </div>
          );
        })
      )}

      {editingPlayer && (
        <EditPlayerStatDialog
          name={editingPlayer}
          stat={entry.playerStats[editingPlayer] ?? emptyStat}
          onDismiss={() => setEditingPlayer(null)}
          onConfirm={(newStat) => {
            onUpdateEntry({ ...entry, playerStats: { ...entry.playerStats, [editingPlayer]: newStat } });
            setEditingPlayer(null);
          }}
        />
      )}
    </div>
  );
}

function StatCounterRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button className="btn-text" onClick={() => onChange(Math.max(0, value - 1))}>
          −
        </button>
        <span style={{ padding: "0 10px" }}>{value}</span>
        <button className="btn-text" onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

function StarRatingInput({ rating, onRatingChange }: { rating: number; onRatingChange: (r: number) => void }) {
  return (
    <div>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={() => onRatingChange(rating === i ? 0 : i)}
          style={{ fontSize: "1.8rem", color: i <= rating ? "#FFA000" : "gray", cursor: "pointer", marginRight: 4 }}
        >
          {i <= rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

interface EditProps {
  name: string;
  stat: PlayerMatchStat;
  onDismiss: () => void;
  onConfirm: (stat: PlayerMatchStat) => void;
}

function EditPlayerStatDialog({ name, stat, onDismiss, onConfirm }: EditProps) {
  const [goals, setGoals] = useState(stat.goals);
  const [assists, setAssists] = useState(stat.assists);
  const [yellowCards, setYellowCards] = useState(stat.yellowCards);
  const [redCards, setRedCards] = useState(stat.redCards);
  const [rating, setRating] = useState(stat.rating);

  return (
    <Dialog
      title={name}
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss}>
            Zrušit
          </button>
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 20px" }}
            onClick={() => onConfirm({ goals, assists, yellowCards, redCards, rating })}
          >
            Uložit
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <StatCounterRow label="Góly" value={goals} onChange={setGoals} />
        <StatCounterRow label="Asistence" value={assists} onChange={setAssists} />
        <StatCounterRow label="Žluté karty" value={yellowCards} onChange={setYellowCards} />
        <StatCounterRow label="Červené karty" value={redCards} onChange={setRedCards} />
        <div>
          <p style={{ marginBottom: 6 }}>Hodnocení</p>
          <StarRatingInput rating={rating} onRatingChange={setRating} />
        </div>
      </div>
    </Dialog>
  );
}
