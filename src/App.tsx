import { useEffect, useMemo, useState } from "react";
import { ensureSignedIn } from "./firebase";
import { loadReadOnly, loadTeamCode, saveTeamCode } from "./lib/localTeamCode";
import { TeamGateScreen } from "./components/TeamGate/TeamGateScreen";
import { AppShell } from "./components/Shell/AppShell";
import { PlayersTab } from "./components/Roster/PlayersTab";
import { PitchTab } from "./components/Lineup/PitchTab";
import { ArchiveTab } from "./components/Archive/ArchiveTab";
import { AttendanceTab } from "./components/Attendance/AttendanceTab";
import { TrainingsTab } from "./components/Trainings/TrainingsTab";
import { TrainingBetaTab } from "./components/TrainingBeta/TrainingBetaTab";
import { TacticsTab } from "./components/Tactics/TacticsTab";
import { FinesTab } from "./components/Fines/FinesTab";
import { CalendarTab } from "./components/Calendar/CalendarTab";
import { InstallHint } from "./components/Shell/InstallHint";
import {
  AttendanceIcon,
  CalendarIcon,
  FinesIcon,
  PitchIcon,
  RosterIcon,
  TacticsIcon,
  TrainingIcon,
  TrophyIcon,
} from "./components/Shell/icons";
import { useTeamData } from "./hooks/useTeamData";
import * as repo from "./repository/teamRepository";
import { computeAddSubstitute, computeAssignment, computeClearLineup, computeFormationChange, computeUnassign } from "./lib/assignment";
import { finePaymentId } from "./lib/fines";
import { compareDateStrings, todayDateString } from "./lib/dateUtils";
import { matchTitle } from "./lib/matchTitle";
import type { Player, PlayerPosition } from "./types";

