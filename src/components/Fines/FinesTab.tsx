import { useMemo, useState } from "react";
import { FineRatesDialog } from "./FineRatesDialog";
import { FineItemDialog } from "./FineItemDialog";
import { combinePlayerTotals, computeFineLineItems, finePaymentId, teamFineTotals } from "../../lib/fines";
import type { ArchivedLineup, FineItem, FinePayment, FineRates, Player } from "../../types";
import { amountLabel, t, tf } from "../../lib/i18n";
import { defaultSeasonStartYear, inSeason, listSeasonStartYears } from "../../lib/season";
import { compareDateStrings } from "../../lib/dateUtils";
import { SeasonSelector } from "../Shell/SeasonSelector";

interface Props {
  archive: ArchivedLineup[];
  players: Player[];
  fineRates: FineRates;
  finePayments: FinePayment[];
  /** Ruční položky – příspěvky, pozdní příchody; karty se dopočítávají ze zápasů. */
  fineItems: FineItem[];
  onSaveFineRates: (rates: FineRates) => void;
  onSetPaid: (matchId: string, playerName: string, paid: boolean) => void;
  onSaveFineItems: (items: FineItem[]) => void;
  onDeleteFineItem: (item: FineItem) => void;
  readOnly?: boolean;
}

export function FinesTab({
  archive,
  players,
  fineRates,
  finePayments,
  fineItems,
  onSaveFineRates,
  onSetPaid,
  onSaveFineItems,
  onDeleteFineItem,
  readOnly = false,
}: Props) {
  const [showRatesDialog, setShowRatesDialog] = useState(false);
  // null = zavřeno; jinak jestli se předepisuje celému týmu, nebo jednomu hráči.
  const [itemDialogWholeTeam, setItemDialogWholeTeam] = useState<boolean | null>(null);

  // Pokuty se po sezóně typicky vyrovnávají, takže se počítají jen z vybrané sezóny.
  // Do nabídky sezón patří i ruční položky – tým může vybírat příspěvky dřív, než se odehraje
  // první zápas, a bez toho by taková sezóna v přepínači chyběla.
  const seasons = useMemo(
    () => listSeasonStartYears([...archive.map((e) => e.date), ...fineItems.map((i) => i.date)]),
    [archive, fineItems]
  );
  const [selectedSeason, setSelectedSeason] = useState<number | null | undefined>(undefined);
  const activeSeason = selectedSeason === undefined ? defaultSeasonStartYear(seasons) : selectedSeason;
  const seasonArchive = useMemo(() => inSeason(archive, activeSeason), [archive, activeSeason]);
  const seasonItems = useMemo(
    () => inSeason(fineItems, activeSeason).sort((a, b) => compareDateStrings(b.date, a.date)),
    [fineItems, activeSeason]
  );

  const lineItems = useMemo(() => computeFineLineItems(seasonArchive, fineRates), [seasonArchive, fineRates]);
  const paidLookup = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const p of finePayments) map.set(finePaymentId(p.matchId, p.playerName), p.paid);
    return map;
  }, [finePayments]);
  const isCardPaid = useMemo(
    () => (item: { matchId: string; playerName: string }) =>
      paidLookup.get(finePaymentId(item.matchId, item.playerName)) ?? false,
    [paidLookup]
  );

  // Karty i ruční položky v jednom čísle – trenéra nezajímá, odkud dluh vznikl.
  const perPlayer = useMemo(
    () => combinePlayerTotals(lineItems, seasonItems, isCardPaid),
    [lineItems, seasonItems, isCardPaid]
  );
  const teamTotals = useMemo(() => teamFineTotals(perPlayer), [perPlayer]);

  const isEmpty = lineItems.length === 0 && seasonItems.length === 0;

  function handleConfirmItem(values: { playerNames: string[]; label: string; amount: number; date: string }) {
    onSaveFineItems(
      values.playerNames.map((playerName) => ({
        id: crypto.randomUUID(),
        playerName,
        label: values.label,
        amount: values.amount,
        date: values.date,
        paid: false,
      }))
    );
    setItemDialogWholeTeam(null);
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="text-bold" style={{ fontSize: "1.1rem" }}>
          {t("fines.title")}
        </p>
        {!readOnly && (
          <button className="btn-text" onClick={() => setShowRatesDialog(true)}>
            {t("fines.rates")}
          </button>
        )}
      </div>

      <div className="spacer-8" />
      <SeasonSelector seasons={seasons} selected={activeSeason} onSelect={setSelectedSeason} />

      {isEmpty ? (
        <p className="text-gray" style={{ textAlign: "center", whiteSpace: "pre-line", padding: "32px 0" }}>
          {t("fines.emptyAll")}
        </p>
      ) : (
        <>
          <div className="spacer-16" />
          <div style={{ display: "flex", gap: 32 }}>
            <TotalChip label={t("fines.collectedTotal")} amount={teamTotals.paid} color="#2E7D32" />
            <TotalChip
              label={t("fines.remainingTotal")}
              amount={teamTotals.remaining}
              color={teamTotals.remaining > 0 ? "var(--error)" : "#2E7D32"}
            />
          </div>
          <div className="spacer-8" />
          <p className="text-gray" style={{ fontSize: "0.8rem" }}>
            {tf("fines.chargedTotal", { amount: amountLabel(teamTotals.owed) })}
          </p>

          <div className="spacer-16" />
          <p className="text-bold" style={{ fontSize: "0.9rem" }}>
            {t("fines.summaryTitle")}
          </p>
          <div className="spacer-8" />
          {perPlayer.map(({ name, owed, paid, remaining }) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>{name}</span>
              <span className="text-gray" style={{ fontSize: "0.8rem" }}>
                {remaining > 0 ? tf("fines.remaining", { amount: amountLabel(remaining) }) : t("fines.paid")}{" "}
                <span style={{ opacity: 0.7 }}>
                  ({paid}/{amountLabel(owed)})
                </span>
              </span>
            </div>
          ))}
        </>
      )}

      {/* Příspěvky a ostatní ruční položky. Jsou nad kartami schválně: karty se zadají samy
          ze zápasu, tohle je jediné místo, kde trenér něco opravdu vyplňuje. */}
      <div className="spacer-16" />
      <hr style={{ border: "none", borderTop: "1px solid var(--divider)" }} />
      <div className="spacer-8" />
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {t("fines.manualItems")}
      </p>
      {!readOnly && (
        <>
          <div className="spacer-8" />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="chip" onClick={() => setItemDialogWholeTeam(false)}>
              {t("fines.addItem")}
            </button>
            <button className="chip" onClick={() => setItemDialogWholeTeam(true)}>
              {t("fines.chargeTeam")}
            </button>
          </div>
        </>
      )}
      <div className="spacer-8" />
      {seasonItems.length === 0 ? (
        <p className="text-gray" style={{ fontSize: "0.85rem" }}>
          {t("fines.itemsEmpty")}
        </p>
      ) : (
        seasonItems.map((item) => (
          <div key={item.id} className="list-row">
            <div
              style={{ flex: 1, cursor: readOnly ? "default" : "pointer", minWidth: 0 }}
              onClick={readOnly ? undefined : () => onSaveFineItems([{ ...item, paid: !item.paid }])}
            >
              <p>{item.playerName}</p>
              <p className="text-gray" style={{ fontSize: "0.75rem" }}>
                {item.date}
                {item.label ? ` · ${item.label}` : ""}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="text-gray" style={{ fontSize: "0.85rem" }}>
                {amountLabel(item.amount)}
              </span>
              <input
                type="checkbox"
                checked={item.paid}
                readOnly
                onClick={readOnly ? undefined : () => onSaveFineItems([{ ...item, paid: !item.paid }])}
              />
              {!readOnly && (
                <button
                  className="btn-text"
                  style={{ color: "var(--error)", padding: "0 4px" }}
                  title={t("fines.deleteItem")}
                  onClick={() => onDeleteFineItem(item)}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {lineItems.length > 0 && (
        <>
          <div className="spacer-16" />
          <hr style={{ border: "none", borderTop: "1px solid var(--divider)" }} />
          <div className="spacer-8" />
          <p className="text-bold" style={{ fontSize: "0.9rem" }}>
            {t("fines.individualCards")}
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
                    {amountLabel(item.amount)}
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

      {itemDialogWholeTeam !== null && (
        <FineItemDialog
          players={players}
          wholeTeam={itemDialogWholeTeam}
          onDismiss={() => setItemDialogWholeTeam(null)}
          onConfirm={handleConfirmItem}
        />
      )}
    </div>
  );
}

/** Velké číslo s popiskem pod ním – celková částka za tým (vybráno / zbývá). */
function TotalChip({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div>
      <p style={{ fontWeight: 700, fontSize: "1.4rem", color }}>{amountLabel(amount)}</p>
      <p className="text-gray" style={{ fontSize: "0.75rem" }}>
        {label}
      </p>
    </div>
  );
}
