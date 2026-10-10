import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { PositionCheckboxList } from "./PositionCheckboxList";
import { t } from "../../lib/i18n";
import type { Player } from "../../types";

interface AddProps {
  existingNames: Set<string>;
  onDismiss: () => void;
  onConfirm: (player: Player) => void;
}

export function AddPlayerDialog({ existingNames, onDismiss, onConfirm }: AddProps) {
  const [name, setName] = useState("");
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const isDuplicate = name.trim() !== "" && existingNames.has(name.trim().toLowerCase());

  function toggle(code: string) {
    setSelectedPositions((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  return (
    <Dialog
      title={t("roster.addTitle")}
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss}>
            {t("common.cancel")}
          </button>
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 20px" }}
            disabled={!name.trim() || isDuplicate}
            onClick={() =>
              onConfirm({
                id: crypto.randomUUID(),
                name: name.trim(),
                preferredPositions: selectedPositions,
                positionKey: null,
                positionDisplayName: null,
              })
            }
          >
            {t("common.add")}
          </button>
        </>
      }
    >
      <input className="input" placeholder={t("picker.playerName")} value={name} onChange={(e) => setName(e.target.value)} />
      {isDuplicate && (
        <p className="text-error" style={{ fontSize: "0.75rem", marginTop: 4 }}>
          {t("picker.duplicateName")}
        </p>
      )}
      <div className="spacer-8" />
      <p className="text-bold" style={{ fontSize: "0.85rem" }}>
        {t("roster.positionsHint")}
      </p>
      <PositionCheckboxList selected={selectedPositions} onToggle={toggle} />
    </Dialog>
  );
}

interface EditProps {
  player: Player;
  existingNames: Set<string>;
  onDismiss: () => void;
  onConfirm: (player: Player) => void;
}

export function EditPlayerDialog({ player, existingNames, onDismiss, onConfirm }: EditProps) {
  const [name, setName] = useState(player.name);
  const [selectedPositions, setSelectedPositions] = useState<string[]>(player.preferredPositions);
  const isDuplicate =
    name.trim() !== "" &&
    name.trim().toLowerCase() !== player.name.trim().toLowerCase() &&
    existingNames.has(name.trim().toLowerCase());

  function toggle(code: string) {
    setSelectedPositions((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  return (
    <Dialog
      title={t("roster.editTitle")}
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss}>
            {t("common.cancel")}
          </button>
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 20px" }}
            disabled={!name.trim() || isDuplicate}
            onClick={() => onConfirm({ ...player, name: name.trim(), preferredPositions: selectedPositions })}
          >
            {t("common.save")}
          </button>
        </>
      }
    >
      <input className="input" placeholder={t("picker.playerName")} value={name} onChange={(e) => setName(e.target.value)} />
      {isDuplicate && (
        <p className="text-error" style={{ fontSize: "0.75rem", marginTop: 4 }}>
          {t("picker.duplicateName")}
        </p>
      )}
      <div className="spacer-8" />
      <p className="text-bold" style={{ fontSize: "0.85rem" }}>
        {t("roster.positionsHint")}
      </p>
      <PositionCheckboxList selected={selectedPositions} onToggle={toggle} />
    </Dialog>
  );
}
