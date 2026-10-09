import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import type { FineRates } from "../../types";

interface RateRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function RateRow({ label, value, onChange }: RateRowProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <span>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          className="input"
          type="number"
          min={0}
          style={{ width: 80, textAlign: "right" }}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        />
        <span className="text-gray">Kč</span>
      </div>
    </div>
  );
}

interface Props {
  rates: FineRates;
  onDismiss: () => void;
  onConfirm: (rates: FineRates) => void;
}

export function FineRatesDialog({ rates, onDismiss, onConfirm }: Props) {
  const [yellowFoul, setYellowFoul] = useState(rates.yellowFoul);
  const [yellowDissent, setYellowDissent] = useState(rates.yellowDissent);
  const [secondYellowRed, setSecondYellowRed] = useState(rates.secondYellowRed);
  const [straightRed, setStraightRed] = useState(rates.straightRed);

  return (
    <Dialog
      title="Sazby pokut"
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss}>
            Zrušit
          </button>
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 20px" }}
            onClick={() => onConfirm({ yellowFoul, yellowDissent, secondYellowRed, straightRed })}
          >
            Uložit
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <RateRow label="Žlutá – faul" value={yellowFoul} onChange={setYellowFoul} />
        <RateRow label="Žlutá – řeči" value={yellowDissent} onChange={setYellowDissent} />
        <RateRow label="2. žlutá → červená" value={secondYellowRed} onChange={setSecondYellowRed} />
        <RateRow label="Červená – přímá" value={straightRed} onChange={setStraightRed} />
      </div>
    </Dialog>
  );
}
