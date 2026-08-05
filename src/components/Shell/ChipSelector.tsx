interface Props {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export function ChipSelector({ options, selected, onSelect }: Props) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
      {options.map((option) => (
        <button
          key={option}
          className={`chip ${option === selected ? "selected" : ""}`}
          onClick={() => onSelect(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
