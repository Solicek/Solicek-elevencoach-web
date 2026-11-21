import { useMemo, useState } from "react";
import type { ArchivedLineup, AttendanceRecord, Player } from "../../types";
import { MatchType } from "../../types";
import { ArchiveDetailScreen } from "../Archive/ArchiveDetailScreen";
import { AttendanceDetailScreen } from "../Attendance/AttendanceDetailScreen";
import { SeasonSummarySection } from "../Archive/SeasonSummarySection";
import { SeasonSelector } from "../Shell/SeasonSelector";
import { PlayerSeasonTable } from "./PlayerSeasonTable";
import { buildPlayerTable, filterByCompetitive } from "../../lib/playerSeasonTable";
import {
  currentSeasonPart,
  defaultSeasonStartYear,
  inSeason,
  inSeasonPart,
  listSeasonStartYears,
  seasonLabel,
  seasonPartsAvailable,
  seasonStartYear,
  type SeasonPart,
} from "../../lib/season";
import { compareDateStrings, todayDateString } from "../../lib/dateUtils";
import { matchesSearch } from "../../lib/textSearch";
import { computeSeasonRecord } from "../../lib/seasonStats";
import { matchTitle } from "../../lib/matchTitle";
import { formationLabel, matchCountWord, storedLabel, t, tf } from "../../lib/i18n";

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
  onDeleteAttendanceRecord: (record: AttendanceRecord) => void;
  readOnly?: boolean;
}

type View = "players" | "entries";
type EntryFilter = "all" | "matches" | "trainings";

/** Průměr z poměrů přítomnosti jednotlivých termínů (každý termín váží stejně). */
function averageAttendance(records: AttendanceRecord[]): number | null {
  const ratios = records
    .filter((r) => r.playerNames.length > 0)
    .map((r) => (r.playerNames.length - r.absentNames.length) / r.playerNames.length);
  if (ratios.length === 0) return null;
  return ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
}

/**
 * Sezóna – sloučená historie zápasů a docházka na jednom místě.
 *
 * Dřív to byly dvě záložky a trenér si musel čísla srovnávat v hlavě: v Historii góly, ve
 * Docházce účast. Tady se obojí potkává v jedné tabulce hráčů, nad kterou jsou tři filtry:
 * sezóna, její polovina (podzim / jaro / celkem) a zda počítat i přátelské zápasy.
 *
 * Sezóna i její polovina se odvozují z data (lib/season.ts), takže to funguje zpětně na
 * všechna data v databázi a nic se nemigruje. Detailní obrazovky zápasu i termínu docházky
 * zůstaly beze změny, jen se k nim chodí odsud.
 */
