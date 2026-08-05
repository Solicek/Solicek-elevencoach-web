import { useEffect, useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { ChipSelector } from "../Shell/ChipSelector";
import { ArchivedPitchPreview } from "./ArchivedPitchPreview";
import { PlayerStatsSection } from "./PlayerStatsSection";
import { PhotoGallery } from "./PhotoGallery";
import { allMatchTypes, MatchType } from "../../types";
import type { ArchivedLineup } from "../../types";

interface Props {
  teamCode: string;
  entry: ArchivedLineup;
  onBack: () => void;
  onUpdateEntry: (entry: ArchivedLineup) => void;
  onDeleteEntry: () => void;
}

export function ArchiveDetailScreen({ teamCode, entry, onBack, onUpdateEntry, onDeleteEntry }: Props) {
  const [notes, setNotes] = useState(entry.notes);
  const [result, setResult] = useState(entry.result);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => setNotes(entry.notes), [entry.id]);
  useEffect(() => setResult(entry.result), [entry.id]);

  useEffect(() => {
    if (notes !== entry.notes) onUpdateEntry({ ...entry, notes });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);
  useEffect(() => {
    if (result !== entry.result) onUpdateEntry({ ...entry, result });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="btn-text" onClick={onBack}>
          ← Zpět
        </button>
        <button className="btn-text danger" onClick={() => setShowDeleteConfirm(true)}>
          Smazat
        </button>
      </div>

      <p className="text-bold" style={{ fontSize: "1.1rem" }}>
        {result.trim() ? `${entry.opponent} ${result}` : entry.opponent}
      </p>
      <p className="text-gray" style={{ fontSize: "0.8rem" }}>
        {entry.date} · {entry.formationName}
      </p>

      <div className="spacer-8" />
      <ChipSelector options={allMatchTypes} selected={entry.matchType} onSelect={(t) => onUpdateEntry({ ...entry, matchType: t })} />
      {entry.matchType === MatchType.FRIENDLY && (
        <p className="text-gray" style={{ fontSize: "0.75rem", marginTop: 4 }}>
          Přátelský zápas se nezapočítává do bilance sezóny ani žebříčku.
        </p>
      )}

      <div className="spacer-8" />
      <label className="field-label">Výsledek</label>
      <input className="input" placeholder="např. 1:1 (1:0)" value={result} onChange={(e) => setResult(e.target.value)} />

      <div className="spacer-12" />
      <ArchivedPitchPreview formationName={entry.formationName} names={entry.names} style={{ width: "100%", aspectRatio: "0.62" }} />

      <div className="spacer-12" />
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        Poznámky
      </p>
      <div className="spacer-8" />
      <textarea
        className="input"
        style={{ height: 140, resize: "vertical" }}
        placeholder="Poznámky k tomuto zápasu…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="spacer-12" />
      <PhotoGallery teamCode={teamCode} entry={entry} onUpdateEntry={onUpdateEntry} />

      <div className="spacer-12" />
      <PlayerStatsSection entry={entry} onUpdateEntry={onUpdateEntry} />

      {showDeleteConfirm && (
        <Dialog
          title="Smazat sestavu?"
          onDismiss={() => setShowDeleteConfirm(false)}
          actions={
            <>
              <button className="btn-text" onClick={() => setShowDeleteConfirm(false)}>
                Zrušit
              </button>
              <button className="btn" style={{ width: "auto", padding: "10px 20px", background: "var(--error)" }} onClick={onDeleteEntry}>
                Smazat
              </button>
            </>
          }
        >
          <p>
            Opravdu chceš smazat sestavu "{entry.opponent}" ({entry.date}) včetně poznámek a fotek?
          </p>
        </Dialog>
      )}
    </div>
  );
}
