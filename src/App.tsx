import { useEffect, useState } from "react";
import { ensureSignedIn } from "./firebase";
import { loadTeamCode, saveTeamCode } from "./lib/localTeamCode";
import { TeamGateScreen } from "./components/TeamGate/TeamGateScreen";
import { AppShell } from "./components/Shell/AppShell";
import { PlayersTab } from "./components/Roster/PlayersTab";
import { PitchTab } from "./components/Lineup/PitchTab";
import { ArchiveTab } from "./components/Archive/ArchiveTab";
import { AttendanceTab } from "./components/Attendance/AttendanceTab";
import { TrainingsTab } from "./components/Trainings/TrainingsTab";
import { TacticsTab } from "./components/Tactics/TacticsTab";
import { InstallHint } from "./components/Shell/InstallHint";
import { useTeamData } from "./hooks/useTeamData";
import * as repo from "./repository/teamRepository";
import { computeAssignment, computeClearLineup, computeUnassign } from "./lib/assignment";
import type { Player, PlayerPosition } from "./types";

function App() {
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [teamCode, setTeamCode] = useState<string | null>(() => loadTeamCode());

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
          onTeamReady={(code) => {
            saveTeamCode(code);
            setTeamCode(code);
          }}
        />
        <InstallHint />
      </>
    );
  }

  return (
    <>
      <MainApp teamCode={teamCode} onLeaveTeam={() => setTeamCode(null)} />
      <InstallHint />
    </>
  );
}

function MainApp({ teamCode, onLeaveTeam }: { teamCode: string; onLeaveTeam: () => void }) {
  const data = useTeamData(teamCode);

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
      onLeaveTeam={onLeaveTeam}
      tabs={[
        {
          label: "Sestava",
          content: (
            <PitchTab
              formationName={data.formationName}
              names={data.names}
              players={data.players}
              substitutes={data.substitutes}
              onFormationChange={data.setFormationName}
              onAssignPlayer={handleAssignPlayer}
              onUnassignSlot={handleUnassignSlot}
              onCreatePlayer={handleCreatePlayer}
              onAddSubstitute={(s) => data.setSubstitutes([...data.substitutes, s])}
              onRemoveSubstitute={(s) => data.setSubstitutes(data.substitutes.filter((x) => x.id !== s.id))}
              onSaveToArchive={(entry) => repo.addArchiveEntry(teamCode, entry)}
              onClearLineup={handleClearLineup}
            />
          ),
        },
        {
          label: "Soupiska",
          content: (
            <PlayersTab
              players={data.players}
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
          content: <TacticsTab formationName={data.formationName} names={data.names} />,
        },
        {
          label: "Historie",
          content: (
            <ArchiveTab
              teamCode={teamCode}
              archive={data.archive}
              currentFormationName={data.formationName}
              currentNames={data.names}
              currentSubstitutes={data.substitutes}
              onAddEntry={(entry) => repo.addArchiveEntry(teamCode, entry)}
              onUpdateEntry={(entry) => repo.updateArchiveEntry(teamCode, entry)}
              onDeleteEntry={(entry) => repo.deleteArchiveEntry(teamCode, entry)}
            />
          ),
        },
        {
          label: "Docházka",
          content: (
            <AttendanceTab
              players={data.players}
              attendance={data.attendance}
              onAddRecord={(record) => repo.addAttendanceRecord(teamCode, record)}
              onUpdateRecord={(record) => repo.updateAttendanceRecord(teamCode, record)}
              onDeleteRecord={(record) => repo.deleteAttendanceRecord(teamCode, record)}
            />
          ),
        },
        {
          label: "Tréninky",
          content: (
            <TrainingsTab
              trainings={data.trainings}
              players={data.players}
              attendance={data.attendance}
              customDrills={data.customDrills}
              templates={data.trainingTemplates}
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
      ]}
    />
  );
}

export default App;
