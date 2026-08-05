import type { TrainingBlock } from "../../types";

interface Props {
  block: TrainingBlock;
  onMinutesChange: (minutes: number) => void;
  onRemove: () => void;
}

export function TrainingBlockRow({ block, onMinutesChange, onRemove }: Props) {
  return (
    <div className="list-row">
      <div style={{ flex: 1 }}>
        <p className="text-bold" style={{ fontSize: "0.9rem" }}>
          {block.title}
        </p>
        {block.description && (
          <p className="text-gray" style={{ fontSize: "0.8rem" }}>
            {block.description}
          </p>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button className="btn-text" onClick={() => onMinutesChange(Math.max(0, block.minutes - 5))}>
          −
        </button>
        <span style={{ fontSize: "0.85rem" }}>{block.minutes} min</span>
        <button className="btn-text" onClick={() => onMinutesChange(block.minutes + 5)}>
          +
        </button>
        <span className="text-error text-bold" style={{ cursor: "pointer", padding: "0 4px" }} onClick={onRemove}>
          ×
        </span>
      </div>
    </div>
  );
}
