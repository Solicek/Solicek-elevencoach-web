import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { ChipSelector } from "../Shell/ChipSelector";
import { allDiagramBackgrounds, DiagramBackground } from "../../types";

interface Props {
  onDismiss: () => void;
  onConfirm: (name: string, background: string) => void;
}

export function NewDiagramDialog({ onDismiss, onConfirm }: Props) {
  const [name, setName] = useState("");
  const [background, setBackground] = useState<string>(DiagramBackground.FULL);

  return (
    <Dialog
      title="Nový nákres"
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss}>
            Zrušit
          </button>
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 20px" }}
            disabled={!name.trim()}
            onClick={() => onConfirm(name.trim(), background)}
          >
            Vytvořit
          </button>
        </>
      }
    >
      <label className="field-label">Název nákresu</label>
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="spacer-12" />
      <label className="field-label">Pozadí</label>
      <div className="spacer-8" />
      <ChipSelector options={allDiagramBackgrounds} selected={background} onSelect={setBackground} />
    </Dialog>
  );
}
