import { useState } from "react";
import { drillCategories } from "../../drills";
import { storedLabel, t } from "../../lib/i18n";

interface Props {
  /** Vybraná kategorie, nebo null když nákres zatím nikam nepatří. */
  value: string | null;
  onChange: (category: string | null) => void;
}

/**
 * Výběr kategorie nákresu: pětice ze cvičení (Rozcvička, Technika, Kondice, Herní situace,
 * Zakončení) plus vlastní název. Hodnota se ukládá česky stejně jako u cvičení, překládá se
 * až při vykreslení – vlastní názvy trenéra se nepřekládají, zobrazí se tak, jak je napsal.
 */
export function DiagramCategorySelector({ value, onChange }: Props) {
  const isCustom = value !== null && !drillCategories.includes(value);
  const [customOpen, setCustomOpen] = useState(isCustom);
  // Vlastní název si držíme zvlášť, ať nezmizí z políčka ve chvíli, kdy se trefí do názvu
  // některé z připravených kategorií.
  const [customText, setCustomText] = useState(isCustom ? (value as string) : "");

  return (
    <>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        <button
          className={`chip ${value === null ? "selected" : ""}`}
          onClick={() => {
            setCustomOpen(false);
            onChange(null);
          }}
        >
          {t("beta.categoryNone")}
        </button>
        {drillCategories.map((category) => (
          <button
            key={category}
            className={`chip ${value === category ? "selected" : ""}`}
            onClick={() => {
              setCustomOpen(false);
              onChange(category);
            }}
          >
            {storedLabel(category)}
          </button>
        ))}
        <button className={`chip ${isCustom ? "selected" : ""}`} onClick={() => setCustomOpen(true)}>
          {t("beta.categoryCustom")}
        </button>
      </div>
      {customOpen && (
        <>
          <div className="spacer-8" />
          <input
            className="input"
            placeholder={t("beta.categoryCustomPlaceholder")}
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              const text = e.target.value.trim();
              onChange(text === "" ? null : text);
            }}
          />
        </>
      )}
    </>
  );
}
