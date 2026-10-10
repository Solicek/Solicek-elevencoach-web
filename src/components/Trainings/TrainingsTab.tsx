import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { TrainingDetailScreen } from "./TrainingDetailScreen";
import { drillLibrary } from "../../drills";
import { todayDateString } from "../../lib/dateUtils";
import type { AttendanceRecord, Drill, Player, TrainingSession, TrainingTemplate } from "../../types";
import { t, tf } from "../../lib/i18n";

interface Props {
  trainings: TrainingSession[];
  players: Player[];
  attendance: AttendanceRecord[];
  customDrills: Drill[];
  templates: TrainingTemplate[];
  onAddSession: (session: TrainingSession) => void;
  onUpdateSession: (session: TrainingSession) => void;
  onDeleteSession: (session: TrainingSession) => void;
  onAddAttendanceRecord: (record: AttendanceRecord) => void;
  onUpdateAttendanceRecord: (record: AttendanceRecord) => void;
  onAddCustomDrill: (drill: Drill) => void;
  onDeleteCustomDrill: (drill: Drill) => void;
  onAddTemplate: (template: TrainingTemplate) => void;
  onDeleteTemplate: (template: TrainingTemplate) => void;
  readOnly?: boolean;
}

export function TrainingsTab({
  trainings,
  players,
  attendance,
  customDrills,
  templates,
  onAddSession,
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
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDate, setNewDate] = useState(todayDateString());

  const selectedSession = trainings.find((s) => s.id === selectedSessionId);

  if (selectedSession) {
    return (
      <TrainingDetailScreen
        session={selectedSession}
        players={players}
        attendanceRecord={attendance.find((a) => a.trainingId === selectedSession.id) ?? null}
        allDrills={[...drillLibrary, ...customDrills]}
        templates={templates}
        onBack={() => setSelectedSessionId(null)}
        onUpdateSession={onUpdateSession}
        onDeleteSession={() => {
          onDeleteSession(selectedSession);
          setSelectedSessionId(null);
        }}
        onAddAttendanceRecord={onAddAttendanceRecord}
        onUpdateAttendanceRecord={onUpdateAttendanceRecord}
        onAddCustomDrill={onAddCustomDrill}
        onDeleteCustomDrill={onDeleteCustomDrill}
        onAddTemplate={onAddTemplate}
        onDeleteTemplate={onDeleteTemplate}
        readOnly={readOnly}
      />
    );
  }

  return (
    <div className="content-with-fab" style={{ position: "relative", minHeight: "60dvh" }}>
      {trainings.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50dvh" }}>
          <p className="text-gray" style={{ textAlign: "center", whiteSpace: "pre-line" }}>
            {t("tr.empty")}
          </p>
        </div>
      ) : (
        trainings.map((session) => {
          const totalMinutes = session.blocks.reduce((sum, b) => sum + b.minutes, 0);
          return (
            <div key={session.id} className="list-row" style={{ cursor: "pointer" }} onClick={() => setSelectedSessionId(session.id)}>
              <p className="text-bold">{session.date}</p>
              <p className="text-gray" style={{ fontSize: "0.8rem" }}>
                {session.blocks.length === 0
                  ? t("tr.noPlan")
                  : tf("tr.blocksSummary", { blocks: String(session.blocks.length), min: String(totalMinutes) })}
              </p>
            </div>
          );
        })
      )}

      {!readOnly && (
        <button
          className="btn fab-button"
          onClick={() => {
            setNewDate(todayDateString());
            setShowAddDialog(true);
          }}
        >
          {t("tr.addTraining")}
        </button>
      )}

      {showAddDialog && (
        <Dialog
          title={t("cal.addTrainingTitle")}
          onDismiss={() => setShowAddDialog(false)}
          actions={
            <>
              <button className="btn-text" onClick={() => setShowAddDialog(false)}>
                {t("common.cancel")}
              </button>
              <button
                className="btn"
                style={{ width: "auto", padding: "10px 20px" }}
                disabled={!newDate.trim()}
                onClick={() => {
                  const session: TrainingSession = { id: crypto.randomUUID(), date: newDate.trim(), blocks: [], notes: "" };
                  onAddSession(session);
                  setShowAddDialog(false);
                  setSelectedSessionId(session.id);
                }}
              >
                {t("common.add")}
              </button>
            </>
          }
        >
          <label className="field-label">{t("saveLineup.date")}</label>
          <input className="input" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
        </Dialog>
      )}
    </div>
  );
}
