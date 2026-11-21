import type { ArchivedLineup } from "../../types";
// Žebříček hráčů (dřív PlayerStatsSummarySection) nahradila řaditelná tabulka v záložce Sezóna.
import { competitiveOnly, computeSeasonRecord } from "../../lib/seasonStats";
import { matchCountWord, t, tf } from "../../lib/i18n";

export function SeasonSummarySection({
  archive,
  seasonName,
  extraLine,
}: {
  archive: ArchivedLineup[];
  seasonName?: string | null;
  /** Doplňující údaj na řádek se skóre – používá se pro průměrnou účast. */
  extraLine?: string | null;
}) {
  const record = computeSeasonRecord(competitiveOnly(archive));
  if (record.played === 0) return null;

  return (
    <div style={{ padding: "8px 16px 12px" }}>
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {seasonName ? tf("season.titleNamed", { season: seasonName }) : t("season.title")} ·{" "}
        {record.played} {matchCountWord(record.played)}
      </p>
      <div className="spacer-8" />
      <div style={{ display: "flex", gap: 24 }}>
        <StatChip label={t("season.win")} value={record.wins} color="#2E7D32" />
        <StatChip label={t("season.draw")} value={record.draws} color="gray" />
        <StatChip label={t("season.loss")} value={record.losses} color="var(--error)" />
      </div>
      <div className="spacer-8" />
      <p className="text-gray" style={{ fontSize: "0.85rem" }}>
        {t("season.score")} {record.goalsFor}:{record.goalsAgainst}
        {extraLine ? ` · ${extraLine}` : ""}
      </p>
      {record.missingResults > 0 && (
        <p className="text-gray" style={{ fontSize: "0.8rem", marginTop: 4 }}>
          {tf("season.missingResults", {
            count: String(record.missingResults),
            word: matchCountWord(record.missingResults),
          })}
        </p>
      )}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontWeight: 700, fontSize: "1.2rem", color }}>{value}</p>
      <p className="text-gray" style={{ fontSize: "0.75rem" }}>
        {label}
      </p>
    </div>
  );
}
