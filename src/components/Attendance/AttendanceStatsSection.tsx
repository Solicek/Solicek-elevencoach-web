import { positionSortOrder } from "../../lib/assignment";
import { AttendanceKind, MatchType } from "../../types";
import type { AttendanceRecord, Player } from "../../types";
import { sessionCountWord, t, tf } from "../../lib/i18n";

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
        {average === null
          ? "–"
          : `${Math.round(average * 100)} % (${tf("att.sessionsCount", {
              count: String(count),
              word: sessionCountWord(count),
            })})`}
      </span>
    </div>
  );
}

export function AttendanceStatsSection({ players, attendance }: { players: Player[]; attendance: AttendanceRecord[] }) {
  let names = [...players].sort((a, b) => positionSortOrder(a) - positionSortOrder(b)).map((p) => p.name);
  if (names.length === 0) {
    names = Array.from(new Set(attendance.flatMap((a) => a.playerNames)));
  }

  // Druh termínu se bere z AttendanceRecord.kind, kam se při založení zkopíruje typ zápasu
  // ("Soutěžní"/"Přátelské") nebo "Trénink". Starší záznamy bez rozpoznaného druhu spadnou
  // do soutěžních – tak se chovaly i dřív, kdy se zápasy nerozlišovaly.
  const trainingRecords = attendance.filter((a) => a.kind === AttendanceKind.TRAINING);
  const friendlyRecords = attendance.filter((a) => a.kind === MatchType.FRIENDLY);
  const competitiveRecords = attendance.filter(
    (a) => a.kind !== AttendanceKind.TRAINING && a.kind !== MatchType.FRIENDLY
  );

  function presentCount(name: string, records: AttendanceRecord[]): number {
    return records.filter((a) => a.playerNames.includes(name) && !a.absentNames.includes(name)).length;
  }

  // Jmenovatel je pro všechny hráče stejný – celkový počet zapsaných termínů (tréninky
  // i zápasy dohromady), ne jen termíny, kde se hráčovo jméno náhodou objevuje
  // v playerNames (to by kolísalo podle toho, kdy byl hráč přidán do soupisky).
  const stats = names
    .map((name) => ({
      name,
      present: presentCount(name, attendance),
      total: attendance.length,
      training: { present: presentCount(name, trainingRecords), total: trainingRecords.length },
      competitive: { present: presentCount(name, competitiveRecords), total: competitiveRecords.length },
      friendly: { present: presentCount(name, friendlyRecords), total: friendlyRecords.length },
    }))
    .sort((a, b) => {
      const ratioA = a.total === 0 ? -1 : a.present / a.total;
      const ratioB = b.total === 0 ? -1 : b.present / b.total;
      return ratioB - ratioA || a.name.localeCompare(b.name);
    });

  const overall = averageAttendance(attendance);
  const trainingStats = averageAttendance(trainingRecords);
  const competitiveStats = averageAttendance(competitiveRecords);
  const friendlyStats = averageAttendance(friendlyRecords);

  return (
    <div style={{ padding: 16 }}>
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {t("att.avgTitle")}
      </p>
      <div className="spacer-8" />
      <OverallStatRow label={t("att.total")} average={overall.average} count={overall.count} />
      <OverallStatRow label={t("nav.trainings")} average={trainingStats.average} count={trainingStats.count} />
      <OverallStatRow label={t("att.competitiveMatches")} average={competitiveStats.average} count={competitiveStats.count} />
      <OverallStatRow label={t("att.friendlyMatches")} average={friendlyStats.average} count={friendlyStats.count} />

      <div className="spacer-16" />
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {t("att.perPlayerTitle")}
      </p>
      <div className="spacer-8" />
      {stats.length === 0 ? (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          {t("att.noPlayersInRoster")}
        </p>
      ) : (
        stats.map(({ name, present, total, training, competitive, friendly }) => {
          // Rozpad se ukazuje jen pro druhy, které vůbec nějaký termín mají – jinak by
          // u týmu bez přátelských zápasů svítilo zbytečné "P 0/0".
          const breakdown = [
            { label: t("att.abbrTraining"), ...training },
            { label: t("att.abbrCompetitive"), ...competitive },
            { label: t("att.abbrFriendly"), ...friendly },
          ]
            .filter((part) => part.total > 0)
            .map((part) => `${part.label} ${part.present}/${part.total}`)
            .join(" · ");
          return (
            <div key={name} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{name}</span>
                <span className="text-gray" style={{ fontSize: "0.8rem" }}>
                  {total === 0 ? "–" : `${present}/${total} (${Math.round((present * 100) / total)} %)`}
                </span>
              </div>
              {breakdown && (
                <p className="text-gray" style={{ fontSize: "0.7rem", textAlign: "right" }}>
                  {breakdown}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
