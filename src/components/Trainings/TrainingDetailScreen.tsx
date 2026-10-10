import { useEffect, useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { AttendanceInlineSection } from "../Attendance/AttendanceChecklist";
import { TrainingBlockRow } from "./TrainingBlockRow";
import { DiagramPreview } from "./DiagramPreview";
import { AddCustomDrillDialog } from "./AddCustomDrillDialog";
import { AiDrillGeneratorDialog } from "./AiDrillGeneratorDialog";
import { DrillSourcesDialog } from "./DrillSourcesDialog";
import { DrillDiagramViewerDialog } from "./DrillDiagramViewerDialog";
import { AddManualBlockDialog } from "./AddManualBlockDialog";
import { SaveTemplateDialog } from "./SaveTemplateDialog";
import { InsertTemplateDialog } from "./InsertTemplateDialog";
import { LiveTrainingScreen } from "./LiveTrainingScreen";
import { positionSortOrder } from "../../lib/assignment";
import { AttendanceKind } from "../../types";
import type { AttendanceRecord, Drill, Player, TrainingSession, TrainingTemplate } from "../../types";
import { storedLabel, t, tf } from "../../lib/i18n";
import { drillText } from "../../lib/drillLabels";

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
  readOnly?: boolean;
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
  readOnly = false,
}: Props) {
  const [notes, setNotes] = useState(session.notes);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddDrillDialog, setShowAddDrillDialog] = useState(false);
  const [showAddManualBlockDialog, setShowAddManualBlockDialog] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showInsertTemplateDialog, setShowInsertTemplateDialog] = useState(false);
  const [showLiveMode, setShowLiveMode] = useState(false);
  const [showAiDrillDialog, setShowAiDrillDialog] = useState(false);
  const [showDrillSourcesDialog, setShowDrillSourcesDialog] = useState(false);
  const [enlargedDrill, setEnlargedDrill] = useState<Drill | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  function toggleCategory(category: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

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
          {t("detail.back")}
        </button>
        {!readOnly && (
          <button className="btn-text danger" onClick={() => setShowDeleteConfirm(true)}>
            {t("common.delete")}
          </button>
        )}
      </div>

      <p className="text-bold" style={{ fontSize: "1.1rem" }}>
        {session.date}
      </p>

      <div className="spacer-8" />
      <button className="btn" disabled={session.blocks.length === 0} onClick={() => setShowLiveMode(true)}>
        {t("tr.start")}
      </button>

      <div className="spacer-12" />
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {t("nav.attendance")}
      </p>
      <div className="spacer-8" />
      <AttendanceInlineSection
        record={attendanceRecord}
        players={players}
        readOnly={readOnly}
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
        {session.blocks.length === 0
          ? t("tr.blocksTitle")
          : tf("tr.blocksTitleWithMinutes", { min: String(totalMinutes) })}
      </p>
      <div className="spacer-8" />
      {session.blocks.length === 0 ? (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          {t("tr.noBlocks")}
        </p>
      ) : (
        session.blocks.map((block) => (
          <TrainingBlockRow
            key={block.id}
            block={block}
            readOnly={readOnly}
            onMinutesChange={(minutes) =>
              onUpdateSession({ ...session, blocks: session.blocks.map((b) => (b.id === block.id ? { ...b, minutes } : b)) })
            }
            onRemove={() => onUpdateSession({ ...session, blocks: session.blocks.filter((b) => b.id !== block.id) })}
          />
        ))
      )}

      {!readOnly && (
        <>
          <div className="spacer-8" />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-outline" style={{ flex: 1 }} onClick={() => setShowAddManualBlockDialog(true)}>
              {t("tr.customBlock")}
            </button>
            <button
              className="btn-outline"
              style={{ flex: 1 }}
              disabled={templates.length === 0}
              onClick={() => setShowInsertTemplateDialog(true)}
            >
              {t("tr.insertTemplate")}
            </button>
          </div>

          <div className="spacer-8" />
          <button className="btn-outline" disabled={session.blocks.length === 0} onClick={() => setShowSaveTemplateDialog(true)}>
            {t("tr.saveAsTemplate")}
          </button>
        </>
      )}

      <div className="spacer-16" />
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {t("detail.notes")}
      </p>
      <div className="spacer-8" />
      <textarea
        className="input"
        style={{ height: 100, resize: "vertical" }}
        placeholder={t("tr.notesPlaceholder")}
        value={notes}
        readOnly={readOnly}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="spacer-16" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="text-bold" style={{ fontSize: "0.9rem" }}>
          {t("tr.library")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button className="btn-text" onClick={() => setShowDrillSourcesDialog(true)}>
            {t("tr.sourcesOnline")}
          </button>
          {!readOnly && (
            <>
              <button className="btn-text" onClick={() => setShowAiDrillDialog(true)}>
                {t("tr.aiAssistant")}
              </button>
              <button className="btn-text" onClick={() => setShowAddDrillDialog(true)}>
                {t("tr.customDrill")}
              </button>
            </>
          )}
        </div>
      </div>
      {!readOnly && (
        <p className="text-gray" style={{ fontSize: "0.75rem" }}>
          {t("tr.tapToAdd")}
        </p>
      )}
      <div className="spacer-8" />

      {Array.from(drillsByCategory.entries()).map(([category, drills]) => {
        const isExpanded = expandedCategories.has(category);
        return (
        <div key={category}>
          <div
            className="list-row"
            style={{ cursor: "pointer", padding: "10px 0" }}
            onClick={() => toggleCategory(category)}
          >
            <p className="text-bold" style={{ fontSize: "0.9rem", color: "var(--pitch-green)" }}>
              {storedLabel(category)}
            </p>
            <span className="text-gray" style={{ fontSize: "0.75rem" }}>
              {drills.length} {isExpanded ? "▾" : "▸"}
            </span>
          </div>
          {isExpanded && (
            <>
          <div className="spacer-8" />
          {drills.map((drill) => (
            <div key={drill.id}>
              <div
                className="list-row"
                style={{ cursor: readOnly ? "default" : "pointer" }}
                onClick={
                  readOnly
                    ? undefined
                    : () =>
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
                  <p style={{ fontSize: "0.9rem" }}>{drillText(drill.name)}</p>
                  <p className="text-gray" style={{ fontSize: "0.8rem" }}>
                    {drillText(drill.description)}
                  </p>
                </div>
                {!readOnly && drill.isCustom && (
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
                {!readOnly && (
                  <span className="text-bold" style={{ color: "var(--primary)", fontSize: "1.2rem" }}>
                    +
                  </span>
                )}
              </div>
            </div>
          ))}
          <div className="spacer-8" />
            </>
          )}
        </div>
        );
      })}

      {showDeleteConfirm && (
        <Dialog
          title={t("tr.deleteTitle")}
          onDismiss={() => setShowDeleteConfirm(false)}
          actions={
            <>
              <button className="btn-text" onClick={() => setShowDeleteConfirm(false)}>
                {t("common.cancel")}
              </button>
              <button className="btn" style={{ width: "auto", padding: "10px 20px", background: "var(--error)" }} onClick={onDeleteSession}>
                {t("common.delete")}
              </button>
            </>
          }
        >
          <p>{tf("tr.deleteBody", { date: session.date })}</p>
        </Dialog>
      )}

      {enlargedDrill && <DrillDiagramViewerDialog drill={enlargedDrill} onDismiss={() => setEnlargedDrill(null)} />}

      {showDrillSourcesDialog && <DrillSourcesDialog onDismiss={() => setShowDrillSourcesDialog(false)} />}

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
