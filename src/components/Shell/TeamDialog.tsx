import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";
import { shareText } from "../../lib/share";
import { getOrCreateViewerCode } from "../../repository/teamRepository";

interface Props {
  teamCode: string;
  teamName: string;
  isReadOnly: boolean;
  onDismiss: () => void;
  onLeaveTeam: () => void;
}

export function TeamDialog({ teamCode, teamName, isReadOnly, onDismiss, onLeaveTeam }: Props) {
  const [viewerCode, setViewerCode] = useState<string | null>(null);

  useEffect(() => {
    if (isReadOnly) return;
    let cancelled = false;
    getOrCreateViewerCode(teamCode).then((code) => {
      if (!cancelled) setViewerCode(code);
    });
    return () => {
      cancelled = true;
    };
  }, [teamCode, isReadOnly]);

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
      {isReadOnly ? (
        <>
          <p className="text-gray" style={{ fontSize: "0.85rem" }}>
            👁 Jsi přihlášený jako kapitán – appka je jen pro prohlížení, nic v ní nejde upravovat.
          </p>
        </>
      ) : (
        <>
          <p className="text-gray" style={{ fontSize: "0.85rem" }}>
            Tenhle kód pošli druhému trenérovi, ať se připojí ke stejným datům s plným přístupem:
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

          <div className="spacer-24" />
          <p className="text-gray" style={{ fontSize: "0.85rem" }}>
            Tenhle kód pošli kapitánovi nebo komukoliv, kdo má vidět sestavu a docházku, ale nic upravovat:
          </p>
          <div className="spacer-12" />
          <p className="text-bold" style={{ fontSize: "1.8rem", textAlign: "center" }}>
            {viewerCode ?? "…"}
          </p>
          <div className="spacer-12" />
          <button
            className="btn-outline"
            disabled={!viewerCode}
            onClick={() => {
              const teamLabel = teamName ? ` k týmu "${teamName}"` : "";
              shareText(`Kód pro kapitána (jen prohlížení)${teamLabel} v appce: ${viewerCode}`, "Sdílet kapitánský kód");
            }}
          >
            Sdílet kód pro kapitána
          </button>
        </>
      )}
    </Dialog>
  );
}
