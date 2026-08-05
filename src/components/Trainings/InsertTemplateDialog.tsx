import { Dialog } from "../Shell/Dialog";
import type { TrainingTemplate } from "../../types";

interface Props {
  templates: TrainingTemplate[];
  onDismiss: () => void;
  onSelect: (template: TrainingTemplate) => void;
  onDelete: (template: TrainingTemplate) => void;
}

export function InsertTemplateDialog({ templates, onDismiss, onSelect, onDelete }: Props) {
  return (
    <Dialog
      title="Vložit šablonu"
      onDismiss={onDismiss}
      actions={
        <button className="btn-text" onClick={onDismiss}>
          Zavřít
        </button>
      }
    >
      {templates.length === 0 ? (
        <p className="text-gray" style={{ fontSize: "0.85rem" }}>
          Zatím nemáš žádné uložené šablony.
        </p>
      ) : (
        templates.map((template) => (
          <div key={template.id} className="list-row" style={{ cursor: "pointer" }} onClick={() => onSelect(template)}>
            <div>
              <p>{template.name}</p>
              <p className="text-gray" style={{ fontSize: "0.8rem" }}>
                {template.blocks.length} bloků · {template.blocks.reduce((sum, b) => sum + b.minutes, 0)} min
              </p>
            </div>
            <span
              className="text-error text-bold"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(template);
              }}
            >
              ×
            </span>
          </div>
        ))
      )}
    </Dialog>
  );
}
