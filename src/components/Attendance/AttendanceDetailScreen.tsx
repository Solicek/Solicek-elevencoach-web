import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { AttendanceChecklist } from "./AttendanceChecklist";
import type { AttendanceRecord, Player } from "../../types";
import { t, tf } from "../../lib/i18n";

interface Props {
  record: AttendanceRecord;
  players: Player[];
  onBack: () => void;
  onUpdateRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: () => void;
  readOnly?: boolean;
}

export function AttendanceDetailScreen({ record, players, onBack, onUpdateRecord, onDeleteRecord, readOnly = false }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        {record.date}
      </p>
      <div className="spacer-12" />
      <AttendanceChecklist record={record} players={players} onUpdate={onUpdateRecord} readOnly={readOnly} />

      {showDeleteConfirm && (
        <Dialog
          title={t("att.deleteTitle")}
          onDismiss={() => setShowDeleteConfirm(false)}
          actions={
            <>
              <button className="btn-text" onClick={() => setShowDeleteConfirm(false)}>
                {t("common.cancel")}
              </button>
              <button className="btn" style={{ width: "auto", padding: "10px 20px", background: "var(--error)" }} onClick={onDeleteRecord}>
                {t("common.delete")}
              </button>
            </>
          }
        >
          <p>{tf("att.deleteBody", { date: record.date })}</p>
        </Dialog>
      )}
    </div>
  );
}
