import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { TrainingDiagramPreview } from "./TrainingDiagramPreview";
import { TrainingDiagramPlayer } from "./TrainingDiagramPlayer";
import { DiagramCategorySelector } from "./DiagramCategorySelector";
import type { TrainingDiagram } from "../../types";
import { storedLabel, t, tf } from "../../lib/i18n";

interface Props {
  diagram: TrainingDiagram;
  readOnly?: boolean;
  onDismiss: () => void;
  /** Mazání a úpravy nabízí jen galerie nákresů – z knihovny v tréninku se nákres jen prohlíží. */
  onEdit?: () => void;
  onDelete?: () => void;
  onChangeCategory?: (category: string | null) => void;
}

export function TrainingDiagramViewerDialog({
  diagram,
  readOnly = false,
  onDismiss,
  onEdit,
  onDelete,
  onChangeCategory,
}: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Statický nákres zůstává výchozí – animace je nabídka navíc, ne náhrada.
  const [showAnimation, setShowAnimation] = useState(false);

  const actionsVisible = !readOnly && (onDelete || onEdit);

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
        <h2 style={{ marginBottom: 8 }}>{diagram.name}</h2>
        {onChangeCategory && !readOnly ? (
          <>
            <label className="field-label">{t("beta.category")}</label>
            <div className="spacer-8" />
            <DiagramCategorySelector value={diagram.category ?? null} onChange={onChangeCategory} />
            <div className="spacer-12" />
          </>
        ) : (
          <p className="text-gray" style={{ fontSize: "0.8rem", marginBottom: 16 }}>
            {diagram.category ? storedLabel(diagram.category) : t("beta.categoryNone")}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            className={`chip ${showAnimation ? "" : "selected"}`}
            onClick={() => setShowAnimation(false)}
          >
            {t("beta.diagramStatic")}
          </button>
          <button
            className={`chip ${showAnimation ? "selected" : ""}`}
            onClick={() => setShowAnimation(true)}
          >
            {t("beta.animation")}
          </button>
        </div>
        {showAnimation ? (
          <TrainingDiagramPlayer diagram={diagram} style={{ width: "100%" }} />
        ) : (
          <>
            <p className="text-gray" style={{ fontSize: "0.75rem", marginBottom: 4 }}>
              {t("beta.pinchHint")}
            </p>
            <TrainingDiagramPreview diagram={diagram} style={{ width: "100%" }} zoomable />
          </>
        )}
        <div className="spacer-16" />
        <div style={{ display: "flex", justifyContent: actionsVisible ? "space-between" : "center", alignItems: "center" }}>
          {!readOnly && onDelete && (
            <button className="btn-text danger" onClick={() => setShowDeleteConfirm(true)}>
              {t("common.delete")}
            </button>
          )}
          {!readOnly && onEdit && (
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
