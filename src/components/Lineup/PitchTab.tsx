import { useState } from "react";
import { Pitch } from "../Pitch/Pitch";
import { FormationDropdown } from "../Pitch/FormationDropdown";
import { SubstitutesSection } from "./SubstitutesSection";
import { Dialog } from "../Shell/Dialog";
import { formations, formationNames } from "../../formations";
import { t } from "../../lib/i18n";
import type { Player, PlayerPosition, Substitute } from "../../types";

interface Props {
  formationName: string;
  names: Record<string, string>;
  players: Player[];
  substitutes: Substitute[];
  onFormationChange: (name: string) => void;
  onAssignPlayer: (player: Player, pos: PlayerPosition) => void;
  onUnassignSlot: (key: string) => void;
  onCreatePlayer: (name: string, pos: PlayerPosition) => void;
  onAddSubstitute: (substitute: Substitute) => void;
  onRemoveSubstitute: (substitute: Substitute) => void;
  onClearLineup: () => void;
  readOnly?: boolean;
}

export function PitchTab({
  formationName,
  names,
  players,
  substitutes,
  onFormationChange,
  onAssignPlayer,
  onUnassignSlot,
  onCreatePlayer,
  onAddSubstitute,
  onRemoveSubstitute,
  onClearLineup,
  readOnly = false,
}: Props) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const currentStarterNames = new Set(
    Object.entries(names)
      .filter(([key]) => key.startsWith(`${formationName}|`))
      .map(([, name]) => name)
  );

  return (
    <div>
      <FormationDropdown selected={formationName} options={formationNames} onSelected={onFormationChange} readOnly={readOnly} />
      <div className="spacer-12" />
      <Pitch
        positions={formations[formationName] ?? []}
        formationName={formationName}
        names={names}
        players={players}
        onAssignPlayer={onAssignPlayer}
        onUnassignSlot={onUnassignSlot}
        onCreatePlayer={onCreatePlayer}
        readOnly={readOnly}
        style={{ width: "100%", aspectRatio: "0.62" }}
      />
      <div className="spacer-16" />
      <SubstitutesSection
        players={players}
        substitutes={substitutes}
        currentStarterNames={currentStarterNames}
        readOnly={readOnly}
        onAdd={onAddSubstitute}
        onRemove={onRemoveSubstitute}
      />
      {!readOnly && (
        <>
          <div className="spacer-16" />
          <button className="btn-outline danger" onClick={() => setShowClearConfirm(true)}>
            {t("lineup.clear")}
          </button>
        </>
      )}

      {showClearConfirm && (
        <Dialog
          title={t("lineup.clearConfirmTitle")}
          onDismiss={() => setShowClearConfirm(false)}
          actions={
            <>
              <button className="btn-text" onClick={() => setShowClearConfirm(false)}>
                {t("common.cancel")}
              </button>
              <button
                className="btn"
                style={{ width: "auto", padding: "10px 20px", background: "var(--error)" }}
                onClick={() => {
                  onClearLineup();
                  setShowClearConfirm(false);
                }}
              >
                {t("common.delete")}
              </button>
            </>
          }
        >
          <p>{t("lineup.clearConfirmBody")}</p>
        </Dialog>
      )}
    </div>
  );
}
