import { useEffect, useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { AttendanceInlineSection } from "../Attendance/AttendanceChecklist";
import { TrainingBlockRow } from "./TrainingBlockRow";
import { DiagramPreview } from "./DiagramPreview";
import { AddCustomDrillDialog } from "./AddCustomDrillDialog";
import { AiDrillGeneratorDialog } from "./AiDrillGeneratorDialog";
import { DrillDiagramViewerDialog } from "./DrillDiagramViewerDialog";
import { AddManualBlockDialog } from "./AddManualBlockDialog";
import { SaveTemplateDialog } from "./SaveTemplateDialog";
import { InsertTemplateDialog } from "./InsertTemplateDialog";
import { LiveTrainingScreen } from "./LiveTrainingScreen";
import { positionSortOrder } from "../../lib/assignment";
import { AttendanceKind } from "../../types";
import type { AttendanceRecord, Drill, Player, TrainingSession, TrainingTemplate } from "../../types";

interface Props {
  session: TrainingSession;
  players: Player[];
  attendanceRecord: AttendanceRecord | null;
  allDrills: Drill[];
  templates: TrainingTemplate[];
  onBack: () => void;
  onUpdateSession: (session: TrainingSession) => void;
  onDeleteSession: () => void;
  onAddAttendanceRecord: (record: AttendanceRecord) => void;
  onUpdateAttendanceRecord: (record: AttendanceRecord) => void;
  onAddCustomDrill: (drill: Drill) => void;
  onDeleteCustomDrill: (drill: Drill) => void;
  onAddTemplate: (template: TrainingTemplate) => void;
  onDeleteTemplate: (template: TrainingTemplate) => void;
}

export function TrainingDetailScreen({
  session,
  players,
  attendanceRecord,
  allDrills,
  templates,
  onBack,
  onUpdateSession,
  onDeleteSession,
  onAddAttendanceRecord,
  onUpdateAttendanceRecord,
  onAddCustomDrill,
  onDeleteCustomDrill,
  onAddTemplate,
  onDeleteTemplate,
}: Props) {
  const [notes, setNotes] = useState(session.notes);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddDrillDialog, setShowAddDrillDialog] = useState(false);
  const [showAddManualBlockDialog, setShowAddManualBlockDialog] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showInsertTemplateDialog, setShowInsertTemplateDialog] = useState(false);
  const [showLiveMode, setShowLiveMode] = useState(false);
  const [showAiDrillDialog, setShowAiDrillDialog] = useState(false);
  const [enlargedDrill, setEnlargedDrill] = useState<Drill | null>(null);

  useEffect(() => setNotes(session.notes), [session.id]);
  useEffect(() => {
    if (notes !== session.notes) onUpdateSession({ ...session, notes });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  if (showLiveMode) {
    return <LiveTrainingScreen session={session} onExit={() => setShowLiveMode(false)} />;
  }

  const totalMinutes = session.blocks.reduce((sum, b) => sum + b.minutes, 0);
  const drillsByCategory = new Map<string, Drill[]>();
  for (const drill of allDrills) {
    const list = drillsByCategory.get(drill.category) ?? [];
    list.push(drill);
    drillsByCategory.set(drill.category, list);
  }

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
        {session.date}
      </p>

      <div className="spacer-8" />
      <button className="btn" disabled={session.blocks.length === 0} onClick={() => setShowLiveMode(true)}>
        ▶ Spustit trénink
      </button>

      <div className="spacer-12" />
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        Docházka
      </p>
      <div className="spacer-8" />
      <AttendanceInlineSection
        record={attendanceRecord}
        players={players}
        onCreate={() =>
          onAddAttendanceRecord({
            id: crypto.randomUUID(),
            date: session.date,
            playerNames: [...players].sort((a, b) => positionSortOrder(a) - positionSortOrder(b)).map((p) => p.name),
            absentNames: [],
            trainingId: session.id,
            matchId: null,
            kind: AttendanceKind.TRAINING,
          })
        }
        onUpdate={onUpdateAttendanceRecord}
      />

      <div className="spacer-16" />
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {session.blocks.length === 0 ? "Bloky tréninku" : `Bloky tréninku · ${totalMinutes} min`}
      </p>
      <div className="spacer-8" />
      {session.blocks.length === 0 ? (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          Zatím žádné bloky. Přidej cvičení z knihovny níže, vlastní blok, nebo vlož uloženou šablonu.
        </p>
      ) : (
        session.blocks.map((block) => (
          <TrainingBlockRow
            key={block.id}
            block={block}
            onMinutesChange={(minutes) =>
              onUpdateSession({ ...session, blocks: session.blocks.map((b) => (b.id === block.id ? { ...b, minutes } : b)) })
            }
            onRemove={() => onUpdateSession({ ...session, blocks: session.blocks.filter((b) => b.id !== block.id) })}
          />
        ))
      )}

      <div className="spacer-8" />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={() => setShowAddManualBlockDialog(true)}>
          + Vlastní blok
        </button>
        <button
          className="btn-outline"
          style={{ flex: 1 }}
          disabled={templates.length === 0}
          onClick={() => setShowInsertTemplateDialog(true)}
        >
          + Vložit šablonu
        </button>
      </div>

      <div className="spacer-8" />
      <button className="btn-outline" disabled={session.blocks.length === 0} onClick={() => setShowSaveTemplateDialog(true)}>
        Uložit jako šablonu
      </button>

      <div className="spacer-16" />
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        Poznámky
      </p>
      <div className="spacer-8" />
      <textarea
        className="input"
        style={{ height: 100, resize: "vertical" }}
        placeholder="Volné poznámky k tréninku…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="spacer-16" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="text-bold" style={{ fontSize: "0.9rem" }}>
          Knihovna cvičení
        </p>
        <div style={{ display: "flex" }}>
          <button className="btn-text" onClick={() => setShowAiDrillDialog(true)}>
            ✨ AI asistent
          </button>
          <button className="btn-text" onClick={() => setShowAddDrillDialog(true)}>
            + Vlastní cvičení
          </button>
        </div>
      </div>
      <p className="text-gray" style={{ fontSize: "0.75rem" }}>
        Klepnutím přidáš cvičení jako blok.
      </p>
      <div className="spacer-8" />

      {Array.from(drillsByCategory.entries()).map(([category, drills]) => (
        <div key={category}>
          <p className="text-bold" style={{ fontSize: "0.85rem", color: "var(--pitch-green)" }}>
            {category}
          </p>
          <div className="spacer-8" />
          {drills.map((drill) => (
            <div key={drill.id}>
              <div
                className="list-row"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  onUpdateSession({
                    ...session,
                    blocks: [...session.blocks, { id: crypto.randomUUID(), title: drill.name, description: drill.description, minutes: 10 }],
                  })
                }
              >
                {drill.diagram.length > 0 && (
                  <DiagramPreview
                    diagram={drill.diagram}
                    style={{ width: 48, aspectRatio: "0.62", flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEnlargedDrill(drill);
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.9rem" }}>{drill.name}</p>
                  <p className="text-gray" style={{ fontSize: "0.8rem" }}>
                    {drill.description}
                  </p>
                </div>
                {drill.isCustom && (
                  <span
                    className="text-error text-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustomDrill(drill);
                    }}
                  >
                    ×
                  </span>
                )}
                <span className="text-bold" style={{ color: "var(--primary)", fontSize: "1.2rem" }}>
                  +
                </span>
              </div>
            </div>
          ))}
          <div className="spacer-8" />
        </div>
      ))}

      {showDeleteConfirm && (
        <Dialog
          title="Smazat trénink?"
          onDismiss={() => setShowDeleteConfirm(false)}
          actions={
            <>
              <button className="btn-text" onClick={() => setShowDeleteConfirm(false)}>
                Zrušit
              </button>
              <button className="btn" style={{ width: "auto", padding: "10px 20px", background: "var(--error)" }} onClick={onDeleteSession}>
                Smazat
              </button>
            </>
          }
        >
          <p>Opravdu chceš smazat naplánovaný trénink z {session.date}?</p>
        </Dialog>
      )}

      {enlargedDrill && <DrillDiagramViewerDialog drill={enlargedDrill} onDismiss={() => setEnlargedDrill(null)} />}

      {showAiDrillDialog && (
        <AiDrillGeneratorDialog
          onDismiss={() => setShowAiDrillDialog(false)}
          onConfirm={(drill) => {
            onAddCustomDrill(drill);
            setShowAiDrillDialog(false);
          }}
        />
      )}

      {showAddDrillDialog && (
        <AddCustomDrillDialog
          onDismiss={() => setShowAddDrillDialog(false)}
          onConfirm={(drill) => {
            onAddCustomDrill(drill);
            setShowAddDrillDialog(false);
          }}
        />
      )}

      {showAddManualBlockDialog && (
        <AddManualBlockDialog
          onDismiss={() => setShowAddManualBlockDialog(false)}
          onConfirm={(block) => {
            onUpdateSession({ ...session, blocks: [...session.blocks, block] });
            setShowAddManualBlockDialog(false);
          }}
        />
      )}

      {showSaveTemplateDialog && (
        <SaveTemplateDialog
          onDismiss={() => setShowSaveTemplateDialog(false)}
          onConfirm={(name) => {
            onAddTemplate({ id: crypto.randomUUID(), name, blocks: session.blocks });
            setShowSaveTemplateDialog(false);
          }}
        />
      )}

      {showInsertTemplateDialog && (
        <InsertTemplateDialog
          templates={templates}
          onDismiss={() => setShowInsertTemplateDialog(false)}
          onSelect={(template) => {
            onUpdateSession({
              ...session,
              blocks: [...session.blocks, ...template.blocks.map((b) => ({ ...b, id: crypto.randomUUID() }))],
            });
            setShowInsertTemplateDialog(false);
          }}
          onDelete={onDeleteTemplate}
        />
      )}
    </div>
  );
}
