import { storedLabel } from "../../lib/i18n";

interface Props {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
  readOnly?: boolean;
}

/**
 * Chipy dostávají i vracejí hodnotu, jak je uložená v datech (česky) – přeloží se jen to,
 * co se vykreslí. Díky tomu se jedním místem lokalizují všechny přepínače v appce
 * (typ zápasu, doma/venku, druh docházky, prvky diagramu…).
 */
export function ChipSelector({ options, selected, onSelect, readOnly = false }: Props) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
      {options.map((option) => (
        <button
          key={option}
          className={`chip ${option === selected ? "selected" : ""}`}
          disabled={readOnly}
          onClick={readOnly ? undefined : () => onSelect(option)}
        >
          {storedLabel(option)}
        </button>
      ))}
    </div>
  );
}
