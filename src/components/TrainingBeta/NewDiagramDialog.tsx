import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { ChipSelector } from "../Shell/ChipSelector";
import { allDiagramBackgrounds, DiagramBackground } from "../../types";
import { t } from "../../lib/i18n";

interface Props {
  onDismiss: () => void;
  onConfirm: (name: string, background: string) => void;
}

export function NewDiagramDialog({ onDismiss, onConfirm }: Props) {
  const [name, setName] = useState("");
  const [background, setBackground] = useState<string>(DiagramBackground.FULL);

  return (
    <Dialog
      title={t("beta.newDiagramTitle")}
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
            onClick={() => onConfirm(name.trim(), background)}
          >
            {t("beta.create")}
          </button>
        </>
      }
    >
      <label className="field-label">{t("beta.diagramName")}</label>
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="spacer-12" />
      <label className="field-label">{t("beta.background")}</label>
      <div className="spacer-8" />
      <ChipSelector options={allDiagramBackgrounds} selected={background} onSelect={setBackground} />
    </Dialog>
  );
}
