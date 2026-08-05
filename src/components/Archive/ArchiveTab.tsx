import { useState } from "react";
import type { ArchivedLineup, Substitute } from "../../types";
import { SeasonSummarySection, PlayerStatsSummarySection } from "./SeasonSummarySection";
import { SaveLineupDialog } from "../Lineup/SaveLineupDialog";
import { ArchiveDetailScreen } from "./ArchiveDetailScreen";
import { MatchType } from "../../types";

interface Props {
  teamCode: string;
  archive: ArchivedLineup[];
  currentFormationName: string;
  currentNames: Record<string, string>;
  currentSubstitutes: Substitute[];
  onAddEntry: (entry: ArchivedLineup) => void;
  onUpdateEntry: (entry: ArchivedLineup) => void;
  onDeleteEntry: (entry: ArchivedLineup) => void;
}

export function ArchiveTab({
  teamCode,
  archive,
  currentFormationName,
  currentNames,
  currentSubstitutes,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}: Props) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const selectedEntry = archive.find((e) => e.id === selectedEntryId);

  if (selectedEntry) {
    return (
      <ArchiveDetailScreen
        teamCode={teamCode}
        entry={selectedEntry}
        onBack={() => setSelectedEntryId(null)}
        onUpdateEntry={onUpdateEntry}
        onDeleteEntry={() => {
          onDeleteEntry(selectedEntry);
          setSelectedEntryId(null);
        }}
      />
    );
  }

  return (
    <div className="content-with-fab" style={{ position: "relative", minHeight: "60dvh" }}>
      {archive.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50dvh" }}>
          <p className="text-gray" style={{ textAlign: "center", whiteSpace: "pre-line" }}>
            {"Archiv je zatím prázdný.\nUlož si aktuální sestavu k datu a soupeři."}
          </p>
        </div>
      ) : (
        <>
          <SeasonSummarySection archive={archive} />
          <PlayerStatsSummarySection archive={archive} />
          <hr style={{ border: "none", borderTop: "1px solid var(--divider)" }} />
          {archive.map((entry) => (
            <div key={entry.id} className="list-row" style={{ cursor: "pointer" }} onClick={() => setSelectedEntryId(entry.id)}>
              <div style={{ flex: 1 }}>
                <p className="text-bold">{entry.result ? `${entry.opponent} ${entry.result}` : entry.opponent}</p>
                <p className="text-gray" style={{ fontSize: "0.8rem" }}>
                  {entry.date} · {entry.formationName}
                  {entry.matchType === MatchType.FRIENDLY ? " · Přátelské" : ""}
                </p>
              </div>
              {entry.photoPaths.length > 0 && (
                <span className="text-gray" style={{ fontSize: "0.8rem" }}>
                  📷 {entry.photoPaths.length}
                </span>
              )}
            </div>
          ))}
        </>
      )}

      <button className="btn fab-button" onClick={() => setShowSaveDialog(true)}>
        + Uložit aktuální sestavu do archivu
      </button>

      {showSaveDialog && (
        <SaveLineupDialog
          onDismiss={() => setShowSaveDialog(false)}
          onConfirm={(date, opponent, matchType) => {
            const entry: ArchivedLineup = {
              id: crypto.randomUUID(),
              date,
              opponent,
              formationName: currentFormationName,
              names: { ...currentNames },
              substitutes: [...currentSubstitutes],
              notes: "",
              photoPaths: [],
              result: "",
              playerStats: {},
              matchType,
            };
            onAddEntry(entry);
            setShowSaveDialog(false);
            setSelectedEntryId(entry.id);
          }}
        />
      )}
    </div>
  );
}
