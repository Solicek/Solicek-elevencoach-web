import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import type { AttendanceRecord, Player } from "../../types";

interface Props {
  record: AttendanceRecord;
  players: Player[];
  onUpdate: (record: AttendanceRecord) => void;
}

/**
 * Editovatelný seznam přítomných/nepřítomných pro jeden záznam docházky, plus možnost
 * dodatečně přidat hráče, kteří v rosteru přibyli až po založení tohoto záznamu.
 */
export function AttendanceChecklist({ record, players, onUpdate }: Props) {
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const missingPlayers = players.filter((p) => p.name.trim() !== "" && !record.playerNames.includes(p.name));

  const presentCount = record.playerNames.length - record.absentNames.length;

  function toggle(name: string, present: boolean) {
    const newAbsent = present ? [...record.absentNames, name] : record.absentNames.filter((n) => n !== name);
    onUpdate({ ...record, absentNames: newAbsent });
  }

  return (
    <div>
      <p className="text-gray" style={{ fontSize: "0.8rem" }}>
        {presentCount}/{record.playerNames.length} přítomných
      </p>
      <div className="spacer-8" />
      {record.playerNames.length === 0 ? (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          V rosteru nebyli žádní hráči.
        </p>
      ) : (
        record.playerNames.map((name) => {
          const present = !record.absentNames.includes(name);
          return (
            <div
              key={name}
              className="list-row"
              style={{ cursor: "pointer", padding: "8px 0" }}
              onClick={() => toggle(name, present)}
            >
              <span>{name}</span>
              <input type="checkbox" checked={present} readOnly />
            </div>
          );
        })
      )}

      {missingPlayers.length > 0 && (
        <>
          <div className="spacer-8" />
          <button className="btn-outline" onClick={() => setShowAddPlayerDialog(true)}>
            + Přidat hráče do docházky
          </button>
        </>
      )}

      {showAddPlayerDialog && (
        <Dialog
          title="Přidat hráče do docházky"
          onDismiss={() => setShowAddPlayerDialog(false)}
          actions={
            <button className="btn-text" onClick={() => setShowAddPlayerDialog(false)}>
              Zrušit
            </button>
          }
        >
          {missingPlayers.map((p) => (
            <div
              key={p.id}
              style={{ padding: "10px 0", cursor: "pointer" }}
              onClick={() => {
                onUpdate({ ...record, playerNames: [...record.playerNames, p.name] });
                setShowAddPlayerDialog(false);
              }}
            >
              {p.name}
            </div>
          ))}
        </Dialog>
      )}
    </div>
  );
}

interface InlineProps {
  record: AttendanceRecord | null;
  players: Player[];
  onCreate: () => void;
  onUpdate: (record: AttendanceRecord) => void;
}

/** Sdílená docházková sekce vložená přímo do detailu tréninku/zápasu. */
export function AttendanceInlineSection({ record, players, onCreate, onUpdate }: InlineProps) {
  if (!record) {
    return (
      <button className="btn-outline" onClick={onCreate}>
        Zapsat docházku
      </button>
    );
  }
  return <AttendanceChecklist record={record} players={players} onUpdate={onUpdate} />;
}
