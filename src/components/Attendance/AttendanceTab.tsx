import { useState } from "react";
import { AttendanceStatsSection } from "./AttendanceStatsSection";
import { AddAttendanceDialog } from "./AddAttendanceDialog";
import { AttendanceDetailScreen } from "./AttendanceDetailScreen";
import { positionSortOrder } from "../../lib/assignment";
import type { AttendanceRecord, Player } from "../../types";

interface Props {
  players: Player[];
  attendance: AttendanceRecord[];
  onAddRecord: (record: AttendanceRecord) => void;
  onUpdateRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (record: AttendanceRecord) => void;
}

export function AttendanceTab({ players, attendance, onAddRecord, onUpdateRecord, onDeleteRecord }: Props) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const selectedRecord = attendance.find((a) => a.id === selectedRecordId);

  if (selectedRecord) {
    return (
      <AttendanceDetailScreen
        record={selectedRecord}
        players={players}
        onBack={() => setSelectedRecordId(null)}
        onUpdateRecord={onUpdateRecord}
        onDeleteRecord={() => {
          onDeleteRecord(selectedRecord);
          setSelectedRecordId(null);
        }}
      />
    );
  }

  return (
    <div className="content-with-fab" style={{ position: "relative", minHeight: "60dvh" }}>
      {attendance.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50dvh" }}>
          <p className="text-gray" style={{ textAlign: "center", whiteSpace: "pre-line" }}>
            {"Zatím žádné termíny docházky.\nPřidej první trénink nebo zápas."}
          </p>
        </div>
      ) : (
        <>
          <AttendanceStatsSection players={players} attendance={attendance} />
          <hr style={{ border: "none", borderTop: "1px solid var(--divider)" }} />
          {attendance.map((record) => {
            const present = record.playerNames.length - record.absentNames.length;
            return (
              <div key={record.id} className="list-row" style={{ cursor: "pointer" }} onClick={() => setSelectedRecordId(record.id)}>
                <div>
                  <p className="text-bold">{record.date}</p>
                  <p className="text-gray" style={{ fontSize: "0.75rem" }}>
                    {record.kind}
                  </p>
                </div>
                <span className="text-gray" style={{ fontSize: "0.8rem" }}>
                  {present}/{record.playerNames.length} přítomných
                </span>
              </div>
            );
          })}
        </>
      )}

      <button className="btn fab-button" onClick={() => setShowAddDialog(true)}>
        + Přidat docházku
      </button>

      {showAddDialog && (
        <AddAttendanceDialog
          onDismiss={() => setShowAddDialog(false)}
          onConfirm={(date, kind) => {
            const record: AttendanceRecord = {
              id: crypto.randomUUID(),
              date,
              playerNames: [...players].sort((a, b) => positionSortOrder(a) - positionSortOrder(b)).map((p) => p.name),
              absentNames: [],
              trainingId: null,
              matchId: null,
              kind,
            };
            onAddRecord(record);
            setShowAddDialog(false);
            setSelectedRecordId(record.id);
          }}
        />
      )}
    </div>
  );
}
