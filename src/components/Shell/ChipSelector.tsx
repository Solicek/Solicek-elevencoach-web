interface Props {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
  readOnly?: boolean;
}

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
          {option}
        </button>
      ))}
    </div>
  );
}
