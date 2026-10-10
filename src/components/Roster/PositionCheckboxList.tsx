import { positionNames } from "../../lib/assignment";
import { positionName } from "../../lib/i18n";

interface Props {
  selected: string[];
  onToggle: (code: string) => void;
}

export function PositionCheckboxList({ selected, onToggle }: Props) {
  return (
    <div>
      {Object.keys(positionNames).map((code) => (
        <label className="checkbox-row" key={code}>
          <input type="checkbox" checked={selected.includes(code)} onChange={() => onToggle(code)} />
          <span>{positionName(code)}</span>
        </label>
      ))}
    </div>
  );
}
