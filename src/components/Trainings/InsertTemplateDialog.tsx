import { Dialog } from "../Shell/Dialog";
import type { TrainingTemplate } from "../../types";
import { t, tf } from "../../lib/i18n";

interface Props {
  templates: TrainingTemplate[];
  onDismiss: () => void;
  onSelect: (template: TrainingTemplate) => void;
  onDelete: (template: TrainingTemplate) => void;
}

export function InsertTemplateDialog({ templates, onDismiss, onSelect, onDelete }: Props) {
  return (
    <Dialog
      title={t("tr.insertTemplateTitle")}
      onDismiss={onDismiss}
      actions={
        <button className="btn-text" onClick={onDismiss}>
          {t("common.close")}
        </button>
      }
    >
      {templates.length === 0 ? (
        <p className="text-gray" style={{ fontSize: "0.85rem" }}>
          {t("tr.noTemplates")}
        </p>
      ) : (
        templates.map((template) => (
          <div key={template.id} className="list-row" style={{ cursor: "pointer" }} onClick={() => onSelect(template)}>
            <div>
              <p>{template.name}</p>
              <p className="text-gray" style={{ fontSize: "0.8rem" }}>
                {tf("tr.blocksSummary", {
                  blocks: String(template.blocks.length),
                  min: String(template.blocks.reduce((sum, b) => sum + b.minutes, 0)),
                })}
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
