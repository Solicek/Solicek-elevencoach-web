import { useState } from "react";
import { Dialog } from "../Shell/Dialog";

interface Props {
  onDismiss: () => void;
  onConfirm: (name: string) => void;
}

export function SaveTemplateDialog({ onDismiss, onConfirm }: Props) {
  const [name, setName] = useState("");

  return (
    <Dialog
      title="Uložit jako šablonu"
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
            onClick={() => onConfirm(name.trim())}
          >
            Uložit
          </button>
        </>
      }
    >
      <input className="input" placeholder="Název šablony" value={name} onChange={(e) => setName(e.target.value)} />
    </Dialog>
  );
}
