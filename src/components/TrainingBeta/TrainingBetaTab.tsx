import { useState } from "react";
import { NewDiagramDialog } from "./NewDiagramDialog";
import { TrainingDiagramEditor } from "./TrainingDiagramEditor";
import { TrainingDiagramViewerDialog } from "./TrainingDiagramViewerDialog";
import { TrainingDiagramPreview } from "./TrainingDiagramPreview";
import type { TrainingDiagram } from "../../types";

interface Props {
  diagrams: TrainingDiagram[];
  readOnly?: boolean;
  onAdd: (diagram: TrainingDiagram) => void;
  onUpdate: (diagram: TrainingDiagram) => void;
  onDelete: (diagram: TrainingDiagram) => void;
}

export function TrainingBetaTab({ diagrams, readOnly = false, onAdd, onUpdate, onDelete }: Props) {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingDiagram, setEditingDiagram] = useState<TrainingDiagram | null>(null);

  const viewingDiagram = diagrams.find((d) => d.id === viewingId) ?? null;

  if (editingDiagram) {
    return (
      <TrainingDiagramEditor
        initialDiagram={editingDiagram}
        onDismiss={() => setEditingDiagram(null)}
        onSave={(diagram) => {
          const exists = diagrams.some((d) => d.id === diagram.id);
          if (exists) onUpdate(diagram);
          else onAdd(diagram);
          setEditingDiagram(null);
        }}
      />
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "60dvh" }}>
      {diagrams.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50dvh" }}>
          <p className="text-gray" style={{ textAlign: "center", whiteSpace: "pre-line" }}>
            {"Zatím žádné nákresy tréninků.\nVytvoř první tlačítkem dole."}
          </p>
        </div>
      ) : (
        <div className="content-with-fab" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
          {diagrams.map((diagram) => (
            <div key={diagram.id} style={{ cursor: "pointer" }} onClick={() => setViewingId(diagram.id)}>
              {/* V galerii mají všechny dlaždice stejnou velikost bez ohledu na to, jestli je
                  nákres na celé hřiště nebo na půlku – čtvercový poměr stran je neutrální pro
                  oba případy. Po kliknutí se nákres otevře ve `TrainingDiagramViewerDialog`
                  se svým SKUTEČNÝM poměrem stran (viz tam), takže nic nezůstane zdeformované. */}
              <TrainingDiagramPreview diagram={diagram} style={{ width: "100%", aspectRatio: "1" }} />
              <p className="text-bold" style={{ fontSize: "0.85rem", marginTop: 4 }}>
                {diagram.name}
              </p>
              <button
                className="btn-outline"
                style={{ padding: "6px", fontSize: "0.75rem", marginTop: 4 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingId(diagram.id);
                }}
              >
                Zobrazit
              </button>
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <button
          className="btn fab-button"
          style={{ width: "auto", left: "50%", right: "auto", transform: "translateX(-50%)", padding: "12px 24px" }}
          onClick={() => setShowNewDialog(true)}
        >
          + Nový nákres
        </button>
      )}

      {showNewDialog && (
        <NewDiagramDialog
          onDismiss={() => setShowNewDialog(false)}
          onConfirm={(name, background) => {
            setShowNewDialog(false);
            setEditingDiagram({ id: crypto.randomUUID(), name, background, elements: [], arrows: [] });
          }}
        />
      )}

      {viewingDiagram && (
        <TrainingDiagramViewerDialog
          diagram={viewingDiagram}
          readOnly={readOnly}
          onDismiss={() => setViewingId(null)}
          onEdit={() => {
            setEditingDiagram(viewingDiagram);
            setViewingId(null);
          }}
          onDelete={() => {
            onDelete(viewingDiagram);
            setViewingId(null);
          }}
        />
      )}
    </div>
  );
}
