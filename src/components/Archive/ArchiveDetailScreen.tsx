import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "../Shell/Dialog";
import { ChipSelector } from "../Shell/ChipSelector";
import { Pitch } from "../Pitch/Pitch";
import { FormationDropdown } from "../Pitch/FormationDropdown";
import { SubstitutesSection } from "../Lineup/SubstitutesSection";
import { PlayerStatsSection } from "./PlayerStatsSection";
import { PhotoGallery } from "./PhotoGallery";
import { AttendanceInlineSection } from "../Attendance/AttendanceChecklist";
import { formations, formationNames } from "../../formations";
import { computeArchiveAddSubstitute, computeArchiveAssignment, computeArchiveFormationChange, computeArchiveUnassign } from "../../lib/archiveLineupEdit";
import * as repo from "../../repository/teamRepository";
import { allMatchTypes, allHomeAway, MatchType } from "../../types";
import type { ArchivedLineup, AttendanceRecord, Player } from "../../types";
import { homeAwayNames, matchTitle } from "../../lib/matchTitle";
import { isOlderThanLockWindow } from "../../lib/dateUtils";
import { formationLabel, t, tf } from "../../lib/i18n";

interface ParsedResult {
  home: string;
  away: string;
  htHome: string;
  htAway: string;
}

/** Rozloží uložený string výsledku ("3:1" nebo "3:1 (1:0)") na jednotlivá čísla pro číselná
 * pole – u nerozpoznaného/starého formátu (bez ":") vrátí prázdná pole, ať zadávání nespadne. */
function parseResult(result: string): ParsedResult {
  const m = result.match(/^\s*(\d*)\s*:\s*(\d*)\s*(?:\(\s*(\d*)\s*:\s*(\d*)\s*\))?/);
  if (!m) return { home: "", away: "", htHome: "", htAway: "" };
  return { home: m[1] ?? "", away: m[2] ?? "", htHome: m[3] ?? "", htAway: m[4] ?? "" };
}

/** Sestaví string výsledku zpět ze čtyř čísel – stejný formát ("H:A" / "H:A (HH:HA)"), jaký
 * čeká kontrola gólů v PlayerStatsSection i zobrazení v nadpisu (matchTitle). */
function buildResult(home: string, away: string, htHome: string, htAway: string): string {
  if (!home && !away) return "";
  const base = `${home}:${away}`;
  return htHome || htAway ? `${base} (${htHome}:${htAway})` : base;
}

interface Props {
  teamCode: string;
  teamName: string;
  entry: ArchivedLineup;
  players: Player[];
  attendanceRecord: AttendanceRecord | null;
  onBack: () => void;
  onUpdateEntry: (entry: ArchivedLineup) => void;
  onDeleteEntry: () => void;
  onAddAttendanceRecord: (record: AttendanceRecord) => void;
  onUpdateAttendanceRecord: (record: AttendanceRecord) => void;
  /** Vynutí kompletní režim jen pro čtení bez ohledu na stáří/uzavření zápasu (přístup kapitána). */
  forceReadOnly?: boolean;
}

