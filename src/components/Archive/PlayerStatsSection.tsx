import { useMemo, useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { HomeAway } from "../../types";
import type { ArchivedLineup, PlayerMatchStat } from "../../types";
import { t, tf } from "../../lib/i18n";

const emptyStat: PlayerMatchStat = {
  goals: 0,
  ownGoals: 0,
  assists: 0,
  yellowCards: 0,
  redCards: 0,
  rating: 0,
  yellowFoulCards: 0,
  yellowDissentCards: 0,
  straightRedCards: 0,
  secondYellowRedCards: 0,
};

function starDisplay(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

/** Rozparsuje první "X:Y" na začátku výsledku (celkové skóre) – ignoruje poločasové skóre
 * v závorce, které za ním případně následuje (např. "1:1 (1:0)"). */
function parseFullTimeScore(result: string): { home: number; away: number } | null {
  const match = /^\s*(\d+)\s*:\s*(\d+)/.exec(result);
  if (!match) return null;
  return { home: Number(match[1]), away: Number(match[2]) };
}

interface GoalCheck {
  ok: boolean;
  message: string;
}

/**
 * Porovná součet gólů/vlastních gólů zadaných u hráčů s výsledkem zápasu. Vlastní gól hráče
 * se počítá do skóre SOUPEŘE (ne do gólů týmu), takže se neporovnává 1:1 se zadanými góly –
 * kontroluje se, že skóre týmu odpovídá součtu běžných gólů a skóre soupeře pokrývá alespoň
 * tolik gólů, kolik je zadaných vlastních.
 */
function checkGoalsAgainstResult(entry: ArchivedLineup): GoalCheck | null {
  if (!entry.homeAway || !entry.result.trim()) return null;
  const score = parseFullTimeScore(entry.result);
  if (!score) return null;
  const ourScore = entry.homeAway === HomeAway.AWAY ? score.away : score.home;
  const theirScore = entry.homeAway === HomeAway.AWAY ? score.home : score.away;

  let sumGoals = 0;
  let sumOwnGoals = 0;
  for (const stat of Object.values(entry.playerStats)) {
    sumGoals += stat.goals;
    sumOwnGoals += stat.ownGoals;
  }

  if (sumGoals !== ourScore) {
    return { ok: false, message: tf("stats.goalsMismatch", { sum: String(sumGoals), score: String(ourScore) }) };
  }
  if (sumOwnGoals > theirScore) {
    return { ok: false, message: tf("stats.ownGoalsMismatch", { sum: String(sumOwnGoals), score: String(theirScore) }) };
  }
  return { ok: true, message: tf("stats.goalsMatch", { score: `${score.home}:${score.away}` }) };
}

interface Props {
  entry: ArchivedLineup;
  onUpdateEntry: (entry: ArchivedLineup) => void;
  readOnly?: boolean;
}

export function PlayerStatsSection({ entry, onUpdateEntry, readOnly = false }: Props) {
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);

  const participants = useMemo(() => {
    const fromNames = Object.values(entry.names).filter((n) => n.trim() !== "");
    const fromSubs = entry.substitutes.map((s) => s.name);
    return Array.from(new Set([...fromNames, ...fromSubs]));
  }, [entry.names, entry.substitutes]);

  const goalCheck = useMemo(() => checkGoalsAgainstResult(entry), [entry]);

  return (
    <div>
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {t("stats.title")}
      </p>
      <div className="spacer-8" />
      {goalCheck && (
        <>
          <p
            style={{
              fontSize: "0.8rem",
              color: goalCheck.ok ? "#4CAF50" : "var(--error)",
              background: "var(--surface-variant)",
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            {goalCheck.ok ? "✓ " : "⚠ "}
            {goalCheck.message}
          </p>
          <div className="spacer-8" />
        </>
      )}
      {participants.length === 0 ? (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          {t("stats.noPlayers")}
        </p>
      ) : (
        participants.map((name) => {
          const stat = entry.playerStats[name] ?? emptyStat;
          const parts = [`${stat.goals}${t("stats.abbrGoals")} ${stat.assists}${t("stats.abbrAssists")}`];
          if (stat.ownGoals > 0) parts.push(`${stat.ownGoals}${t("stats.abbrOwnGoals")}`);
          if (stat.yellowCards > 0) parts.push(`${stat.yellowCards}${t("stats.abbrYellow")}`);
          if (stat.redCards > 0) parts.push(`${stat.redCards}${t("stats.abbrRed")}`);
          const line = parts.join(" ") + (stat.rating > 0 ? ` · ${starDisplay(stat.rating)}` : "");
          return (
            <div
              key={name}
              className="list-row"
              style={{ cursor: readOnly ? "default" : "pointer" }}
              onClick={readOnly ? undefined : () => setEditingPlayer(name)}
            >
              <span>{name}</span>
              <span className="text-gray" style={{ fontSize: "0.8rem" }}>
                {line}
              </span>
            </div>
          );
        })
      )}

      {!readOnly && editingPlayer && (
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
  const [ownGoals, setOwnGoals] = useState(stat.ownGoals);
  const [assists, setAssists] = useState(stat.assists);
  const [yellowFoulCards, setYellowFoulCards] = useState(stat.yellowFoulCards);
  const [yellowDissentCards, setYellowDissentCards] = useState(stat.yellowDissentCards);
  const [straightRedCards, setStraightRedCards] = useState(stat.straightRedCards);
  const [secondYellowRedCards, setSecondYellowRedCards] = useState(stat.secondYellowRedCards);
  const [rating, setRating] = useState(stat.rating);

  function handleConfirm() {
    // "2. žlutá → červená" eviduje jen tu druhou žlutou (první žlutá se zapisuje zvlášť
    // přes "Žlutá – faul"/"Žlutá – řeči", jak se karty reálně dávají jedna po druhé) –
    // do legacy součtů (používaných v sezónních statistikách) se tedy počítá jako 1 žlutá + 1 červená.
    const yellowCards = yellowFoulCards + yellowDissentCards + secondYellowRedCards;
    const redCards = straightRedCards + secondYellowRedCards;
    onConfirm({
      goals,
      ownGoals,
      assists,
      yellowCards,
      redCards,
      rating,
      yellowFoulCards,
      yellowDissentCards,
      straightRedCards,
      secondYellowRedCards,
    });
  }

  return (
    <Dialog
      title={name}
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss}>
            {t("common.cancel")}
          </button>
          <button className="btn" style={{ width: "auto", padding: "10px 20px" }} onClick={handleConfirm}>
            {t("common.save")}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <StatCounterRow label={t("stats.goals")} value={goals} onChange={setGoals} />
        <StatCounterRow label={t("stats.ownGoal")} value={ownGoals} onChange={setOwnGoals} />
        <StatCounterRow label={t("stats.assists")} value={assists} onChange={setAssists} />
        <StatCounterRow label={t("stats.yellowFoul")} value={yellowFoulCards} onChange={setYellowFoulCards} />
        <StatCounterRow label={t("stats.yellowDissent")} value={yellowDissentCards} onChange={setYellowDissentCards} />
        <StatCounterRow label={t("stats.redStraight")} value={straightRedCards} onChange={setStraightRedCards} />
        <StatCounterRow label={t("stats.secondYellow")} value={secondYellowRedCards} onChange={setSecondYellowRedCards} />
        <div>
          <p style={{ marginBottom: 6 }}>{t("stats.rating")}</p>
          <StarRatingInput rating={rating} onRatingChange={setRating} />
        </div>
      </div>
    </Dialog>
  );
}
