import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import type { Player } from "../../types";
import { t, tf } from "../../lib/i18n";
import { todayDateString } from "../../lib/dateUtils";

interface Props {
  /** Soupiska – u jedné položky se z ní vybírá hráč, u hromadného předpisu se použije celá. */
  players: Player[];
  /** true = předepsat všem na soupisce (měsíční příspěvky), false = jedna položka jednomu hráči. */
  wholeTeam: boolean;
  onDismiss: () => void;
  onConfirm: (values: { playerNames: string[]; label: string; amount: number; date: string }) => void;
}

/**
 * Zadání ruční položky do pokut – příspěvek, pozdní příchod, cokoliv, co nevzniklo z karty.
 *
 * Stejný dialog slouží i pro hromadné předepsání celé soupisce; liší se jen tím, že se
 * nevybírá hráč. Díky tomu je zadávání měsíčních příspěvků jedno klepnutí místo patnácti.
 */
export function FineItemDialog({ players, wholeTeam, onDismiss, onConfirm }: Props) {
  const roster = [...players].map((p) => p.name).filter((name) => name.trim() !== "");
  const [playerName, setPlayerName] = useState(roster[0] ?? "");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayDateString());

  const amountValue = Math.round(Number(amount.replace(",", ".")));
  const canConfirm =
    label.trim() !== "" &&
    Number.isFinite(amountValue) &&
    amountValue > 0 &&
    (wholeTeam ? roster.length > 0 : playerName.trim() !== "");

  return (
    <Dialog
      title={wholeTeam ? t("fines.chargeDialogTitle") : t("fines.itemDialogTitle")}
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss}>
            {t("common.cancel")}
          </button>
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 20px" }}
            disabled={!canConfirm}
            onClick={() =>
              onConfirm({
                playerNames: wholeTeam ? roster : [playerName],
                label: label.trim(),
                amount: amountValue,
                date: date.trim(),
              })
            }
          >
            {wholeTeam ? t("fines.chargeConfirm") : t("common.add")}
          </button>
        </>
      }
    >
      {wholeTeam ? (
        <p className="text-gray" style={{ fontSize: "0.85rem" }}>
          {roster.length === 0 ? t("fines.noPlayers") : tf("fines.chargeHint", { count: String(roster.length) })}
        </p>
      ) : (
        <>
          <label className="field-label" htmlFor="fine-item-player">
            {t("fines.itemPlayer")}
          </label>
          {roster.length === 0 ? (
            <p className="text-gray" style={{ fontSize: "0.85rem" }}>
              {t("fines.noPlayers")}
            </p>
          ) : (
            <select
              id="fine-item-player"
              className="input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            >
              {roster.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </>
      )}

      <div className="spacer-8" />
      <label className="field-label" htmlFor="fine-item-label">
        {t("fines.itemLabel")}
      </label>
      <input
        id="fine-item-label"
        className="input"
        placeholder={t("fines.itemLabelHint")}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />

      <div className="spacer-8" />
      <label className="field-label" htmlFor="fine-item-amount">
        {t("fines.itemAmount")}
      </label>
      <input
        id="fine-item-amount"
        className="input"
        type="number"
        inputMode="numeric"
        min={1}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <div className="spacer-8" />
      <label className="field-label" htmlFor="fine-item-date">
        {t("fines.itemDate")}
      </label>
      <input id="fine-item-date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
    </Dialog>
  );
}
