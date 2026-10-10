import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import type { TrainingBlock } from "../../types";
import { t } from "../../lib/i18n";

interface Props {
  onDismiss: () => void;
  onConfirm: (block: TrainingBlock) => void;
}

export function AddManualBlockDialog({ onDismiss, onConfirm }: Props) {
  const [title, setTitle] = useState("");
  const [minutesText, setMinutesText] = useState("10");

  return (
    <Dialog
      title={t("tr.customBlockTitle")}
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss}>
            {t("common.cancel")}
          </button>
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 20px" }}
            disabled={!title.trim()}
            onClick={() =>
              onConfirm({ id: crypto.randomUUID(), title: title.trim(), description: "", minutes: Number(minutesText) || 0 })
            }
          >
            {t("common.add")}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input className="input" placeholder={t("tr.blockName")} value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          className="input"
          placeholder={t("tr.minutes")}
          value={minutesText}
          onChange={(e) => {
            if (/^\d*$/.test(e.target.value)) setMinutesText(e.target.value);
          }}
        />
      </div>
    </Dialog>
  );
}
