import { useState } from "react";
import { AttendanceStatsSection } from "./AttendanceStatsSection";
import { AttendanceDetailScreen } from "./AttendanceDetailScreen";
import type { AttendanceRecord, Player } from "../../types";

interface Props {
  players: Player[];
  attendance: AttendanceRecord[];
  onUpdateRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (record: AttendanceRecord) => void;
  readOnly?: boolean;
}

export function AttendanceTab({ players, attendance, onUpdateRecord, onDeleteRecord, readOnly = false }: Props) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

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
        readOnly={readOnly}
      />
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "60dvh" }}>
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
    </div>
  );
}
