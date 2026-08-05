import { Dialog } from "../Shell/Dialog";
import { DiagramPreview } from "./DiagramPreview";
import type { Drill } from "../../types";

interface Props {
  drill: Drill;
  onDismiss: () => void;
}

/**
 * Zvětšený, jen ke čtení náhled cvičení po klepnutí na malou miniaturu v knihovně – u malé
 * 48px miniatury nejde poznat směr šipek ani přesné pozice, na velkém plátně už ano.
 */
export function DrillDiagramViewerDialog({ drill, onDismiss }: Props) {
  return (
    <Dialog
      title={drill.name}
      onDismiss={onDismiss}
      actions={
        <button className="btn-text" onClick={onDismiss}>
          Zavřít
        </button>
      }
    >
      <DiagramPreview diagram={drill.diagram} style={{ width: "100%", aspectRatio: "0.62" }} />
      <div className="spacer-12" />
      <p className="text-gray" style={{ fontSize: "0.85rem" }}>
        {drill.description}
      </p>
    </Dialog>
  );
}
