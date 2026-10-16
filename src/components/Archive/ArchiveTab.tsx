import { useMemo, useState } from "react";
import type { ArchivedLineup, AttendanceRecord, Player } from "../../types";
import { SeasonSummarySection, PlayerStatsSummarySection } from "./SeasonSummarySection";
import { ArchiveDetailScreen } from "./ArchiveDetailScreen";
import { MatchType } from "../../types";
import { matchTitle } from "../../lib/matchTitle";
import { compareDateStrings, todayDateString } from "../../lib/dateUtils";
import { defaultSeasonStartYear, inSeason, listSeasonStartYears, seasonLabel, seasonStartYear } from "../../lib/season";
import { SeasonSelector } from "../Shell/SeasonSelector";
import { matchesSearch } from "../../lib/textSearch";
import { formationLabel, matchCountWord, storedLabel, t, tf } from "../../lib/i18n";
import { computeSeasonRecord } from "../../lib/seasonStats";

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

  // Hledání soupeře jde schválně NAPŘÍČ sezónami – "kdy jsme hráli se Spartou" je skoro vždy
  // otázka přes roky. Výsledky se ale pořád ukazují rozdělené po sezónách.
  const [search, setSearch] = useState("");
  const isSearching = search.trim() !== "";
  const searchResults = useMemo(
    () => (isSearching ? playedArchive.filter((e) => matchesSearch(e.opponent, search)) : []),
    [playedArchive, search, isSearching]
  );

  /** Zápasy rozdělené do sezón, od nejnovější; zápisy s neplatným datem padají na konec. */
  const groupedBySeason = useMemo(() => {
    const groups = new Map<number | null, ArchivedLineup[]>();
    for (const entry of searchResults) {
      const year = seasonStartYear(entry.date);
      if (!groups.has(year)) groups.set(year, []);
      groups.get(year)!.push(entry);
    }
    return Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === null) return 1;
      if (b[0] === null) return -1;
      return b[0] - a[0];
    });
  }, [searchResults]);

  const headToHead = useMemo(() => computeSeasonRecord(searchResults), [searchResults]);

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
          <div style={{ padding: "12px 16px 4px" }}>
            <input
              className="input"
              placeholder={t("archive.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isSearching ? (
            searchResults.length === 0 ? (
              <p className="text-gray" style={{ fontSize: "0.85rem", padding: "16px" }}>
                {t("archive.searchEmpty")}
              </p>
            ) : (
              <>
                <div style={{ padding: "8px 16px 0" }}>
                  <p className="text-bold" style={{ fontSize: "0.9rem" }}>
                    {tf("archive.h2hTitle", {
                      count: String(headToHead.played),
                      word: matchCountWord(headToHead.played),
                    })}
                  </p>
                  <div className="spacer-8" />
                  <p className="text-gray" style={{ fontSize: "0.85rem" }}>
                    {headToHead.wins} {t("season.win")} · {headToHead.draws} {t("season.draw")} ·{" "}
                    {headToHead.losses} {t("season.loss")} · {t("season.score")} {headToHead.goalsFor}:
                    {headToHead.goalsAgainst}
                  </p>
                </div>
                {/* Výsledky hledání jsou rozdělené po sezónách, ať je hned vidět, ze které sezóny
                    který zápas je – jinak by se roky slily do jednoho seznamu. */}
                {groupedBySeason.map(([startYear, entries]) => (
                  <div key={startYear ?? "bez-data"}>
                    <p
                      className="text-bold"
                      style={{ fontSize: "0.8rem", color: "var(--primary)", padding: "16px 16px 4px" }}
                    >
                      {startYear === null ? t("archive.noSeason") : seasonLabel(startYear)}
                    </p>
                    {entries.map((entry) => (
                      <MatchRow
                        key={entry.id}
                        entry={entry}
                        teamName={teamName}
                        onClick={() => setSelectedEntryId(entry.id)}
                      />
                    ))}
                  </div>
                ))}
              </>
            )
          ) : (
            <>
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
                <MatchRow
                  key={entry.id}
                  entry={entry}
                  teamName={teamName}
                  onClick={() => setSelectedEntryId(entry.id)}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

/** Jeden řádek zápasu v historii – stejný v seznamu sezóny i ve výsledcích hledání. */
function MatchRow({
  entry,
  teamName,
  onClick,
}: {
  entry: ArchivedLineup;
  teamName: string;
  onClick: () => void;
}) {
  return (
    <div className="list-row" style={{ cursor: "pointer" }} onClick={onClick}>
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
  );
}
