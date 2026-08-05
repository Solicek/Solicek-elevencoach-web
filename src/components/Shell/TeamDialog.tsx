import { Dialog } from "./Dialog";
import { shareText } from "../../lib/share";

interface Props {
  teamCode: string;
  teamName: string;
  onDismiss: () => void;
  onLeaveTeam: () => void;
}

export function TeamDialog({ teamCode, teamName, onDismiss, onLeaveTeam }: Props) {
  return (
    <Dialog
      title={teamName || "Kód týmu"}
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text danger" onClick={onLeaveTeam}>
            Opustit tým
          </button>
          <button className="btn-text" onClick={onDismiss}>
            Zavřít
          </button>
        </>
      }
    >
      <p className="text-gray" style={{ fontSize: "0.85rem" }}>
        Tenhle kód pošli druhému trenérovi, ať se připojí ke stejným datům:
      </p>
      <div className="spacer-12" />
      <p className="text-bold" style={{ fontSize: "1.8rem", textAlign: "center" }}>
        {teamCode}
      </p>
      <div className="spacer-12" />
      <button
        className="btn-outline"
        onClick={() => {
          const teamLabel = teamName ? ` k týmu "${teamName}"` : "";
          shareText(`Kód pro připojení${teamLabel} v appce: ${teamCode}`, "Sdílet kód týmu");
        }}
      >
        Sdílet kód
      </button>
    </Dialog>
  );
}