export function SeasonTab({
  teamCode,
  teamName,
  archive,
  players,
  attendance,
  onUpdateEntry,
  onDeleteEntry,
  onAddAttendanceRecord,
  onUpdateAttendanceRecord,
  onDeleteAttendanceRecord,
  readOnly = false,
}: Props) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [view, setView] = useState<View>("players");
  const [entryFilter, setEntryFilter] = useState<EntryFilter>("all");
  const [competitiveOnlyFlag, setCompetitiveOnlyFlag] = useState(true);
  const [search, setSearch] = useState("");

  // Historie ukazuje jen odehrané zápasy (včetně dnešního); budoucí se plánují v Kalendáři.
  const playedArchive = useMemo(() => {
    const today = todayDateString();
    return archive
      .filter((e) => compareDateStrings(e.date, today) <= 0)
      .sort((a, b) => compareDateStrings(b.date, a.date));
  }, [archive]);

  // Nabídka sezón vychází ze zápasů i z docházky – jinak by sezóna, ve které se jen trénovalo,
  // v přepínači chyběla.
  const seasons = useMemo(
    () => listSeasonStartYears([...playedArchive.map((e) => e.date), ...attendance.map((a) => a.date)]),
    [playedArchive, attendance]
  );
  const [selectedSeason, setSelectedSeason] = useState<number | null | undefined>(undefined);
  // `undefined` = trenér zatím nevybíral, bere se výchozí sezóna (dopočítá se, až dorazí data).
  const activeSeason = selectedSeason === undefined ? defaultSeasonStartYear(seasons) : selectedSeason;

  // Otevře se polovina sezóny, ve které jsme dnes.
  const [selectedPart, setSelectedPart] = useState<SeasonPart | undefined>(undefined);
  // Nad volbou "Vše" (napříč sezónami) nedávají poloviny smysl a přepínač se skrývá. Musí se
  // pak i přestat filtrovat – jinak by schovaný "podzim" dál tiše ořezával data.
  const partsVisible = seasonPartsAvailable() && activeSeason !== null;
  const activePart: SeasonPart = partsVisible ? selectedPart ?? currentSeasonPart() : "whole";

  const periodArchive = useMemo(
    () => inSeasonPart(inSeason(playedArchive, activeSeason), activePart),
    [playedArchive, activeSeason, activePart]
  );
  const periodAttendance = useMemo(
    () => inSeasonPart(inSeason(attendance, activeSeason), activePart),
    [attendance, activeSeason, activePart]
  );

  const tableRows = useMemo(
    () => buildPlayerTable(players, filterByCompetitive(periodArchive, competitiveOnlyFlag), periodAttendance),
    [players, periodArchive, periodAttendance, competitiveOnlyFlag]
  );

  const avgAttendance = useMemo(() => averageAttendance(periodAttendance), [periodAttendance]);

  // Hledání soupeře jde schválně NAPŘÍČ sezónami – "kdy jsme hráli se Spartou" je skoro vždy
  // otázka přes roky. Výsledky se ale pořád ukazují rozdělené po sezónách.
  const isSearching = search.trim() !== "";
  const searchResults = useMemo(
    () => (isSearching ? playedArchive.filter((e) => matchesSearch(e.opponent, search)) : []),
    [playedArchive, search, isSearching]
  );
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

  /**
   * Chronologický seznam: zápasy z archivu a k tomu termíny docházky, které k žádnému
   * zápasu nepatří (tréninky). Docházka zápasu se neukazuje zvlášť – je uvnitř detailu
   * zápasu, jinak by byl každý zápas v seznamu dvakrát.
   */
  const entries = useMemo(() => {
    const archiveIds = new Set(periodArchive.map((e) => e.id));
    const standalone = periodAttendance.filter((a) => a.matchId === null || !archiveIds.has(a.matchId));
    const rows: { key: string; date: string; match?: ArchivedLineup; record?: AttendanceRecord }[] = [];
    if (entryFilter !== "trainings") {
      for (const match of periodArchive) rows.push({ key: "m" + match.id, date: match.date, match });
    }
    if (entryFilter !== "matches") {
      for (const record of standalone) rows.push({ key: "a" + record.id, date: record.date, record });
    }
    return rows.sort((a, b) => compareDateStrings(b.date, a.date));
  }, [periodArchive, periodAttendance, entryFilter]);

  const selectedEntry = playedArchive.find((e) => e.id === selectedEntryId);
  const selectedRecord = attendance.find((a) => a.id === selectedRecordId);

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

  if (selectedRecord) {
    return (
      <AttendanceDetailScreen
        record={selectedRecord}
        players={players}
        onBack={() => setSelectedRecordId(null)}
        onUpdateRecord={onUpdateAttendanceRecord}
        onDeleteRecord={() => {
          onDeleteAttendanceRecord(selectedRecord);
          setSelectedRecordId(null);
        }}
        readOnly={readOnly}
      />
    );
  }

  if (playedArchive.length === 0 && attendance.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50dvh" }}>
        <p className="text-gray" style={{ textAlign: "center", whiteSpace: "pre-line" }}>
          {t("archive.empty")}
        </p>
      </div>
    );
  }

  const seasonName = activeSeason === null ? null : seasonLabel(activeSeason);
  // Nadpis souhrnu musí říct i polovinu sezóny – jinak by u podzimu tvrdil, že jde o celou sezónu.
  const partName =
    activePart === "autumn" ? t("season.partAutumn") : activePart === "spring" ? t("season.partSpring") : null;
  const periodName = [seasonName, partName?.toLocaleLowerCase("cs")].filter(Boolean).join(" · ") || null;
  const isEmptyPeriod = periodArchive.length === 0 && periodAttendance.length === 0;

  return (
    <div style={{ position: "relative", minHeight: "60dvh" }}>
      {/* Hledání soupeře patří k zápisům; nad tabulkou hráčů by jen odsouvalo čísla pod okraj. */}
      {view === "entries" && (
        <div style={{ padding: "12px 16px 4px" }}>
          <input className="input" placeholder={t("archive.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      {isSearching && view === "entries" ? (
        searchResults.length === 0 ? (
          <p className="text-gray" style={{ fontSize: "0.85rem", padding: "16px" }}>
            {t("archive.searchEmpty")}
          </p>
        ) : (
          <>
            <div style={{ padding: "8px 16px 0" }}>
              <p className="text-bold" style={{ fontSize: "0.9rem" }}>
                {tf("archive.h2hTitle", { count: String(headToHead.played), word: matchCountWord(headToHead.played) })}
              </p>
              <div className="spacer-8" />
              <p className="text-gray" style={{ fontSize: "0.85rem" }}>
                {headToHead.wins} {t("season.win")} · {headToHead.draws} {t("season.draw")} · {headToHead.losses}{" "}
                {t("season.loss")} · {t("season.score")} {headToHead.goalsFor}:{headToHead.goalsAgainst}
              </p>
            </div>
            {groupedBySeason.map(([startYear, found]) => (
              <div key={startYear ?? "bez-data"}>
                <p className="text-bold" style={{ fontSize: "0.8rem", color: "var(--primary)", padding: "16px 16px 4px" }}>
                  {startYear === null ? t("archive.noSeason") : seasonLabel(startYear)}
                </p>
                {found.map((entry) => (
                  <MatchRow key={entry.id} entry={entry} teamName={teamName} onClick={() => setSelectedEntryId(entry.id)} />
                ))}
              </div>
            ))}
          </>
        )
      ) : (
        <>
          <div className="spacer-8" />
          <SeasonSelector seasons={seasons} selected={activeSeason} onSelect={setSelectedSeason} />
          {partsVisible && (
            <ChipRow>
              <Chip selected={activePart === "autumn"} onClick={() => setSelectedPart("autumn")} label={t("season.partAutumn")} />
              <Chip selected={activePart === "spring"} onClick={() => setSelectedPart("spring")} label={t("season.partSpring")} />
              <Chip selected={activePart === "whole"} onClick={() => setSelectedPart("whole")} label={t("season.partWhole")} />
            </ChipRow>
          )}

          <SeasonSummarySection
            archive={periodArchive}
            seasonName={periodName}
            extraLine={avgAttendance === null ? null : `${t("season.avgAttendance")} ${Math.round(avgAttendance * 100)} %`}
          />

          <ChipRow>
            <Chip selected={view === "players"} onClick={() => setView("players")} label={t("season.viewPlayers")} />
            <Chip selected={view === "entries"} onClick={() => setView("entries")} label={t("season.viewEntries")} />
          </ChipRow>

          {isEmptyPeriod ? (
            <p className="text-gray" style={{ fontSize: "0.85rem", padding: 16, textAlign: "center" }}>
              {t("season.emptyPart")}
            </p>
          ) : view === "players" ? (
            <>
              <ChipRow>
                <Chip
                  selected={competitiveOnlyFlag}
                  onClick={() => setCompetitiveOnlyFlag(true)}
                  label={t("season.onlyCompetitive")}
                />
                <Chip
                  selected={!competitiveOnlyFlag}
                  onClick={() => setCompetitiveOnlyFlag(false)}
                  label={t("season.allMatches")}
                />
              </ChipRow>
              <PlayerSeasonTable rows={tableRows} />
            </>
          ) : (
            <>
              <ChipRow>
                <Chip selected={entryFilter === "all"} onClick={() => setEntryFilter("all")} label={t("season.filterAll")} />
                <Chip
                  selected={entryFilter === "matches"}
                  onClick={() => setEntryFilter("matches")}
                  label={t("season.filterMatches")}
                />
                <Chip
                  selected={entryFilter === "trainings"}
                  onClick={() => setEntryFilter("trainings")}
                  label={t("season.filterTrainings")}
                />
              </ChipRow>
              {entries.map((row) =>
                row.match ? (
                  <MatchRow key={row.key} entry={row.match} teamName={teamName} onClick={() => setSelectedEntryId(row.match!.id)} />
                ) : (
                  <AttendanceRow key={row.key} record={row.record!} onClick={() => setSelectedRecordId(row.record!.id)} />
                )
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 8px" }}>{children}</div>;
}

function Chip({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button className={`chip ${selected ? "selected" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

/** Jeden řádek zápasu – stejný v seznamu i ve výsledcích hledání. */
function MatchRow({ entry, teamName, onClick }: { entry: ArchivedLineup; teamName: string; onClick: () => void }) {
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

/** Termín docházky, který nepatří k zápasu – typicky trénink. */
function AttendanceRow({ record, onClick }: { record: AttendanceRecord; onClick: () => void }) {
  const present = record.playerNames.length - record.absentNames.length;
  return (
    <div className="list-row" style={{ cursor: "pointer" }} onClick={onClick}>
      <div style={{ flex: 1 }}>
        <p className="text-bold">{storedLabel(record.kind)}</p>
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          {record.date}
        </p>
      </div>
      <span className="text-gray" style={{ fontSize: "0.8rem" }}>
        {tf("att.presentOf", { present: String(present), total: String(record.playerNames.length) })}
      </span>
    </div>
  );
}
