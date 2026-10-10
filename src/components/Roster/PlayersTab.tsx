import { useState } from "react";
import type { Player } from "../../types";
import { AddPlayerDialog, EditPlayerDialog } from "./PlayerDialogs";
import { currentLang, positionDisplayFromKey, positionName, t } from "../../lib/i18n";

interface Props {
  players: Player[];
  onAddPlayer: (player: Player) => void;
  onEditPlayer: (player: Player) => void;
  onRemovePlayer: (player: Player) => void;
  readOnly?: boolean;
}

export function PlayersTab({ players, onAddPlayer, onEditPlayer, onRemovePlayer, readOnly = false }: Props) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name, currentLang()));

  return (
    <div style={{ position: "relative", minHeight: "60dvh" }}>
      {sorted.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50dvh" }}>
          <p className="text-gray" style={{ textAlign: "center", whiteSpace: "pre-line" }}>
            {t("roster.empty")}
          </p>
        </div>
      ) : (
        <div className="content-with-fab">
          {sorted.map((player) => (
            <div className="list-row" key={player.id}>
              <div style={{ flex: 1 }}>
                <p className="text-bold">{player.name}</p>
                <p className="text-gray" style={{ fontSize: "0.8rem" }}>
                  {player.preferredPositions.length === 0
                    ? t("roster.noPosition")
                    : player.preferredPositions.map((p) => positionName(p)).join(", ")}
                  {" · "}
                  {positionDisplayFromKey(player.positionKey) ?? t("roster.notPlaying")}
                </p>
              </div>
              {!readOnly && (
                <>
                  <button className="btn-text" onClick={() => setEditingPlayer(player)}>
                    {t("common.edit")}
                  </button>
                  <button className="btn-text danger" onClick={() => onRemovePlayer(player)}>
                    {t("common.remove")}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <button className="btn fab-button" onClick={() => setShowAddDialog(true)}>
          {t("roster.addPlayer")}
        </button>
      )}

      {showAddDialog && (
        <AddPlayerDialog
          existingNames={new Set(players.map((p) => p.name.trim().toLowerCase()))}
          onDismiss={() => setShowAddDialog(false)}
          onConfirm={(player) => {
            onAddPlayer(player);
            setShowAddDialog(false);
          }}
        />
      )}

      {editingPlayer && (
        <EditPlayerDialog
          player={editingPlayer}
          existingNames={
            new Set(players.filter((p) => p.id !== editingPlayer.id).map((p) => p.name.trim().toLowerCase()))
          }
          onDismiss={() => setEditingPlayer(null)}
          onConfirm={(updated) => {
            onEditPlayer(updated);
            setEditingPlayer(null);
          }}
        />
      )}
    </div>
  );
}
