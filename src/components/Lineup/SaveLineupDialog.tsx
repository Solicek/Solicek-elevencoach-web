import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { ChipSelector } from "../Shell/ChipSelector";
import { todayDateString } from "../../lib/dateUtils";
import { MatchType, allMatchTypes } from "../../types";

interface Props {
  onDismiss: () => void;
  onConfirm: (date: string, opponent: string, matchType: string) => void;
}

export function SaveLineupDialog({ onDismiss, onConfirm }: Props) {
  const [date, setDate] = useState(todayDateString());
  const [opponent, setOpponent] = useState("");
  const [matchType, setMatchType] = useState<string>(MatchType.COMPETITIVE);

  return (
    <Dialog
      title="Uložit sestavu do archivu"
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss}>
            Zrušit
          </button>
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 20px" }}
            disabled={!date.trim() || !opponent.trim()}
            onClick={() => onConfirm(date.trim(), opponent.trim(), matchType)}
          >
            Uložit
          </button>
        </>
      }
    >
      <label className="field-label">Datum (DD-MM-RRRR)</label>
      <input className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="spacer-12" />
      <label className="field-label">S kým se hrálo</label>
      <input className="input" value={opponent} onChange={(e) => setOpponent(e.target.value)} />
      <div className="spacer-12" />
      <p className="text-bold" style={{ fontSize: "0.85rem", marginBottom: 4 }}>
        Typ zápasu:
      </p>
      <ChipSelector options={allMatchTypes} selected={matchType} onSelect={setMatchType} />
    </Dialog>
  );
}
