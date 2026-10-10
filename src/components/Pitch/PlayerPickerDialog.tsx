import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { playerMatchesPositionCode } from "../../lib/assignment";
import { positionDisplayFromKey, t } from "../../lib/i18n";
import type { Player } from "../../types";

interface Props {
  positionLabel: string;
  positionCode: string;
  currentName: string | null;
  players: Player[];
  onDismiss: () => void;
  onSelectPlayer: (player: Player) => void;
  onCreatePlayer: (name: string) => void;
  onClearSlot: () => void;
}

export function PlayerPickerDialog({
  positionLabel,
  positionCode,
  currentName,
  players,
  onDismiss,
  onSelectPlayer,
  onCreatePlayer,
  onClearSlot,
}: Props) {
  const [newName, setNewName] = useState("");

  // Kdo aktuálně sedí na téhle pozici se bere z currentName (odvozeno z autoritativní mapy
  // names), NE z Player.positionKey – to pole se do rosteru zapisuje asynchronně a může být
  // zastaralé. Řazeno podle jména, aby pořadí v seznamu bylo stálé.
  const candidates = players
    .filter((p) => playerMatchesPositionCode(p.preferredPositions, positionCode) && p.name !== currentName)
    .sort((a, b) => a.name.localeCompare(b.name));

  const isDuplicateNewName =
    newName.trim() !== "" && players.some((p) => p.name.trim().toLowerCase() === newName.trim().toLowerCase());

  return (
    <Dialog
      title={`${t("picker.title")} – ${positionLabel}`}
      onDismiss={onDismiss}
      actions={
        <>
          {currentName && (
            <button className="btn-text danger" onClick={onClearSlot} style={{ marginRight: "auto" }}>
              {t("picker.clearSlot")}
            </button>
          )}
          <button className="btn-text" onClick={onDismiss}>
            {t("common.cancel")}
          </button>
        </>
      }
    >
      {currentName && (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          {t("picker.current")}: {currentName}
        </p>
      )}
      <p className="text-bold" style={{ fontSize: "0.85rem", marginTop: 8 }}>
        {t("picker.fromRoster")} ({positionLabel}):
      </p>
      {candidates.length === 0 ? (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          {t("picker.noneForPosition")}
        </p>
      ) : (
        <div style={{ maxHeight: 260, overflowY: "auto" }}>
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="list-row"
              style={{ padding: "10px 0", cursor: "pointer" }}
              onClick={() => onSelectPlayer(candidate)}
            >
              <span>{candidate.name}</span>
              <span className="text-gray" style={{ fontSize: "0.75rem" }}>
                {positionDisplayFromKey(candidate.positionKey) ?? t("picker.unassigned")}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-bold" style={{ fontSize: "0.85rem", marginTop: 12 }}>
        {t("picker.orAddNew")}
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
        <input
          className="input"
          placeholder={t("picker.playerName")}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          className="btn"
          style={{ width: "auto", padding: "10px 16px" }}
          disabled={!newName.trim() || isDuplicateNewName}
          onClick={() => onCreatePlayer(newName.trim())}
        >
          {t("common.add")}
        </button>
      </div>
      {isDuplicateNewName && (
        <p className="text-error" style={{ fontSize: "0.75rem", marginTop: 4 }}>
          {t("picker.duplicateName")}
        </p>
      )}
    </Dialog>
  );
}
