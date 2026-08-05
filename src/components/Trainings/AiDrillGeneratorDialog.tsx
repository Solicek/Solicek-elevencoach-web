import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { generateDrillFromPrompt } from "../../lib/aiTrainingAssistant";
import type { Drill } from "../../types";

interface Props {
  onDismiss: () => void;
  onConfirm: (drill: Drill) => void;
}

/**
 * Dialog "AI asistenta" – trenér napíše volný popis požadovaného cvičení, Gemini (přes bezpečný
 * Cloud Function proxy) navrhne rozestavení hráčů a pořadí přihrávek, appka to vykreslí do
 * náčrtku a uloží jako vlastní cvičení (stejnou cestou jako ruční "+ Vlastní cvičení").
 */
export function AiDrillGeneratorDialog({ onDismiss, onConfirm }: Props) {
  const [promptText, setPromptText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handleGenerate() {
    setErrorText(null);
    setIsLoading(true);
    try {
      const drill = await generateDrillFromPrompt(promptText.trim());
      setIsLoading(false);
      onConfirm(drill);
    } catch (e) {
      setIsLoading(false);
      setErrorText(e instanceof Error ? e.message : "Nepodařilo se vygenerovat cvičení, zkus to prosím znovu.");
    }
  }

  return (
    <Dialog
      title="✨ AI asistent cvičení"
      onDismiss={() => {
        if (!isLoading) onDismiss();
      }}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss} disabled={isLoading}>
            Zrušit
          </button>
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 20px" }}
            disabled={!promptText.trim() || isLoading}
            onClick={handleGenerate}
          >
            Vygenerovat
          </button>
        </>
      }
    >
      <p className="text-gray" style={{ fontSize: "0.85rem" }}>
        Popiš, jaké cvičení chceš vygenerovat – Gemini navrhne rozestavení hráčů a pořadí přihrávek.
      </p>
      <div className="spacer-8" />
      <input
        className="input"
        placeholder="např. nácvik přihrávek pro 4 hráče"
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        disabled={isLoading}
      />
      {isLoading && (
        <>
          <div className="spacer-8" />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            <span className="text-gray" style={{ fontSize: "0.85rem" }}>
              Generuji…
            </span>
          </div>
        </>
      )}
      {errorText && (
        <>
          <div className="spacer-8" />
          <p className="text-error" style={{ fontSize: "0.85rem" }}>
            {errorText}
          </p>
        </>
      )}
    </Dialog>
  );
}
