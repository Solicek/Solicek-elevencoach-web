import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { ChipSelector } from "../Shell/ChipSelector";
import { todayDateString } from "../../lib/dateUtils";
import { AttendanceKind, allAttendanceKinds } from "../../types";

interface Props {
  onDismiss: () => void;
  onConfirm: (date: string, kind: string) => void;
}

export function AddAttendanceDialog({ onDismiss, onConfirm }: Props) {
  const [date, setDate] = useState(todayDateString());
  const [kind, setKind] = useState<string>(AttendanceKind.TRAINING);

  return (
    <Dialog
      title="Přidat docházku"
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss}>
            Zrušit
          </button>
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 20px" }}
            disabled={!date.trim()}
            onClick={() => onConfirm(date.trim(), kind)}
          >
            Přidat
          </button>
        </>
      }
    >
      <label className="field-label">Datum (DD-MM-RRRR)</label>
      <input className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="spacer-12" />
      <p className="text-bold" style={{ fontSize: "0.85rem", marginBottom: 4 }}>
        Typ:
      </p>
      <ChipSelector options={allAttendanceKinds} selected={kind} onSelect={setKind} />
    </Dialog>
  );
}
