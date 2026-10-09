import type { ArchivedLineup } from "../../types";
import { competitiveOnly, computePlayerSeasonStats, computeSeasonRecord, rankColor } from "../../lib/seasonStats";

/** Skloňování "zápas" pro dané číslo: 1 zápas, 2-4 zápasy, 5+ zápasů. */
function matchWord(count: number): string {
  if (count === 1) return "zápas";
  if (count >= 2 && count <= 4) return "zápasy";
  return "zápasů";
}

export function SeasonSummarySection({ archive }: { archive: ArchivedLineup[] }) {
  const record = computeSeasonRecord(competitiveOnly(archive));
  if (record.played === 0) return null;

  return (
    <div style={{ padding: 16 }}>
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        Bilance sezóny (bez přátelských) · {record.played} {matchWord(record.played)}
      </p>
      <div className="spacer-8" />
      <div style={{ display: "flex", gap: 28 }}>
        <StatChip label="V" value={record.wins} color="#2E7D32" />
        <StatChip label="R" value={record.draws} color="gray" />
        <StatChip label="P" value={record.losses} color="var(--error)" />
      </div>
      <div className="spacer-8" />
      <p className="text-gray" style={{ fontSize: "0.85rem" }}>
        Skóre {record.goalsFor}:{record.goalsAgainst}
      </p>
      {record.missingResults > 0 && (
        <p className="text-gray" style={{ fontSize: "0.8rem", marginTop: 4 }}>
          {record.missingResults} {matchWord(record.missingResults)} {record.missingResults === 1 ? "nemá" : "nemají"} zadaný výsledek – doplň ho v detailu zápasu, ať se počítá do bilance.
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

export function PlayerStatsSummarySection({ archive }: { archive: ArchivedLineup[] }) {
  const stats = computePlayerSeasonStats(competitiveOnly(archive));
  if (stats.length === 0) return null;

  return (
    <div style={{ padding: 16 }}>
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        Žebříček sezóny (bez přátelských)
      </p>
      <div className="spacer-8" />
      {stats.map((s, index) => {
        const position = index + 1;
        const parts = [`${s.goals}G ${s.assists}A`];
        if (s.yellowCards > 0) parts.push(`${s.yellowCards}Ž`);
        if (s.redCards > 0) parts.push(`${s.redCards}Č`);
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
