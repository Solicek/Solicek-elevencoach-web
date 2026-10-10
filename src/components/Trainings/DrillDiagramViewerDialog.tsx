import { Dialog } from "../Shell/Dialog";
import { DiagramPreview } from "./DiagramPreview";
import type { Drill } from "../../types";
import { t } from "../../lib/i18n";
import { drillText } from "../../lib/drillLabels";

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
      title={drillText(drill.name)}
      onDismiss={onDismiss}
      actions={
        <button className="btn-text" onClick={onDismiss}>
          {t("common.close")}
        </button>
      }
    >
      <DiagramPreview diagram={drill.diagram} style={{ width: "100%", aspectRatio: "0.62" }} />
      <div className="spacer-12" />
      <p className="text-gray" style={{ fontSize: "0.85rem" }}>
        {drillText(drill.description)}
      </p>
    </Dialog>
  );
}
