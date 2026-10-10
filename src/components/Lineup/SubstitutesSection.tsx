import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { positionName, t } from "../../lib/i18n";
import type { Player, Substitute } from "../../types";

interface Props {
  players: Player[];
  substitutes: Substitute[];
  currentStarterNames: Set<string>;
  onAdd: (substitute: Substitute) => void;
  onRemove: (substitute: Substitute) => void;
  readOnly?: boolean;
}

export function SubstitutesSection({ players, substitutes, currentStarterNames, onAdd, onRemove, readOnly = false }: Props) {
  const [showDialog, setShowDialog] = useState(false);

  const substituteNames = new Set(substitutes.map((s) => s.name));
  // "Kdo už hraje v základní sestavě" se bere z currentStarterNames (aktuální jména na hřišti
  // v aktuální formaci), ne z Player.positionKey – to pole se aktualizuje asynchronně a může
  // hráče, co už na hřišti nejsou, omylem vynechat z nabídky.
  const availablePlayers = players
    .filter((p) => !substituteNames.has(p.name) && !currentStarterNames.has(p.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {t("subs.title")} ({substitutes.length})
      </p>
      <div className="spacer-8" />
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {substitutes.map((substitute) => (
          <div key={substitute.id} className="chip" style={{ background: "var(--surface-variant)" }}>
            <span style={{ color: "white" }}>{substitute.name}</span>
            {!readOnly && (
              <span style={{ color: "var(--error)", fontWeight: 700, cursor: "pointer" }} onClick={() => onRemove(substitute)}>
                ×
              </span>
            )}
          </div>
        ))}
        {!readOnly && (
          <button className="chip" onClick={() => setShowDialog(true)}>
            {t("subs.add")}
          </button>
        )}
      </div>

      {!readOnly && showDialog && (
        <Dialog
          title={t("subs.addTitle")}
          onDismiss={() => setShowDialog(false)}
          actions={
            <button className="btn-text" onClick={() => setShowDialog(false)}>
              {t("common.cancel")}
            </button>
          }
        >
          {availablePlayers.length === 0 ? (
            <p className="text-gray" style={{ fontSize: "0.8rem" }}>
              {t("subs.noneAvailable")}
            </p>
          ) : (
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {availablePlayers.map((player) => (
                <div
                  key={player.id}
                  className="list-row"
                  style={{ padding: "10px 0", cursor: "pointer" }}
                  onClick={() => {
                    onAdd({ id: crypto.randomUUID(), name: player.name, positions: player.preferredPositions });
                    setShowDialog(false);
                  }}
                >
                  <span>{player.name}</span>
                  <span className="text-gray" style={{ fontSize: "0.75rem" }}>
                    {player.preferredPositions.map((p) => positionName(p)).join(", ") || t("subs.noPosition")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Dialog>
      )}
    </div>
  );
}
