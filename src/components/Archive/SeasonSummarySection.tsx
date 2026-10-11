import type { ArchivedLineup } from "../../types";
import { competitiveOnly, computePlayerSeasonStats, computeSeasonRecord, rankColor } from "../../lib/seasonStats";
import { matchCountWord, t, tf } from "../../lib/i18n";

export function SeasonSummarySection({ archive, seasonName }: { archive: ArchivedLineup[]; seasonName?: string | null }) {
  const record = computeSeasonRecord(competitiveOnly(archive));
  if (record.played === 0) return null;

  return (
    <div style={{ padding: 16 }}>
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {seasonName ? tf("season.titleNamed", { season: seasonName }) : t("season.title")} ·{" "}
        {record.played} {matchCountWord(record.played)}
      </p>
      <div className="spacer-8" />
      <div style={{ display: "flex", gap: 28 }}>
        <StatChip label={t("season.win")} value={record.wins} color="#2E7D32" />
        <StatChip label={t("season.draw")} value={record.draws} color="gray" />
        <StatChip label={t("season.loss")} value={record.losses} color="var(--error)" />
      </div>
      <div className="spacer-8" />
      <p className="text-gray" style={{ fontSize: "0.85rem" }}>
        {t("season.score")} {record.goalsFor}:{record.goalsAgainst}
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
      <p style={{ fontWeight: 700, fontSize: "1.4rem", color }}>{value}</p>
      <p className="text-gray" style={{ fontSize: "0.75rem" }}>
        {label}
      </p>
    </div>
  );
}

export function PlayerStatsSummarySection({ archive, seasonName }: { archive: ArchivedLineup[]; seasonName?: string | null }) {
  const stats = computePlayerSeasonStats(competitiveOnly(archive));
  if (stats.length === 0) return null;

  return (
    <div style={{ padding: 16 }}>
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {seasonName ? tf("season.rankTitleNamed", { season: seasonName }) : t("season.rankTitle")}
      </p>
      <div className="spacer-8" />
      {stats.map((s, index) => {
        const position = index + 1;
        const parts = [`${s.goals}${t("stats.abbrGoals")} ${s.assists}${t("stats.abbrAssists")}`];
        if (s.yellowCards > 0) parts.push(`${s.yellowCards}${t("stats.abbrYellow")}`);
        if (s.redCards > 0) parts.push(`${s.redCards}${t("stats.abbrRed")}`);
        const line = parts.join(" ") + (s.ratedMatches > 0 ? ` · ★${s.avgRating.toFixed(1)}` : "");
        return (
          <div key={s.name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: rankColor(position), width: 28 }}>
                {position}.
              </span>
              <span style={{ fontSize: "0.9rem" }}>{s.name}</span>
            </div>
            <span className="text-gray" style={{ fontSize: "0.8rem" }}>
              {line}
            </span>
          </div>
        );
      })}
    </div>
  );
}