export function ArchiveDetailScreen({
  teamCode,
  teamName,
  entry,
  players,
  attendanceRecord,
  onBack,
  onUpdateEntry,
  onDeleteEntry,
  onAddAttendanceRecord,
  onUpdateAttendanceRecord,
  forceReadOnly = false,
}: Props) {
  // Lokální zdroj pravdy pro CELÝ editovaný zápis, ne jen poznámky/výsledek. `entry` prop
  // se aktualizuje až PO kole přes Firestore (zápis -> realtime listener -> nový prop), což
  // při rychle po sobě jdoucích akcích (přiřadit hráče na dvě pozice, přidat dva náhradníky
  // za sebou...) vedlo k tomu, že druhá akce počítala ze ZASTARALÉHO `entry`, bez výsledku
  // té první – hráč tak šel přidat na dvě pozice zároveň a "Uvolnit pozici" pak smazalo jen
  // jeden z obou výskytů. Stejný vzor (lokální stav + zápis jako samostatný efekt, ne přímo
  // v setState updateru) už dřív vyřešil identickou chybu v živé sestavě (viz useTeamData.ts).
  const [localEntry, setLocalEntry] = useState(entry);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  // Po resyncu (přepnutí na jiný zápis) se nemá hned zapisovat zpátky – jinak by otevření
  // byť jen pro čtení (starý uzamčený zápis) zbytečně vyvolalo zápis do Firestore.
  const skipNextPersistRef = useRef(true);

  // Resync z proppu jen při přepnutí na jiný zápis (jiné id) – během editace je lokální stav
  // zdrojem pravdy, stejný vzor, jaký předtím používaly jen poznámky/výsledek.
  useEffect(() => {
    skipNextPersistRef.current = true;
    setLocalEntry(entry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);

  // Zápis do Firestore je samostatný efekt (ne side-effect uvnitř setState updateru) – ten
  // musí zůstat čistý, React ho smí za určitých okolností zavolat víckrát.
  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    if (forceReadOnly) return;
    onUpdateEntry(localEntry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localEntry]);

  function updateLocal(patch: Partial<ArchivedLineup> | ((prev: ArchivedLineup) => Partial<ArchivedLineup>)) {
    setLocalEntry((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }

  const isOldMatch = isOlderThanLockWindow(localEntry.date);
  const fullyLocked = forceReadOnly || (isOldMatch && !localEntry.unlocked);
  const lineupLocked = forceReadOnly || localEntry.closed || fullyLocked;

  const currentStarterNames = new Set(
    Object.entries(localEntry.names)
      .filter(([key]) => key.startsWith(`${localEntry.formationName}|`))
      .map(([, name]) => name)
  );

  const participants = useMemo(() => {
    const fromNames = Object.values(localEntry.names).filter((n) => n.trim() !== "");
    const fromSubs = localEntry.substitutes.map((s) => s.name);
    return Array.from(new Set([...fromNames, ...fromSubs]));
  }, [localEntry.names, localEntry.substitutes]);

  function createAttendanceRecord(): AttendanceRecord {
    return {
      id: crypto.randomUUID(),
      date: localEntry.date,
      playerNames: participants,
      absentNames: [],
      trainingId: null,
      matchId: localEntry.id,
      kind: localEntry.matchType,
    };
  }

  const parsedResult = parseResult(localEntry.result);
  const [showHalfTime, setShowHalfTime] = useState(() => Boolean(parsedResult.htHome || parsedResult.htAway));

  // Poločas se zobrazí rozbalený hned, pokud ho zápis už má – ale jen při PŘEPNUTÍ na jiný
  // zápis (entry.id), ne po každém písmenku zadaném do políček (to by jinak po smazání
  // poločasového čísla hned zase schovalo řádek pod prstem).
  useEffect(() => {
    const parsed = parseResult(entry.result);
    setShowHalfTime(Boolean(parsed.htHome || parsed.htAway));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="btn-text" onClick={onBack}>
          {t("detail.back")}
        </button>
        {!forceReadOnly && (
          <button className="btn-text danger" onClick={() => setShowDeleteConfirm(true)}>
            {t("detail.deleteMatch")}
          </button>
        )}
      </div>

      <p className="text-bold" style={{ fontSize: "1.1rem" }}>
        {localEntry.result.trim() ? `${matchTitle(localEntry, teamName)} ${localEntry.result}` : matchTitle(localEntry, teamName)}
      </p>
      <p className="text-gray" style={{ fontSize: "0.8rem" }}>
        {localEntry.date} · {formationLabel(localEntry.formationName)}
      </p>

      {fullyLocked && (
        <>
          <div className="spacer-8" />
          <p className="text-gray" style={{ fontSize: "0.8rem", background: "var(--surface-variant)", padding: "8px 12px", borderRadius: 8 }}>
            {forceReadOnly ? t("detail.captainReadOnly") : t("detail.olderReadOnly")}
          </p>
          {!forceReadOnly && (
            <>
              <div className="spacer-8" />
              <button className="btn-outline" onClick={() => updateLocal({ unlocked: true })}>
                {t("detail.unlockAnyway")}
              </button>
            </>
          )}
        </>
      )}
      {!forceReadOnly && isOldMatch && localEntry.unlocked && (
        <>
          <div className="spacer-8" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-variant)", padding: "8px 12px", borderRadius: 8 }}>
            <p className="text-gray" style={{ fontSize: "0.8rem" }}>
              {t("detail.manuallyUnlocked")}
            </p>
            <button className="btn-text" onClick={() => updateLocal({ unlocked: false })}>
              {t("detail.lockBack")}
            </button>
          </div>
        </>
      )}

      <div className="spacer-16" />
      <ChipSelector
        options={allMatchTypes}
        selected={localEntry.matchType}
        readOnly={fullyLocked}
        onSelect={(value) => {
          updateLocal({ matchType: value });
          // Docházka si druh termínu pamatuje od svého založení – bez téhle aktualizace by
          // zápas po přepnutí typu zůstal ve statistice docházky v původní kategorii.
          if (attendanceRecord && attendanceRecord.kind !== value) {
            onUpdateAttendanceRecord({ ...attendanceRecord, kind: value });
          }
        }}
      />
      {localEntry.matchType === MatchType.FRIENDLY && (
        <p className="text-gray" style={{ fontSize: "0.75rem", marginTop: 4 }}>
          {t("detail.friendlyNote")}
        </p>
      )}

      <div className="spacer-8" />
      <ChipSelector
        options={allHomeAway}
        selected={localEntry.homeAway}
        readOnly={fullyLocked}
        onSelect={(h) => updateLocal({ homeAway: h })}
      />

      <div className="spacer-8" />
      <label className="field-label">
        {localEntry.homeAway
          ? tf("detail.resultWith", {
              home: homeAwayNames(localEntry, teamName).home,
              away: homeAwayNames(localEntry, teamName).away,
            })
          : t("detail.result")}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          style={{ width: 64, textAlign: "center" }}
          placeholder="0"
          value={parsedResult.home}
          readOnly={fullyLocked}
          onChange={(e) => updateLocal({ result: buildResult(e.target.value, parsedResult.away, parsedResult.htHome, parsedResult.htAway) })}
        />
        <span className="text-bold">:</span>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          style={{ width: 64, textAlign: "center" }}
          placeholder="0"
          value={parsedResult.away}
          readOnly={fullyLocked}
          onChange={(e) => updateLocal({ result: buildResult(parsedResult.home, e.target.value, parsedResult.htHome, parsedResult.htAway) })}
        />
      </div>

      {showHalfTime ? (
        <>
          <div className="spacer-8" />
          <label className="field-label">{t("detail.halfTime")}</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              style={{ width: 64, textAlign: "center" }}
              placeholder="0"
              value={parsedResult.htHome}
              readOnly={fullyLocked}
              onChange={(e) => updateLocal({ result: buildResult(parsedResult.home, parsedResult.away, e.target.value, parsedResult.htAway) })}
            />
            <span className="text-bold">:</span>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              style={{ width: 64, textAlign: "center" }}
              placeholder="0"
              value={parsedResult.htAway}
              readOnly={fullyLocked}
              onChange={(e) => updateLocal({ result: buildResult(parsedResult.home, parsedResult.away, parsedResult.htHome, e.target.value) })}
            />
            {!fullyLocked && (
              <button
                className="btn-text"
                onClick={() => {
                  setShowHalfTime(false);
                  updateLocal({ result: buildResult(parsedResult.home, parsedResult.away, "", "") });
                }}
              >
                {t("common.remove")}
              </button>
            )}
          </div>
        </>
      ) : (
        !fullyLocked && (
          <button className="btn-text" style={{ padding: 0, marginTop: 4 }} onClick={() => setShowHalfTime(true)}>
            {t("detail.addHalfTime")}
          </button>
        )
      )}

      <div className="spacer-16" />
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {t("nav.lineup")}
      </p>
      {localEntry.closed && !fullyLocked && (
        <p className="text-gray" style={{ fontSize: "0.75rem" }}>
          {t("detail.lineupClosed")}
        </p>
      )}
      <div className="spacer-8" />
      <FormationDropdown
        selected={localEntry.formationName}
        options={formationNames}
        readOnly={lineupLocked}
        onSelected={(newFormation) => {
          updateLocal((prev) => {
            const result = computeArchiveFormationChange({ names: prev.names, substitutes: prev.substitutes }, prev.formationName, newFormation);
            return { formationName: newFormation, names: result.names, substitutes: result.substitutes };
          });
        }}
      />
      <div className="spacer-8" />
      <Pitch
        positions={formations[localEntry.formationName] ?? []}
        formationName={localEntry.formationName}
        names={localEntry.names}
        players={players}
        readOnly={lineupLocked}
        onAssignPlayer={(player, pos) => {
          updateLocal((prev) => {
            const result = computeArchiveAssignment({ names: prev.names, substitutes: prev.substitutes }, player, pos, prev.formationName);
            return { names: result.names, substitutes: result.substitutes };
          });
        }}
        onUnassignSlot={(key) => {
          updateLocal((prev) => {
            const result = computeArchiveUnassign({ names: prev.names, substitutes: prev.substitutes }, key);
            return { names: result.names };
          });
        }}
        onCreatePlayer={(name, pos) => {
          const player: Player = { id: crypto.randomUUID(), name: name.trim(), preferredPositions: [pos.label], positionKey: null, positionDisplayName: null };
          repo.savePlayer(teamCode, player);
          updateLocal((prev) => {
            const result = computeArchiveAssignment({ names: prev.names, substitutes: prev.substitutes }, player, pos, prev.formationName);
            return { names: result.names, substitutes: result.substitutes };
          });
        }}
        style={{ width: "100%", aspectRatio: "0.62" }}
      />
      <div className="spacer-16" />
      <SubstitutesSection
        players={players}
        substitutes={localEntry.substitutes}
        currentStarterNames={currentStarterNames}
        readOnly={lineupLocked}
        onAdd={(s) =>
          updateLocal((prev) => ({
            substitutes: computeArchiveAddSubstitute({ names: prev.names, substitutes: prev.substitutes }, prev.formationName, s),
          }))
        }
        onRemove={(s) => updateLocal((prev) => ({ substitutes: prev.substitutes.filter((x) => x.id !== s.id) }))}
      />

      <div className="spacer-12" />
      {!fullyLocked &&
        (localEntry.closed ? (
          <button className="btn-outline" onClick={() => updateLocal({ closed: false })}>
            {t("detail.reopenLineup")}
          </button>
        ) : (
          <>
            <button className="btn" onClick={onBack}>
              {t("detail.saveLineup")}
            </button>
            <div className="spacer-8" />
            <button
              className="btn-outline"
              onClick={() => {
                updateLocal({ closed: true });
                // Docházka se při uzavření zápasu založí sama (ze SOUČASNÉ sestavy/náhradníků) –
                // uživatel už ji nemusí předtím ručně zakládat tlačítkem "Zapsat docházku".
                if (!attendanceRecord) onAddAttendanceRecord(createAttendanceRecord());
              }}
            >
              {t("detail.closeMatch")}
            </button>
          </>
        ))}

      {showClearConfirm && (
        <Dialog
          title={t("lineup.clearConfirmTitle")}
          onDismiss={() => setShowClearConfirm(false)}
          actions={
            <>
              <button className="btn-text" onClick={() => setShowClearConfirm(false)}>
                {t("common.cancel")}
              </button>
              <button
                className="btn"
                style={{ width: "auto", padding: "10px 20px", background: "var(--error)" }}
                onClick={() => {
                  updateLocal({ names: {}, substitutes: [] });
                  setShowClearConfirm(false);
                }}
              >
                {t("common.delete")}
              </button>
            </>
          }
        >
          <p>{t("detail.clearLineupBody")}</p>
        </Dialog>
      )}

      <div className="spacer-16" />
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {t("nav.attendance")}
      </p>
      <div className="spacer-8" />
      {!localEntry.closed && !attendanceRecord && !fullyLocked ? (
        <p className="text-gray" style={{ fontSize: "0.8rem" }}>
          {t("detail.attendanceAuto")}
        </p>
      ) : (
        <AttendanceInlineSection
          record={attendanceRecord}
          players={players}
          // Záměrně NE lineupLocked – docházka (kdo dorazil) se typicky odškrtává až PO uzavření
          // zápasu, takže closed sama o sobě nesmí docházku uzamknout, jinak by se nedala vyplnit.
          readOnly={fullyLocked}
          onCreate={() => onAddAttendanceRecord(createAttendanceRecord())}
          onUpdate={onUpdateAttendanceRecord}
        />
      )}

      <div className="spacer-12" />
      <p className="text-bold" style={{ fontSize: "0.9rem" }}>
        {t("detail.notes")}
      </p>
      <div className="spacer-8" />
      <textarea
        className="input"
        style={{ height: 140, resize: "vertical" }}
        placeholder={t("detail.notesPlaceholder")}
        value={localEntry.notes}
        readOnly={fullyLocked}
        onChange={(e) => updateLocal({ notes: e.target.value })}
      />

      <div className="spacer-12" />
      <PhotoGallery teamCode={teamCode} entry={localEntry} onUpdateEntry={setLocalEntry} readOnly={fullyLocked} />

      <div className="spacer-12" />
      <PlayerStatsSection entry={localEntry} onUpdateEntry={setLocalEntry} readOnly={fullyLocked} />

      {!fullyLocked && !localEntry.closed && (Object.keys(localEntry.names).length > 0 || localEntry.substitutes.length > 0) && (
        <>
          <div className="spacer-16" />
          <button className="btn-outline danger" onClick={() => setShowClearConfirm(true)}>
            {t("lineup.clear")}
          </button>
        </>
      )}

      {showDeleteConfirm && (
        <Dialog
          title={t("detail.deleteMatchTitle")}
          onDismiss={() => setShowDeleteConfirm(false)}
          actions={
            <>
              <button className="btn-text" onClick={() => setShowDeleteConfirm(false)}>
                {t("common.cancel")}
              </button>
              <button className="btn" style={{ width: "auto", padding: "10px 20px", background: "var(--error)" }} onClick={onDeleteEntry}>
                {t("common.delete")}
              </button>
            </>
          }
        >
          <p>{tf("detail.deleteMatchBody", { opponent: localEntry.opponent, date: localEntry.date })}</p>
        </Dialog>
      )}
    </div>
  );
}
