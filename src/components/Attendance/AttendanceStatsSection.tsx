import { positionSortOrder } from "../../lib/assignment";
import { AttendanceKind } from "../../types";
import type { AttendanceRecord, Player } from "../../types";

/** Průměr z poměrů přítomnosti jednotlivých termínů (každý termín se počítá stejnou vahou). */
function averageAttendance(records: AttendanceRecord[]): { average: number | null; count: number } {
  const ratios = records
    .filter((r) => r.playerNames.length > 0)
    .map((r) => (r.playerNames.length - r.absentNames.length) / r.playerNames.length);
  if (ratios.length === 0) return { average: null, count: 0 };
  return { average: ratios.reduce((sum, r) => sum + r, 0) / ratios.length, count: ratios.length };
}

function OverallStatRow({ label, average, count }: { label: string; average: number | null; count: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <span>{label}</span>
      <span className="text-gray" style={{ fontSize: "0.8rem" }}>
        {average === null ? "–" : `${Math.round(average * 100)} % (${count} termínů)`}
      </span>
    </div>
  );
}

export function AttendanceStatsSection({ players, attendance }: { players: Player[]; attendance: AttendanceRecord[] }) {
  let names = [...players].sort((a, b) => positionSortOrder(a) - positionSortOrder(b)).map((p) => p.name);
  if (names.length === 0) {
    names = Array.from(new Set(attendance.flatMap((a) => a.playerNames)));
  }

  // Jmenovatel je pro všechny hráče stejný – celkový počet zapsaných termínů (tréninky
  // i zápasy dohromady), ne jen termíny, kde se hráčovo jméno náhodou objevuje
  // v playerNames (to by kolísalo podle toho, kdy byl hráč přidán do soupisky).
  const stats = names
    .map((name) => {
      const present = attendance.filter((a) => a.playerNames.includes(name) && !a.absentNames.includes(name)).length;
      return { name, present, total: attendance.length };
    })
    .sort((a, b) => {
      const ratioA = a.total === 0 ? -1 : a.present / a.total;
      const ratioB = b.total === 0 ? -1 : b.present / b.total;
      return ratioB - ratioA || a.name.localeCompare(b.name);
    });

  const trainingRecords = attendance.filter((a) => a.kind === AttendanceKind.TRAINING);
  const matchRecords = attendance.filter((a) => a.kind !== AttendanceKind.TRAINING);
  const overall = averageAttendance(attendance);
  const trainingStats = averageAttendance(trainingRecords);
  const matchStats = averageAttendance(matchRecords);

  return (
    <div style={{ padding: 16 }}>
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        Celková průměrná účast
      </p>
      <div className="spacer-8" />
      <OverallStatRow label="Celkem" average={overall.average} count={overall.count} />
      <OverallStatRow label="Tréninky" average={trainingStats.average} count={trainingStats.count} />
      <OverallStatRow label="Zápasy" average={matchStats.average} count={matchStats.count} />

      <div className="spacer-16" />
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        Statistika docházky podle hráče
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
