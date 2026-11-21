import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { generateDrillFromPrompt, generateTrainingPlanFromPrompt } from "../../lib/aiTrainingAssistant";
import type { Drill, TrainingBlock } from "../../types";
import { t } from "../../lib/i18n";

interface Props {
  onDismiss: () => void;
  /** Jedno cvičení – uloží se do knihovny jako vlastní cvičení. */
  onConfirm: (drill: Drill) => void;
  /** Celý trénink – bloky se připíšou k otevřenému tréninku. */
  onConfirmPlan: (blocks: TrainingBlock[]) => void;
}

const DEFAULT_MINUTES = 90;

/**
 * Dialog "AI asistenta" – trenér napíše volný popis a Gemini (přes bezpečný Cloud Function
 * proxy) buď navrhne JEDNO cvičení (rozestavení hráčů a pořadí přihrávek, appka to vykreslí
 * do náčrtku a uloží jako vlastní cvičení), nebo poskládá CELÝ TRÉNINK jako bloky s minutami,
 * které se rovnou připíšou k otevřenému tréninku.
 */
export function AiDrillGeneratorDialog({ onDismiss, onConfirm, onConfirmPlan }: Props) {
  const [promptText, setPromptText] = useState("");
  const [wholePlan, setWholePlan] = useState(false);
  const [minutes, setMinutes] = useState(String(DEFAULT_MINUTES));
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handleGenerate() {
    setErrorText(null);
    setIsLoading(true);
    try {
      if (wholePlan) {
        const blocks = await generateTrainingPlanFromPrompt(promptText.trim(), Number(minutes) || DEFAULT_MINUTES);
        setIsLoading(false);
        onConfirmPlan(blocks);
      } else {
        const drill = await generateDrillFromPrompt(promptText.trim());
        setIsLoading(false);
        onConfirm(drill);
      }
    } catch (e) {
      setIsLoading(false);
      setErrorText(e instanceof Error ? e.message : t("tr.aiFailed"));
    }
  }

  return (
    <Dialog
      title={t("tr.aiTitle")}
      onDismiss={() => {
        if (!isLoading) onDismiss();
      }}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss} disabled={isLoading}>
            {t("common.cancel")}
          </button>
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 20px" }}
            disabled={!promptText.trim() || isLoading}
            onClick={handleGenerate}
          >
            {t("tr.aiGenerate")}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className={`chip ${wholePlan ? "" : "selected"}`}
          disabled={isLoading}
          onClick={() => setWholePlan(false)}
        >
          {t("tr.aiModeDrill")}
        </button>
        <button
          className={`chip ${wholePlan ? "selected" : ""}`}
          disabled={isLoading}
          onClick={() => setWholePlan(true)}
        >
          {t("tr.aiModePlan")}
        </button>
      </div>
      <div className="spacer-8" />
      <p className="text-gray" style={{ fontSize: "0.85rem" }}>
        {wholePlan ? t("tr.aiPlanHint") : t("tr.aiHint")}
      </p>
      <div className="spacer-8" />
      <input
        className="input"
        placeholder={wholePlan ? t("tr.aiPlanPlaceholder") : t("tr.aiPlaceholder")}
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        disabled={isLoading}
      />
      {wholePlan && (
        <>
          <div className="spacer-8" />
          <label className="field-label">{t("tr.aiPlanMinutes")}</label>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={30}
            max={180}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            disabled={isLoading}
          />
        </>
      )}
      {isLoading && (
        <>
          <div className="spacer-8" />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            <span className="text-gray" style={{ fontSize: "0.85rem" }}>
              {t("tr.aiGenerating")}
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
