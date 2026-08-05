import { positionNames } from "../../lib/assignment";

interface Props {
  selected: string[];
  onToggle: (code: string) => void;
}

export function PositionCheckboxList({ selected, onToggle }: Props) {
  return (
    <div>
      {Object.entries(positionNames).map(([code, label]) => (
        <label className="checkbox-row" key={code}>
          <input type="checkbox" checked={selected.includes(code)} onChange={() => onToggle(code)} />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}
