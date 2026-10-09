import { useState } from "react";
import { createTeam, resolveTeamAccess, type TeamAccess } from "../../repository/teamRepository";

interface Props {
  onTeamReady: (code: string, isReadOnly: boolean) => void;
}

export function TeamGateScreen({ onTeamReady }: Props) {
  const [newTeamName, setNewTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingJoin, setPendingJoin] = useState<TeamAccess | null>(null);

  async function handleCreate() {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const code = await createTeam(newTeamName.trim());
      onTeamReady(code, false);
    } catch (e) {
      setErrorMessage(`Založení týmu se nepovedlo: ${String(e)}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoin() {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const access = await resolveTeamAccess(joinCode.trim());
      if (access != null) {
        setPendingJoin(access);
      } else {
        setErrorMessage("Kód nenalezen – zkontroluj, že jsi ho opsal správně.");
      }
    } catch (e) {
      setErrorMessage(`Připojení se nepovedlo: ${String(e)}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100dvh" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Sestava</h1>
      <div className="spacer-8" />
      <p className="text-gray">Založ nový tým, nebo se připoj ke kódu, který ti poslal druhý trenér.</p>
      <div className="spacer-32" />

      <label className="field-label">Název týmu</label>
      <input className="input" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
      <div className="spacer-12" />
      <button className="btn" disabled={isLoading || !newTeamName.trim()} onClick={handleCreate}>
        Založit nový tým
      </button>

      <div className="spacer-24" />
      <p className="text-gray" style={{ textAlign: "center", fontSize: "0.85rem" }}>
        nebo
      </p>
      <div className="spacer-24" />

      <label className="field-label">Kód týmu</label>
      <input
        className="input"
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
      />
      <div className="spacer-12" />
      <button className="btn" disabled={isLoading || !joinCode.trim()} onClick={handleJoin}>
        Připojit se kódem
      </button>

      {isLoading && (
        <>
          <div className="spacer-24" />
          <div className="spinner" />
        </>
      )}
      {errorMessage && (
        <>
          <div className="spacer-16" />
          <p className="text-error" style={{ fontSize: "0.85rem" }}>
            {errorMessage}
          </p>
        </>
      )}

      {pendingJoin && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Připojit se k týmu?</h2>
            <p>
              {pendingJoin.teamName
                ? `Chystáš se připojit k týmu "${pendingJoin.teamName}".`
                : `Tým s tímto kódem nemá vyplněný název. Opravdu se chceš připojit?`}
            </p>
            {pendingJoin.isReadOnly && (
              <p className="text-gray" style={{ fontSize: "0.85rem", marginTop: 8 }}>
                👁 Tohle je kapitánský kód – appka se otevře jen pro prohlížení, bez možnosti cokoliv upravovat.
              </p>
            )}
            <div className="dialog-actions">
              <button className="btn-text" onClick={() => setPendingJoin(null)}>
                Zrušit
              </button>
              <button
                className="btn"
                style={{ width: "auto", padding: "10px 20px" }}
                onClick={() => {
                  const { teamCode, isReadOnly } = pendingJoin;
                  setPendingJoin(null);
                  onTeamReady(teamCode, isReadOnly);
                }}
              >
                Připojit se
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
