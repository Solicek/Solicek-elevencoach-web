import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { DiagramPreview } from "./DiagramPreview";
import { DrawDiagramDialog } from "./DrawDiagramDialog";
import type { Drill, DiagramPoint } from "../../types";
import { t } from "../../lib/i18n";

interface Props {
  onDismiss: () => void;
  onConfirm: (drill: Drill) => void;
}

export function AddCustomDrillDialog({ onDismiss, onConfirm }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [diagram, setDiagram] = useState<DiagramPoint[][]>([]);
  const [showDrawDialog, setShowDrawDialog] = useState(false);

  return (
    <>
      <Dialog
        title={t("tr.addCustomDrillTitle")}
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
              onClick={() =>
                onConfirm({
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  category: category.trim() || "Vlastní",
                  description: description.trim(),
                  isCustom: true,
                  diagram,
                })
              }
            >
              {t("common.add")}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input className="input" placeholder={t("tr.drillName")} value={name} onChange={(e) => setName(e.target.value)} />
          <input
            className="input"
            placeholder={t("tr.drillCategory")}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <textarea
            className="input"
            style={{ minHeight: 80, resize: "vertical" }}
            placeholder={t("tr.description")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {diagram.length > 0 && <DiagramPreview diagram={diagram} style={{ width: "100%", aspectRatio: "0.62" }} />}
          <button className="btn-outline" onClick={() => setShowDrawDialog(true)}>
            {diagram.length === 0 ? t("tr.drawDiagram") : t("tr.editDiagram")}
          </button>
        </div>
      </Dialog>

      {showDrawDialog && (
        <DrawDiagramDialog
          initialDiagram={diagram}
          onDismiss={() => setShowDrawDialog(false)}
          onSave={(newDiagram) => {
            setDiagram(newDiagram);
            setShowDrawDialog(false);
          }}
        />
      )}
    </>
  );
}
