import { useMemo, useState } from "react";
import { FineRatesDialog } from "./FineRatesDialog";
import { computeFineLineItems, finePaymentId } from "../../lib/fines";
import type { ArchivedLineup, FinePayment, FineRates } from "../../types";

interface Props {
  archive: ArchivedLineup[];
  fineRates: FineRates;
  finePayments: FinePayment[];
  onSaveFineRates: (rates: FineRates) => void;
  onSetPaid: (matchId: string, playerName: string, paid: boolean) => void;
  readOnly?: boolean;
}

export function FinesTab({ archive, fineRates, finePayments, onSaveFineRates, onSetPaid, readOnly = false }: Props) {
  const [showRatesDialog, setShowRatesDialog] = useState(false);

  const lineItems = useMemo(() => computeFineLineItems(archive, fineRates), [archive, fineRates]);
  const paidLookup = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const p of finePayments) map.set(finePaymentId(p.matchId, p.playerName), p.paid);
    return map;
  }, [finePayments]);

  const perPlayer = useMemo(() => {
    const totals = new Map<string, { owed: number; paid: number }>();
    for (const item of lineItems) {
      const entry = totals.get(item.playerName) ?? { owed: 0, paid: 0 };
      entry.owed += item.amount;
      if (paidLookup.get(finePaymentId(item.matchId, item.playerName))) entry.paid += item.amount;
      totals.set(item.playerName, entry);
    }
    return Array.from(totals.entries())
      .map(([name, { owed, paid }]) => ({ name, owed, paid, remaining: owed - paid }))
      .sort((a, b) => b.remaining - a.remaining || a.name.localeCompare(b.name));
  }, [lineItems, paidLookup]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="text-bold" style={{ fontSize: "1.1rem" }}>
          Pokuty
        </p>
        {!readOnly && (
          <button className="btn-text" onClick={() => setShowRatesDialog(true)}>
            ⚙ Sazby
          </button>
        )}
      </div>

      {lineItems.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40dvh" }}>
          <p className="text-gray" style={{ textAlign: "center", whiteSpace: "pre-line" }}>
            {"Zatím žádné pokutované karty.\nKarty se zadávají u statistik hráčů v detailu zápasu."}
          </p>
        </div>
      ) : (
        <>
          <div className="spacer-16" />
          <p className="text-bold" style={{ fontSize: "0.9rem" }}>
            Souhrn dle hráče
          </p>
          <div className="spacer-8" />
          {perPlayer.map(({ name, owed, paid, remaining }) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>{name}</span>
              <span className="text-gray" style={{ fontSize: "0.8rem" }}>
                {remaining > 0 ? `zbývá ${remaining} Kč` : "zaplaceno"} <span style={{ opacity: 0.7 }}>({paid}/{owed} Kč)</span>
              </span>
            </div>
          ))}

          <div className="spacer-16" />
          <hr style={{ border: "none", borderTop: "1px solid var(--divider)" }} />
          <div className="spacer-8" />
          <p className="text-bold" style={{ fontSize: "0.9rem" }}>
            Jednotlivé karty
          </p>
          <div className="spacer-8" />
          {lineItems.map((item) => {
            const id = finePaymentId(item.matchId, item.playerName);
            const paid = paidLookup.get(id) ?? false;
            return (
              <label
                key={id}
                className="list-row"
                style={{ cursor: readOnly ? "default" : "pointer" }}
                onClick={
                  readOnly
                    ? undefined
                    : (e) => {
                        e.preventDefault();
                        onSetPaid(item.matchId, item.playerName, !paid);
                      }
                }
              >
                <div>
                  <p>{item.playerName}</p>
                  <p className="text-gray" style={{ fontSize: "0.75rem" }}>
                    {item.date}
                    {item.opponent ? ` · ${item.opponent}` : ""}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="text-gray" style={{ fontSize: "0.85rem" }}>
                    {item.amount} Kč
                  </span>
                  <input type="checkbox" checked={paid} readOnly />
                </div>
              </label>
            );
          })}
        </>
      )}

      {showRatesDialog && (
        <FineRatesDialog
          rates={fineRates}
          onDismiss={() => setShowRatesDialog(false)}
          onConfirm={(rates) => {
            onSaveFineRates(rates);
            setShowRatesDialog(false);
          }}
        />
      )}
    </div>
  );
}
