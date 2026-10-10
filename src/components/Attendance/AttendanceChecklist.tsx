import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import type { AttendanceRecord, Player } from "../../types";
import { t, tf } from "../../lib/i18n";

interface Props {
  record: AttendanceRecord;
  players: Player[];
  onUpdate: (record: AttendanceRecord) => void;
  readOnly?: boolean;
}

/**
 * Editovatelný seznam přítomných/nepřítomných pro jeden záznam docházky, plus možnost
 * dodatečně přidat hráče, kteří v rosteru přibyli až po založení tohoto záznamu.
 */
export function AttendanceChecklist({ record, players, onUpdate, readOnly = false }: Props) {
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
        {tf("att.presentOf", { present: String(presentCount), total: String(record.playerNames.length) })}
      </p>
      <div className="spacer-8" />
      {record.playerNames.length === 0 ? (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          {t("att.noPlayersWere")}
        </p>
      ) : (
        record.playerNames.map((name) => {
          const present = !record.absentNames.includes(name);
          return (
            <div
              key={name}
              className="list-row"
              style={{ cursor: readOnly ? "default" : "pointer", padding: "8px 0" }}
              onClick={readOnly ? undefined : () => toggle(name, present)}
            >
              <span>{name}</span>
              <input type="checkbox" checked={present} readOnly />
            </div>
          );
        })
      )}

      {!readOnly && missingPlayers.length > 0 && (
        <>
          <div className="spacer-8" />
          <button className="btn-outline" onClick={() => setShowAddPlayerDialog(true)}>
            {t("att.addPlayer")}
          </button>
        </>
      )}

      {!readOnly && showAddPlayerDialog && (
        <Dialog
          title={t("att.addPlayerTitle")}
          onDismiss={() => setShowAddPlayerDialog(false)}
          actions={
            <button className="btn-text" onClick={() => setShowAddPlayerDialog(false)}>
              {t("common.cancel")}
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
  readOnly?: boolean;
}

/** Sdílená docházková sekce vložená přímo do detailu tréninku/zápasu. */
export function AttendanceInlineSection({ record, players, onCreate, onUpdate, readOnly = false }: InlineProps) {
  if (!record) {
    if (readOnly) {
      return (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          {t("att.notRecorded")}
        </p>
      );
    }
    return (
      <button className="btn-outline" onClick={onCreate}>
        {t("att.record")}
      </button>
    );
  }
  return <AttendanceChecklist record={record} players={players} onUpdate={onUpdate} readOnly={readOnly} />;
}
