import { useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { ChipSelector } from "../Shell/ChipSelector";
import { todayDateString } from "../../lib/dateUtils";
import { t } from "../../lib/i18n";
import { MatchType, allMatchTypes, HomeAway, allHomeAway } from "../../types";

interface Props {
  onDismiss: () => void;
  onConfirm: (date: string, opponent: string, matchType: string, homeAway: string) => void;
}

export function SaveLineupDialog({ onDismiss, onConfirm }: Props) {
  const [date, setDate] = useState(todayDateString());
  const [opponent, setOpponent] = useState("");
  const [matchType, setMatchType] = useState<string>(MatchType.COMPETITIVE);
  const [homeAway, setHomeAway] = useState<string>(HomeAway.HOME);

  return (
    <Dialog
      title={t("saveLineup.title")}
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text" onClick={onDismiss}>
            {t("common.cancel")}
          </button>
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 20px" }}
            disabled={!date.trim() || !opponent.trim()}
            onClick={() => onConfirm(date.trim(), opponent.trim(), matchType, homeAway)}
          >
            {t("common.save")}
          </button>
        </>
      }
    >
      <label className="field-label">{t("saveLineup.date")}</label>
      <input className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="spacer-12" />
      <label className="field-label">{t("saveLineup.opponent")}</label>
      <input className="input" value={opponent} onChange={(e) => setOpponent(e.target.value)} />
      <div className="spacer-12" />
      <p className="text-bold" style={{ fontSize: "0.85rem", marginBottom: 4 }}>
        {t("saveLineup.matchType")}
      </p>
      <ChipSelector options={allMatchTypes} selected={matchType} onSelect={setMatchType} />
      <div className="spacer-12" />
      <p className="text-bold" style={{ fontSize: "0.85rem", marginBottom: 4 }}>
        {t("saveLineup.homeAway")}
      </p>
      <ChipSelector options={allHomeAway} selected={homeAway} onSelect={setHomeAway} />
    </Dialog>
  );
}