function App() {
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [teamCode, setTeamCode] = useState<string | null>(() => loadTeamCode());
  const [isReadOnly, setIsReadOnly] = useState<boolean>(() => loadReadOnly());

  useEffect(() => {
    ensureSignedIn()
      .then(() => setAuthReady(true))
      .catch((err) => setAuthError(String(err)));
  }, []);

  if (authError) {
    return (
      <div className="screen">
        <p className="text-error">Chyba přihlášení: {authError}</p>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="screen" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!teamCode) {
    return (
      <>
        <TeamGateScreen
          onTeamReady={(code, readOnly) => {
            saveTeamCode(code, readOnly);
            setIsReadOnly(readOnly);
            setTeamCode(code);
          }}
        />
        <InstallHint />
      </>
    );
  }

  return (
    <>
      <MainApp teamCode={teamCode} isReadOnly={isReadOnly} onLeaveTeam={() => setTeamCode(null)} />
      <InstallHint />
    </>
  );
}

function MainApp({ teamCode, isReadOnly, onLeaveTeam }: { teamCode: string; isReadOnly: boolean; onLeaveTeam: () => void }) {
  const data = useTeamData(teamCode);

  // Taktika kreslí přes sestavu nejbližšího nadcházejícího (ještě neuzavřeného) zápasu z
  // kalendáře, ať trenér může připravovat tah na konkrétní zápas dopředu. Jakmile se ten
  // zápas uzavře, přestane vyhovovat filtru a Taktika se sama vrátí k živé sestavě (fallback
  // níže) – žádný ruční "reset" není potřeba.
  const nextUpcomingMatch = useMemo(() => {
    const today = todayDateString();
    return (
      data.archive
        .filter((entry) => !entry.closed && compareDateStrings(entry.date, today) >= 0)
        .sort((a, b) => compareDateStrings(a.date, b.date))[0] ?? null
    );
  }, [data.archive]);

  function handleAssignPlayer(player: Player, pos: PlayerPosition) {
    const result = computeAssignment(data.players, data.names, data.substitutes, player, pos, data.formationName);
    result.changedPlayers.forEach((p) => repo.savePlayer(teamCode, p));
    data.setNames(result.newNames);
    data.setSubstitutes(result.newSubstitutes);
  }

  function handleUnassignSlot(key: string) {
    const result = computeUnassign(data.players, data.names, data.substitutes, key);
    result.changedPlayers.forEach((p) => repo.savePlayer(teamCode, p));
    data.setNames(result.newNames);
  }

  function handleClearLineup() {
    const result = computeClearLineup(data.players, data.names, data.formationName);
    result.changedPlayers.forEach((p) => repo.savePlayer(teamCode, p));
    data.setNames(result.newNames);
    data.setSubstitutes(result.newSubstitutes);
  }

  function handleFormationChange(newFormation: string) {
    const newSubstitutes = computeFormationChange(data.players, data.names, data.substitutes, data.formationName, newFormation);
    data.setSubstitutes(newSubstitutes);
    data.setFormationName(newFormation);
  }

  function handleCreatePlayer(name: string, pos: PlayerPosition) {
    const player: Player = {
      id: crypto.randomUUID(),
      name: name.trim(),
      preferredPositions: [pos.label],
      positionKey: null,
      positionDisplayName: null,
    };
    repo.savePlayer(teamCode, player);
    handleAssignPlayer(player, pos);
  }

  return (
    <AppShell
      teamCode={teamCode}
      teamName={data.teamName}
      formationName={data.formationName}
      names={data.names}
      substitutes={data.substitutes}
      isReadOnly={isReadOnly}
      onLeaveTeam={onLeaveTeam}
      tabs={[
        {
          label: "Sestava",
          icon: <PitchIcon />,
          primary: true,
          content: (
            <PitchTab
              formationName={data.formationName}
              names={data.names}
              players={data.players}
              substitutes={data.substitutes}
              readOnly={isReadOnly}
              onFormationChange={handleFormationChange}
              onAssignPlayer={handleAssignPlayer}
              onUnassignSlot={handleUnassignSlot}
              onCreatePlayer={handleCreatePlayer}
              onAddSubstitute={(s) => data.setSubstitutes(computeAddSubstitute(data.substitutes, data.names, data.formationName, s))}
              onRemoveSubstitute={(s) => data.setSubstitutes(data.substitutes.filter((x) => x.id !== s.id))}
              onClearLineup={handleClearLineup}
            />
          ),
        },
        {
          label: "Kalendář",
          icon: <CalendarIcon />,
          primary: true,
          content: (
            <CalendarTab
              teamCode={teamCode}
              archive={data.archive}
              trainings={data.trainings}
              teamName={data.teamName}
              players={data.players}
              attendance={data.attendance}
              currentFormationName={data.formationName}
              readOnly={isReadOnly}
              onAddMatch={(entry) => repo.addArchiveEntry(teamCode, entry)}
              onAddTraining={(session) => repo.addTrainingSession(teamCode, session)}
              onUpdateEntry={(entry) => repo.updateArchiveEntry(teamCode, entry)}
              onDeleteEntry={(entry) => repo.deleteArchiveEntry(teamCode, entry)}
              onAddAttendanceRecord={(record) => repo.addAttendanceRecord(teamCode, record)}
              onUpdateAttendanceRecord={(record) => repo.updateAttendanceRecord(teamCode, record)}
            />
          ),
        },
        {
          label: "Soupiska",
          icon: <RosterIcon />,
          primary: false,
          content: (
            <PlayersTab
              players={data.players}
              readOnly={isReadOnly}
              onAddPlayer={(player) => repo.savePlayer(teamCode, player)}
              onEditPlayer={(player) => {
                repo.savePlayer(teamCode, player);
                if (player.positionKey) {
                  data.setNames({ ...data.names, [player.positionKey]: player.name });
                }
              }}
              onRemovePlayer={(player) => {
                if (player.positionKey && data.names[player.positionKey] === player.name) {
                  const updated = { ...data.names };
                  delete updated[player.positionKey];
                  data.setNames(updated);
                }
                repo.deletePlayer(teamCode, player);
              }}
            />
          ),
        },
        {
          label: "Taktika",
          icon: <TacticsIcon />,
          primary: true,
          content: (
            <TacticsTab
              formationName={nextUpcomingMatch?.formationName ?? data.formationName}
              names={nextUpcomingMatch?.names ?? data.names}
              matchLabel={nextUpcomingMatch ? `${matchTitle(nextUpcomingMatch, data.teamName)} · ${nextUpcomingMatch.date}` : null}
            />
          ),
        },
        {
          label: "Historie",
          icon: <TrophyIcon />,
          primary: true,
          content: (
            <ArchiveTab
              teamCode={teamCode}
              teamName={data.teamName}
              archive={data.archive}
              players={data.players}
              attendance={data.attendance}
              readOnly={isReadOnly}
              onUpdateEntry={(entry) => repo.updateArchiveEntry(teamCode, entry)}
              onDeleteEntry={(entry) => repo.deleteArchiveEntry(teamCode, entry)}
              onAddAttendanceRecord={(record) => repo.addAttendanceRecord(teamCode, record)}
              onUpdateAttendanceRecord={(record) => repo.updateAttendanceRecord(teamCode, record)}
            />
          ),
        },
        {
          label: "Docházka",
          icon: <AttendanceIcon />,
          primary: false,
          content: (
            <AttendanceTab
              players={data.players}
              attendance={data.attendance}
              readOnly={isReadOnly}
              onUpdateRecord={(record) => repo.updateAttendanceRecord(teamCode, record)}
              onDeleteRecord={(record) => repo.deleteAttendanceRecord(teamCode, record)}
            />
          ),
        },
        {
          label: "Tréninky",
          icon: <TrainingIcon />,
          primary: false,
          content: (
            <TrainingsTab
              trainings={data.trainings}
              players={data.players}
              attendance={data.attendance}
              customDrills={data.customDrills}
              templates={data.trainingTemplates}
              readOnly={isReadOnly}
              onAddSession={(session) => repo.addTrainingSession(teamCode, session)}
              onUpdateSession={(session) => repo.updateTrainingSession(teamCode, session)}
              onDeleteSession={(session) => repo.deleteTrainingSession(teamCode, session)}
              onAddAttendanceRecord={(record) => repo.addAttendanceRecord(teamCode, record)}
              onUpdateAttendanceRecord={(record) => repo.updateAttendanceRecord(teamCode, record)}
              onAddCustomDrill={(drill) => repo.addCustomDrill(teamCode, drill)}
              onDeleteCustomDrill={(drill) => repo.deleteCustomDrill(teamCode, drill)}
              onAddTemplate={(template) => repo.addTrainingTemplate(teamCode, template)}
              onDeleteTemplate={(template) => repo.deleteTrainingTemplate(teamCode, template)}
            />
          ),
        },
        {
          label: "Trénink (beta)",
          icon: <TrainingIcon />,
          primary: false,
          content: (
            <TrainingBetaTab
              diagrams={data.trainingDiagrams}
              readOnly={isReadOnly}
              onAdd={(diagram) => repo.addTrainingDiagram(teamCode, diagram)}
              onUpdate={(diagram) => repo.updateTrainingDiagram(teamCode, diagram)}
              onDelete={(diagram) => repo.deleteTrainingDiagram(teamCode, diagram)}
            />
          ),
        },
        {
          label: "Pokuty",
          icon: <FinesIcon />,
          primary: false,
          content: (
            <FinesTab
              archive={data.archive}
              fineRates={data.fineRates}
              finePayments={data.finePayments}
              readOnly={isReadOnly}
              onSaveFineRates={(rates) => repo.saveFineRates(teamCode, rates)}
              onSetPaid={(matchId, playerName, paid) =>
                repo.setFinePaymentStatus(teamCode, finePaymentId(matchId, playerName), matchId, playerName, paid)
              }
            />
          ),
        },
      ]}
    />
  );
}

export default App;
