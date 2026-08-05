import { positionSortOrder } from "../../lib/assignment";
import type { AttendanceRecord, Player } from "../../types";

export function AttendanceStatsSection({ players, attendance }: { players: Player[]; attendance: AttendanceRecord[] }) {
  let names = [...players].sort((a, b) => positionSortOrder(a) - positionSortOrder(b)).map((p) => p.name);
  if (names.length === 0) {
    names = Array.from(new Set(attendance.flatMap((a) => a.playerNames)));
  }

  const stats = names
    .map((name) => {
      const relevant = attendance.filter((a) => a.playerNames.includes(name));
      const present = relevant.filter((a) => !a.absentNames.includes(name)).length;
      return { name, present, total: relevant.length };
    })
    .sort((a, b) => {
      const ratioA = a.total === 0 ? -1 : a.present / a.total;
      const ratioB = b.total === 0 ? -1 : b.present / b.total;
      return ratioB - ratioA || a.name.localeCompare(b.name);
    });

  return (
    <div style={{ padding: 16 }}>
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        Statistika docházky
      </p>
      <div className="spacer-8" />
      {stats.length === 0 ? (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          Zatím nejsou žádní hráči v rosteru.
        </p>
      ) : (
        stats.map(({ name, present, total }) => (
          <div key={name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>{name}</span>
            <span className="text-gray" style={{ fontSize: "0.8rem" }}>
              {total === 0 ? "–" : `${present}/${total} (${Math.round((present * 100) / total)} %)`}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
