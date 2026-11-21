import { useMemo, useState } from "react";
import type { PlayerTableRow, SortKey } from "../../lib/playerSeasonTable";
import { sortPlayerTable } from "../../lib/playerSeasonTable";
import { t } from "../../lib/i18n";

interface Column {
  key: SortKey;
  /** Krátký popisek do hlavičky – na telefonu musí být opravdu krátký. */
  label: string;
  /** Delší název do titulku (tooltip), ať je zkratka dohledatelná. */
  title?: string;
  width: number;
  render: (row: PlayerTableRow) => string;
}

/**
 * Pořadí sloupců je dané tím, co má být vidět na telefonu bez posouvání. Smysl sloučených
 * záložek je vidět zápasy a docházku vedle sebe, takže docházka jde před hodnocení a karty –
 * ty se dohledají posunutím.
 */
function columns(): Column[] {
  return [
    {
      key: "matches",
      label: t("season.colMatches"),
      title: t("season.colMatchesFull"),
      width: 40,
      render: (r) => String(r.matches),
    },
    {
      key: "goals",
      label: t("season.colGoals"),
      title: t("season.colGoalsFull"),
      width: 40,
      render: (r) => String(r.goals),
    },
    {
      key: "assists",
      label: t("season.colAssists"),
      title: t("season.colAssistsFull"),
      width: 40,
      render: (r) => String(r.assists),
    },
    {
      key: "attendance",
      label: t("season.colAttendance"),
      width: 78,
      render: (r) => (r.attendanceRatio === null ? "–" : `${Math.round(r.attendanceRatio * 100)} %`),
    },
    {
      key: "trainings",
      label: t("season.colTrainings"),
      width: 74,
      render: (r) => (r.trainingsTotal > 0 ? `${r.trainingsPresent}/${r.trainingsTotal}` : "–"),
    },
    {
      key: "rating",
      label: t("season.colRating"),
      title: t("season.colRatingFull"),
      width: 48,
      // Nehodnocený hráč má pomlčku, ne 0,0 – nula by vypadala jako nejhorší známka.
      render: (r) => (r.ratedMatches > 0 ? r.avgRating.toFixed(1) : "–"),
    },
    {
      key: "cards",
      label: t("season.colCards"),
      width: 56,
      render: (r) => (r.yellowCards === 0 && r.redCards === 0 ? "–" : `${r.yellowCards} / ${r.redCards}`),
    },
  ];
}

const NAME_WIDTH = 124;

/**
 * Tabulka hráčů za zvolené období – zápasová čísla i docházka v jednom řádku.
 *
 * Na telefonu se osm sloupců nevejde, proto se tabulka posouvá do strany a sloupec se jménem
 * zůstává přilepený vlevo (position: sticky). Na širší obrazovce se vejde celá.
 *
 * Klepnutí na hlavičku mění řazení, druhé klepnutí otočí směr. Čísla se řadí sestupně hned
 * napoprvé (víc gólů = výš), jméno vzestupně.
 */
export function PlayerSeasonTable({ rows }: { rows: PlayerTableRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("goals");
  const [descending, setDescending] = useState(true);

  const cols = useMemo(() => columns(), []);
  const sorted = useMemo(() => sortPlayerTable(rows, sortKey, descending), [rows, sortKey, descending]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setDescending((d) => !d);
    } else {
      setSortKey(key);
      setDescending(key !== "name");
    }
  }

  if (rows.length === 0) {
    return (
      <p className="text-gray" style={{ padding: 16, textAlign: "center" }}>
        {t("season.emptyTable")}
      </p>
    );
  }

  const arrow = (key: SortKey) => (key === sortKey ? (descending ? " ▾" : " ▴") : "");

  const headCell: React.CSSProperties = {
    position: "sticky",
    top: 0,
    background: "var(--surface, #fff)",
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "8px 4px",
    textAlign: "center",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
    borderBottom: "1px solid var(--divider)",
  };

  return (
    <div>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: NAME_WIDTH + 376 }}>
          <thead>
            <tr>
              <th
                onClick={() => toggleSort("name")}
                style={{
                  ...headCell,
                  position: "sticky",
                  left: 0,
                  zIndex: 2,
                  textAlign: "left",
                  padding: "8px 8px 8px 16px",
                  minWidth: NAME_WIDTH,
                }}
              >
                {t("season.colPlayer")}
                {arrow("name")}
              </th>
              {cols.map((c) => (
                <th key={c.key} title={c.title ?? c.label} onClick={() => toggleSort(c.key)} style={{ ...headCell, minWidth: c.width }}>
                  {c.label}
                  {arrow(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.name} style={{ borderBottom: "1px solid var(--divider)" }}>
                <td
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                    background: "var(--surface, #fff)",
                    padding: "10px 8px 10px 16px",
                    fontSize: "0.88rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: NAME_WIDTH,
                  }}
                >
                  {row.name}
                </td>
                {cols.map((c) => (
                  <td key={c.key} style={{ padding: "10px 4px", fontSize: "0.85rem", textAlign: "center", whiteSpace: "nowrap" }}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-gray" style={{ fontSize: "0.72rem", padding: "6px 16px 0" }}>
        {t("season.hintScroll")}
      </p>
    </div>
  );
}
