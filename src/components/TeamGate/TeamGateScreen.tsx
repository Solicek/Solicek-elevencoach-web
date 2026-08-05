import { useState } from "react";
import { createTeam, getTeamName } from "../../repository/teamRepository";

interface Props {
  onTeamReady: (code: string) => void;
}

export function TeamGateScreen({ onTeamReady }: Props) {
  const [newTeamName, setNewTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingJoin, setPendingJoin] = useState<{ code: string; teamName: string } | null>(null);

  async function handleCreate() {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const code = await createTeam(newTeamName.trim());
      onTeamReady(code);
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
      const teamName = await getTeamName(joinCode.trim());
      if (teamName != null) {
        setPendingJoin({ code: joinCode.trim(), teamName });
      } else {
        setErrorMessage("Tým s tímto kódem neexistuje.");
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
                ? `Chystáš se připojit k týmu "${pendingJoin.teamName}" (kód ${pendingJoin.code}).`
                : `Tým s kódem ${pendingJoin.code} nemá vyplněný název. Opravdu se chceš připojit?`}
            </p>
            <div className="dialog-actions">
              <button className="btn-text" onClick={() => setPendingJoin(null)}>
                Zrušit
              </button>
              <button
                className="btn"
                style={{ width: "auto", padding: "10px 20px" }}
                onClick={() => {
                  const code = pendingJoin.code;
                  setPendingJoin(null);
                  onTeamReady(code);
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
