import { useState } from "react";
import { Pitch } from "../Pitch/Pitch";
import { FormationDropdown } from "../Pitch/FormationDropdown";
import { SubstitutesSection } from "./SubstitutesSection";
import { SaveLineupDialog } from "./SaveLineupDialog";
import { Dialog } from "../Shell/Dialog";
import { formations, formationNames } from "../../formations";
import type { ArchivedLineup, Player, PlayerPosition, Substitute } from "../../types";

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
  onSaveToArchive: (entry: ArchivedLineup) => void;
  onClearLineup: () => void;
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
  onSaveToArchive,
  onClearLineup,
}: Props) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const currentStarterNames = new Set(
    Object.entries(names)
      .filter(([key]) => key.startsWith(`${formationName}|`))
      .map(([, name]) => name)
  );

  return (
    <div>
      <FormationDropdown selected={formationName} options={formationNames} onSelected={onFormationChange} />
      <div className="spacer-12" />
      <button className="btn-outline" onClick={() => setShowSaveDialog(true)}>
        Uložit sestavu do archivu
      </button>
      <div className="spacer-8" />
      <button className="btn-outline danger" onClick={() => setShowClearConfirm(true)}>
        Smazat sestavu
      </button>
      <div className="spacer-12" />
      <Pitch
        positions={formations[formationName] ?? []}
        formationName={formationName}
        names={names}
        players={players}
        onAssignPlayer={onAssignPlayer}
        onUnassignSlot={onUnassignSlot}
        onCreatePlayer={onCreatePlayer}
        style={{ width: "100%", aspectRatio: "0.62" }}
      />
      <div className="spacer-16" />
      <SubstitutesSection
        players={players}
        substitutes={substitutes}
        currentStarterNames={currentStarterNames}
        onAdd={onAddSubstitute}
        onRemove={onRemoveSubstitute}
      />

      {showSaveDialog && (
        <SaveLineupDialog
          onDismiss={() => setShowSaveDialog(false)}
          onConfirm={(date, opponent, matchType) => {
            onSaveToArchive({
              id: crypto.randomUUID(),
              date,
              opponent,
              formationName,
              names: { ...names },
              substitutes: [...substitutes],
              notes: "",
              photoPaths: [],
              result: "",
              playerStats: {},
              matchType,
            });
            setShowSaveDialog(false);
          }}
        />
      )}

      {showClearConfirm && (
        <Dialog
          title="Smazat sestavu?"
          onDismiss={() => setShowClearConfirm(false)}
          actions={
            <>
              <button className="btn-text" onClick={() => setShowClearConfirm(false)}>
                Zrušit
              </button>
              <button
                className="btn"
                style={{ width: "auto", padding: "10px 20px", background: "var(--error)" }}
                onClick={() => {
                  onClearLineup();
                  setShowClearConfirm(false);
                }}
              >
                Smazat
              </button>
            </>
          }
        >
          <p>Opravdu chceš vyčistit hřiště? Všichni hráči se uvolní z pozic a půjde je přiřadit znovu. Náhradníci zůstanou beze změny.</p>
        </Dialog>
      )}
    </div>
  );
}
