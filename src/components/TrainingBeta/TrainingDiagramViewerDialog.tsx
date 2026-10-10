import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { TrainingDiagramPreview } from "./TrainingDiagramPreview";
import type { TrainingDiagram } from "../../types";
import { t, tf } from "../../lib/i18n";

interface Props {
  diagram: TrainingDiagram;
  readOnly?: boolean;
  onDismiss: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TrainingDiagramViewerDialog({ diagram, readOnly = false, onDismiss, onEdit, onDelete }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          // Šířka/výška raději přes dvw/dvh než přes inset:0 – v mobilním Safari (iPhone)
          // "fixed" element s inset:0 nesleduje spolehlivě skutečnou viditelnou výšku
          // obrazovky při schovávání/zobrazování adresního řádku, takže zůstává mezera
          // dole; dvh/dvw jsou přesně pro tohle (dynamický viewport).
          width: "100dvw",
          height: "100dvh",
          zIndex: 100,
          background: "var(--surface)",
          overflowY: "auto",
          padding: 16,
          paddingTop: "max(16px, env(safe-area-inset-top))",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}
      >
        <h2 style={{ marginBottom: 16 }}>{diagram.name}</h2>
        <p className="text-gray" style={{ fontSize: "0.75rem", marginBottom: 4 }}>
          {t("beta.pinchHint")}
        </p>
        <TrainingDiagramPreview diagram={diagram} style={{ width: "100%" }} zoomable />
        <div className="spacer-16" />
        <div style={{ display: "flex", justifyContent: readOnly ? "center" : "space-between", alignItems: "center" }}>
          {!readOnly && (
            <button className="btn-text danger" onClick={() => setShowDeleteConfirm(true)}>
              {t("common.delete")}
            </button>
          )}
          {!readOnly && (
            <button className="btn-text" onClick={onEdit}>
              {t("common.edit")}
            </button>
          )}
          <button className="btn-text" onClick={onDismiss}>
            {t("beta.back")}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <Dialog
          title={t("beta.deleteTitle")}
          onDismiss={() => setShowDeleteConfirm(false)}
          actions={
            <>
              <button className="btn-text" onClick={() => setShowDeleteConfirm(false)}>
                {t("common.cancel")}
              </button>
              <button
                className="btn"
                style={{ width: "auto", padding: "10px 20px", background: "var(--error)" }}
                onClick={onDelete}
              >
                {t("common.delete")}
              </button>
            </>
          }
        >
          <p>{tf("beta.deleteBody", { name: diagram.name })}</p>
        </Dialog>
      )}
    </>
  );
}
