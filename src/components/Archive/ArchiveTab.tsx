import { useMemo, useState } from "react";
import type { ArchivedLineup, AttendanceRecord, Player } from "../../types";
import { SeasonSummarySection, PlayerStatsSummarySection } from "./SeasonSummarySection";
import { ArchiveDetailScreen } from "./ArchiveDetailScreen";
import { MatchType } from "../../types";
import { matchTitle } from "../../lib/matchTitle";
import { compareDateStrings, todayDateString } from "../../lib/dateUtils";
import { defaultSeasonStartYear, inSeason, listSeasonStartYears, seasonLabel } from "../../lib/season";
import { SeasonSelector } from "../Shell/SeasonSelector";
import { formationLabel, storedLabel, t } from "../../lib/i18n";

interface Props {
  teamCode: string;
  teamName: string;
  archive: ArchivedLineup[];
  players: Player[];
  attendance: AttendanceRecord[];
  onUpdateEntry: (entry: ArchivedLineup) => void;
  onDeleteEntry: (entry: ArchivedLineup) => void;
  onAddAttendanceRecord: (record: AttendanceRecord) => void;
  onUpdateAttendanceRecord: (record: AttendanceRecord) => void;
  readOnly?: boolean;
}

export function ArchiveTab({
  teamCode,
  teamName,
  archive,
  players,
  attendance,
  onUpdateEntry,
  onDeleteEntry,
  onAddAttendanceRecord,
  onUpdateAttendanceRecord,
  readOnly = false,
}: Props) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Historie zobrazuje jen už odehrané zápasy (včetně dnešního) – budoucí se plánují a upravují
  // v Kalendáři. Řazeno podle data zápasu (nejnovější nahoře), ne podle pořadí vytvoření záznamu.
  const playedArchive = useMemo(() => {
    const today = todayDateString();
    return archive
      .filter((e) => compareDateStrings(e.date, today) <= 0)
      .sort((a, b) => compareDateStrings(b.date, a.date));
  }, [archive]);

  // Sezóny se odvozují z dat zápasů (lib/season.ts) – archiv se nikam nepřesouvá, jen se
  // filtruje. `null` = "Vše", tedy původní chování napříč sezónami.
  const seasons = useMemo(() => listSeasonStartYears(playedArchive.map((e) => e.date)), [playedArchive]);
  const [selectedSeason, setSelectedSeason] = useState<number | null | undefined>(undefined);
  // `undefined` = trenér zatím nevybíral, bere se výchozí sezóna (dopočítá se, až dorazí data).
  const activeSeason = selectedSeason === undefined ? defaultSeasonStartYear(seasons) : selectedSeason;
  const seasonArchive = useMemo(() => inSeason(playedArchive, activeSeason), [playedArchive, activeSeason]);

  const selectedEntry = playedArchive.find((e) => e.id === selectedEntryId);

  if (selectedEntry) {
    return (
      <ArchiveDetailScreen
        teamCode={teamCode}
        teamName={teamName}
        entry={selectedEntry}
        players={players}
        attendanceRecord={attendance.find((a) => a.matchId === selectedEntry.id) ?? null}
        onBack={() => setSelectedEntryId(null)}
        onUpdateEntry={onUpdateEntry}
        onDeleteEntry={() => {
          onDeleteEntry(selectedEntry);
          setSelectedEntryId(null);
        }}
        onAddAttendanceRecord={onAddAttendanceRecord}
        onUpdateAttendanceRecord={onUpdateAttendanceRecord}
        forceReadOnly={readOnly}
      />
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "60dvh" }}>
      {playedArchive.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50dvh" }}>
          <p className="text-gray" style={{ textAlign: "center", whiteSpace: "pre-line" }}>
            {t("archive.empty")}
          </p>
        </div>
      ) : (
        <>
          <div className="spacer-8" />
          <SeasonSelector seasons={seasons} selected={activeSeason} onSelect={setSelectedSeason} />
          <SeasonSummarySection
            archive={seasonArchive}
            seasonName={activeSeason === null ? null : seasonLabel(activeSeason)}
          />
          <PlayerStatsSummarySection
            archive={seasonArchive}
            seasonName={activeSeason === null ? null : seasonLabel(activeSeason)}
          />
          <hr style={{ border: "none", borderTop: "1px solid var(--divider)" }} />
          {seasonArchive.map((entry) => (
            <div key={entry.id} className="list-row" style={{ cursor: "pointer" }} onClick={() => setSelectedEntryId(entry.id)}>
              <div style={{ flex: 1 }}>
                <p className="text-bold">
                  {entry.result ? `${matchTitle(entry, teamName)} ${entry.result}` : matchTitle(entry, teamName)}
                </p>
                <p className="text-gray" style={{ fontSize: "0.8rem" }}>
                  {entry.date} · {formationLabel(entry.formationName)}
                  {entry.matchType === MatchType.FRIENDLY ? ` · ${storedLabel(MatchType.FRIENDLY)}` : ""}
                </p>
              </div>
              {entry.photoPaths.length > 0 && (
                <span className="text-gray" style={{ fontSize: "0.8rem" }}>
                  📷 {entry.photoPaths.length}
                </span>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
