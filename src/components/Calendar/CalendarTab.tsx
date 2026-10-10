import { useMemo, useRef, useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { SaveLineupDialog } from "../Lineup/SaveLineupDialog";
import { ArchiveDetailScreen } from "../Archive/ArchiveDetailScreen";
import { compareDateStrings, todayDateString } from "../../lib/dateUtils";
import { matchTitle } from "../../lib/matchTitle";
import { parseFixtureWorkbook, type ParsedFixture } from "../../lib/fixtureImport";
import { storedLabel, t, tf } from "../../lib/i18n";
import { AttendanceKind, HomeAway, MatchType } from "../../types";
import type { ArchivedLineup, AttendanceRecord, Player, TrainingSession } from "../../types";

type CalendarItem =
  | { kind: "match"; id: string; date: string; entry: ArchivedLineup }
  | { kind: "training"; id: string; date: string; session: TrainingSession };

interface Props {
  teamCode: string;
  archive: ArchivedLineup[];
  trainings: TrainingSession[];
  teamName: string;
  players: Player[];
  attendance: AttendanceRecord[];
  currentFormationName: string;
  onAddMatch: (entry: ArchivedLineup) => void;
  onAddTraining: (session: TrainingSession) => void;
  onUpdateEntry: (entry: ArchivedLineup) => void;
  onDeleteEntry: (entry: ArchivedLineup) => void;
  onAddAttendanceRecord: (record: AttendanceRecord) => void;
  onUpdateAttendanceRecord: (record: AttendanceRecord) => void;
  readOnly?: boolean;
}

function badgeStyle(color: string): React.CSSProperties {
  return {
    display: "inline-block",
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 10,
    background: color,
    color: "#fff",
  };
}

function CalendarRow({ item, teamName, onOpenMatch }: { item: CalendarItem; teamName: string; onOpenMatch: (entry: ArchivedLineup) => void }) {
  if (item.kind === "match") {
    const { entry } = item;
    return (
      <div className="list-row" style={{ cursor: "pointer" }} onClick={() => onOpenMatch(entry)}>
        <div>
          <p className="text-bold">
            {entry.result ? `${matchTitle(entry, teamName)} ${entry.result}` : matchTitle(entry, teamName)}
          </p>
          <p className="text-gray" style={{ fontSize: "0.8rem" }}>
            {entry.date}
          </p>
        </div>
        <span style={badgeStyle(entry.matchType === MatchType.FRIENDLY ? "gray" : "var(--pitch-green)")}>
          {entry.matchType === MatchType.FRIENDLY ? t("cal.friendlyBadge") : t("cal.match")}
        </span>
      </div>
    );
  }

  const { session } = item;
  const totalMinutes = session.blocks.reduce((sum, b) => sum + b.minutes, 0);
  return (
    <div className="list-row">
      <div>
        <p className="text-bold">
          {session.blocks.length === 0
            ? storedLabel(AttendanceKind.TRAINING)
            : tf("cal.trainingWithMinutes", { min: String(totalMinutes) })}
        </p>
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          {session.date}
        </p>
      </div>
      <span style={badgeStyle("var(--primary)")}>{storedLabel(AttendanceKind.TRAINING)}</span>
    </div>
  );
}

export function CalendarTab({
  teamCode,
  archive,
  trainings,
  teamName,
  players,
  attendance,
  currentFormationName,
  onAddMatch,
  onAddTraining,
  onUpdateEntry,
  onDeleteEntry,
  onAddAttendanceRecord,
  onUpdateAttendanceRecord,
  readOnly = false,
}: Props) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showChooser, setShowChooser] = useState(false);
  const [showSaveMatchDialog, setShowSaveMatchDialog] = useState(false);
  const [showAddTrainingDialog, setShowAddTrainingDialog] = useState(false);
  const [newTrainingDate, setNewTrainingDate] = useState(todayDateString());
  const [importPreview, setImportPreview] = useState<{ ourTeamLabel: string; fixtures: ParsedFixture[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedEntry = archive.find((e) => e.id === selectedEntryId);

  const existingMatchKeys = useMemo(
    () => new Set(archive.map((e) => `${e.date}__${e.opponent.trim().toLowerCase()}`)),
    [archive]
  );

  async function handleFileSelected(file: File) {
    setImportError(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseFixtureWorkbook(buffer);
      if (result.warnings.length > 0) {
        setImportError(result.warnings.join(" "));
        return;
      }
      setImportPreview({ ourTeamLabel: result.ourTeamLabel, fixtures: result.fixtures });
    } catch {
      setImportError(t("cal.importReadError"));
    }
  }

  const { upcoming, past } = useMemo(() => {
    const today = todayDateString();
    const items: CalendarItem[] = [
      ...archive.map((entry): CalendarItem => ({ kind: "match", id: entry.id, date: entry.date, entry })),
      ...trainings.map((session): CalendarItem => ({ kind: "training", id: session.id, date: session.date, session })),
    ];
    const upcomingItems = items
      .filter((i) => compareDateStrings(i.date, today) >= 0)
      .sort((a, b) => compareDateStrings(a.date, b.date));
    const pastItems = items
      .filter((i) => compareDateStrings(i.date, today) < 0)
      .sort((a, b) => compareDateStrings(b.date, a.date));
    return { upcoming: upcomingItems, past: pastItems };
  }, [archive, trainings]);

  const isEmpty = upcoming.length === 0 && past.length === 0;

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
    <div className="content-with-fab" style={{ position: "relative", minHeight: "60dvh" }}>
      {isEmpty ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50dvh" }}>
          <p className="text-gray" style={{ textAlign: "center", whiteSpace: "pre-line" }}>
            {t("cal.empty")}
          </p>
        </div>
      ) : (
        <>
          <div style={{ padding: "16px 16px 0" }}>
            <p className="text-bold" style={{ fontSize: "0.9rem" }}>
              {t("cal.upcoming")}
            </p>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-gray" style={{ fontSize: "0.8rem", padding: "8px 16px 16px" }}>
              {t("cal.nothingPlanned")}
            </p>
          ) : (
            upcoming.map((item) => (
              <CalendarRow key={`${item.kind}-${item.id}`} item={item} teamName={teamName} onOpenMatch={(entry) => setSelectedEntryId(entry.id)} />
            ))
          )}

          <hr style={{ border: "none", borderTop: "1px solid var(--divider)" }} />

          <div style={{ padding: "16px 16px 0" }}>
            <p className="text-bold" style={{ fontSize: "0.9rem" }}>
              {t("cal.past")}
            </p>
          </div>
          {past.length === 0 ? (
            <p className="text-gray" style={{ fontSize: "0.8rem", padding: "8px 16px 16px" }}>
              {t("cal.nothingPlayed")}
            </p>
          ) : (
            past.map((item) => (
              <CalendarRow key={`${item.kind}-${item.id}`} item={item} teamName={teamName} onOpenMatch={(entry) => setSelectedEntryId(entry.id)} />
            ))
          )}
        </>
      )}

      {!readOnly && (
        <button className="btn fab-button" onClick={() => setShowChooser(true)}>
          {t("cal.add")}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xls,.xlsx"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleFileSelected(file);
        }}
      />

      {showChooser && (
        <Dialog
          title={t("cal.chooserTitle")}
          onDismiss={() => setShowChooser(false)}
          actions={
            <button className="btn-text" onClick={() => setShowChooser(false)}>
              {t("common.cancel")}
            </button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              className="btn-outline"
              onClick={() => {
                setShowChooser(false);
                setShowSaveMatchDialog(true);
              }}
            >
              {t("cal.match")}
            </button>
            <button
              className="btn-outline"
              onClick={() => {
                setShowChooser(false);
                setNewTrainingDate(todayDateString());
                setShowAddTrainingDialog(true);
              }}
            >
              {storedLabel(AttendanceKind.TRAINING)}
            </button>
            <button
              className="btn-outline"
              onClick={() => {
                setShowChooser(false);
                fileInputRef.current?.click();
              }}
            >
              {t("cal.importExcel")}
            </button>
          </div>
        </Dialog>
      )}

      {importError && (
        <Dialog
          title={t("cal.importFailedTitle")}
          onDismiss={() => setImportError(null)}
          actions={
            <button className="btn-text" onClick={() => setImportError(null)}>
              {t("common.close")}
            </button>
          }
        >
          <p>{importError}</p>
        </Dialog>
      )}

      {importPreview && (
        <Dialog
          title={t("cal.importTitle")}
          onDismiss={() => setImportPreview(null)}
          actions={
            <>
              <button className="btn-text" onClick={() => setImportPreview(null)}>
                {t("common.cancel")}
              </button>
              <button
                className="btn"
                style={{ width: "auto", padding: "10px 20px" }}
                disabled={importPreview.fixtures.every((f) => existingMatchKeys.has(`${f.date}__${f.opponent.trim().toLowerCase()}`))}
                onClick={() => {
                  for (const fixture of importPreview.fixtures) {
                    const key = `${fixture.date}__${fixture.opponent.trim().toLowerCase()}`;
                    if (existingMatchKeys.has(key)) continue;
                    onAddMatch({
                      id: crypto.randomUUID(),
                      date: fixture.date,
                      opponent: fixture.opponent,
                      formationName: currentFormationName,
                      names: {},
                      substitutes: [],
                      notes: "",
                      photoPaths: [],
                      result: fixture.result,
                      playerStats: {},
                      matchType: fixture.matchType,
                      homeAway: fixture.homeAway,
                      closed: false,
                    });
                  }
                  setImportPreview(null);
                }}
              >
                {t("cal.importConfirm")}
              </button>
            </>
          }
        >
          <p className="text-gray" style={{ fontSize: "0.8rem" }}>
            {t("cal.recognizedTeam")}: <strong>{importPreview.ourTeamLabel}</strong>
          </p>
          <div className="spacer-8" />
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {importPreview.fixtures.map((f, i) => {
              const isDuplicate = existingMatchKeys.has(`${f.date}__${f.opponent.trim().toLowerCase()}`);
              return (
                <div key={i} className="list-row" style={{ opacity: isDuplicate ? 0.5 : 1 }}>
                  <div>
                    <p>
                      {storedLabel(f.homeAway === HomeAway.HOME ? HomeAway.HOME : HomeAway.AWAY)} · {f.opponent}
                    </p>
                    <p className="text-gray" style={{ fontSize: "0.75rem" }}>
                      {f.date}
                      {f.result ? ` · ${f.result}` : ""}
                    </p>
                  </div>
                  {isDuplicate && (
                    <span className="text-gray" style={{ fontSize: "0.75rem" }}>
                      {t("cal.alreadyExists")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Dialog>
      )}

      {showSaveMatchDialog && (
        <SaveLineupDialog
          onDismiss={() => setShowSaveMatchDialog(false)}
          onConfirm={(date, opponent, matchType, homeAway) => {
            const key = `${date}__${opponent.trim().toLowerCase()}`;
            const existing = archive.find((e) => `${e.date}__${e.opponent.trim().toLowerCase()}` === key);
            if (existing) {
              setSelectedEntryId(existing.id);
            } else {
              const newEntry: ArchivedLineup = {
                id: crypto.randomUUID(),
                date,
                opponent,
                formationName: currentFormationName,
                names: {},
                substitutes: [],
                notes: "",
                photoPaths: [],
                result: "",
                playerStats: {},
                matchType,
                homeAway,
                closed: false,
              };
              onAddMatch(newEntry);
              setSelectedEntryId(newEntry.id);
            }
            setShowSaveMatchDialog(false);
          }}
        />
      )}

      {showAddTrainingDialog && (
        <Dialog
          title={t("cal.addTrainingTitle")}
          onDismiss={() => setShowAddTrainingDialog(false)}
          actions={
            <>
              <button className="btn-text" onClick={() => setShowAddTrainingDialog(false)}>
                {t("common.cancel")}
              </button>
              <button
                className="btn"
                style={{ width: "auto", padding: "10px 20px" }}
                disabled={!newTrainingDate.trim()}
                onClick={() => {
                  onAddTraining({ id: crypto.randomUUID(), date: newTrainingDate.trim(), blocks: [], notes: "" });
                  setShowAddTrainingDialog(false);
                }}
              >
                {t("common.add")}
              </button>
            </>
          }
        >
          <label className="field-label">{t("saveLineup.date")}</label>
          <input className="input" value={newTrainingDate} onChange={(e) => setNewTrainingDate(e.target.value)} />
        </Dialog>
      )}
    </div>
  );
}
