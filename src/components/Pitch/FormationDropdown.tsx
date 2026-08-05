import { useState } from "react";

interface Props {
  selected: string;
  options: string[];
  onSelected: (option: string) => void;
}

export function FormationDropdown({ selected, options, onSelected }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setExpanded(true)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          border: "1px solid var(--divider)",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        <div>
          <p className="text-gray" style={{ fontSize: "0.75rem" }}>
            Rozestavení
          </p>
          <p>{selected}</p>
        </div>
        <span>▾</span>
      </div>

      {expanded && (
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
                {option}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
