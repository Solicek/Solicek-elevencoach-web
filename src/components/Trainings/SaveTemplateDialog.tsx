import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { t } from "../../lib/i18n";

interface Props {
  onDismiss: () => void;
  onConfirm: (name: string) => void;
}

export function SaveTemplateDialog({ onDismiss, onConfirm }: Props) {
  const [name, setName] = useState("");

  return (
    <Dialog
      title={t("tr.saveTemplateTitle")}
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss}>
            {t("common.cancel")}
          </button>
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 20px" }}
            disabled={!name.trim()}
            onClick={() => onConfirm(name.trim())}
          >
            {t("common.save")}
          </button>
        </>
      }
    >
      <input className="input" placeholder={t("tr.templateName")} value={name} onChange={(e) => setName(e.target.value)} />
    </Dialog>
  );
}
