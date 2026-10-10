import { useState } from "react";
import { formationLabel, t } from "../../lib/i18n";

interface Props {
  selected: string;
  options: string[];
  onSelected: (option: string) => void;
  readOnly?: boolean;
}

export function FormationDropdown({ selected, options, onSelected, readOnly = false }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={readOnly ? undefined : () => setExpanded(true)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          border: "1px solid var(--divider)",
          borderRadius: 8,
          cursor: readOnly ? "default" : "pointer",
          opacity: readOnly ? 0.6 : 1,
        }}
      >
        <div>
          <p className="text-gray" style={{ fontSize: "0.75rem" }}>
            {t("lineup.formation")}
          </p>
          <p>{formationLabel(selected)}</p>
        </div>
        {!readOnly && <span>▾</span>}
      </div>

      {!readOnly && expanded && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setExpanded(false)} />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              maxHeight: 320,
              overflowY: "auto",
              background: "var(--surface-variant)",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              zIndex: 50,
              marginTop: 4,
            }}
          >
            {options.map((option) => (
              <div
                key={option}
                onClick={() => {
                  onSelected(option);
                  setExpanded(false);
                }}
                style={{ padding: "12px 16px", cursor: "pointer" }}
              >
                {formationLabel(option)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
