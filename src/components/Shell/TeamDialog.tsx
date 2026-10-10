import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";
import { shareText } from "../../lib/share";
import { getOrCreateViewerCode } from "../../repository/teamRepository";
import { t, tf } from "../../lib/i18n";

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
      title={teamName || t("gate.teamCode")}
      onDismiss={onDismiss}
      actions={
        <>
          <button className="btn-text danger" onClick={onLeaveTeam}>
            {t("team.leave")}
          </button>
          <button className="btn-text" onClick={onDismiss}>
            {t("common.close")}
          </button>
        </>
      }
    >
      {isReadOnly ? (
        <>
          <p className="text-gray" style={{ fontSize: "0.85rem" }}>
            {t("team.captainNote")}
          </p>
        </>
      ) : (
        <>
          <p className="text-gray" style={{ fontSize: "0.85rem" }}>
            {t("team.coachCodeHint")}
          </p>
          <div className="spacer-12" />
          <p className="text-bold" style={{ fontSize: "1.8rem", textAlign: "center" }}>
            {teamCode}
          </p>
          <div className="spacer-12" />
          <button
            className="btn-outline"
            onClick={() => {
              const teamLabel = teamName ? tf("team.toTeam", { name: teamName }) : "";
              shareText(tf("team.shareCodeText", { team: teamLabel, code: teamCode }), t("team.shareCodeTitle"));
            }}
          >
            {t("team.shareCode")}
          </button>

          <div className="spacer-24" />
          <p className="text-gray" style={{ fontSize: "0.85rem" }}>
            {t("team.viewerCodeHint")}
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
              const teamLabel = teamName ? tf("team.toTeam", { name: teamName }) : "";
              shareText(
                tf("team.shareViewerCodeText", { team: teamLabel, code: viewerCode ?? "" }),
                t("team.shareViewerCodeTitle")
              );
            }}
          >
            {t("team.shareViewerCode")}
          </button>
        </>
      )}
    </Dialog>
  );
}
