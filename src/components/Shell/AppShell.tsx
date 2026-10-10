import { useState, type ReactNode } from "react";
import { clearTeamCode } from "../../lib/localTeamCode";
import { TeamDialog } from "./TeamDialog";
import { Dialog } from "./Dialog";
import { MoreIcon, PictureIcon, ShareIcon, TeamCardIcon } from "./icons";
import { buildExportText, renderLineupImage } from "../../lib/exportLineup";
import { shareFile, shareText } from "../../lib/share";
import { t } from "../../lib/i18n";
import type { Substitute } from "../../types";

interface Tab {
  label: string;
  content: ReactNode;
  icon: ReactNode;
  primary: boolean;
}

interface Props {
  teamCode: string;
  teamName: string;
  formationName: string;
  names: Record<string, string>;
  substitutes: Substitute[];
  tabs: Tab[];
  isReadOnly: boolean;
  onLeaveTeam: () => void;
}

export function AppShell({ teamCode, teamName, formationName, names, substitutes, tabs, isReadOnly, onLeaveTeam }: Props) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const primaryEntries = tabs.map((tab, i) => ({ tab, i })).filter((e) => e.tab.primary);
  const moreEntries = tabs.map((tab, i) => ({ tab, i })).filter((e) => !e.tab.primary);
  const isMoreActive = moreEntries.some((e) => e.i === selectedTab);

  async function handleShareImage() {
    const blob = await renderLineupImage(formationName, names, substitutes);
    const file = new File([blob], "sestava.png", { type: "image/png" });
    await shareFile(file, t("nav.lineup"));
  }

  async function handleShareText() {
    await shareText(buildExportText(formationName, names, substitutes), t("nav.lineup"));
  }

  return (
    <div>
      <div className="top-bar">
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="top-bar-title">{teamName || "…"}</h1>
          {isReadOnly && (
            <p className="text-gray" style={{ fontSize: "0.7rem", fontWeight: 700 }}>
              {t("shell.captainBadge")}
            </p>
          )}
        </div>
        <div className="top-bar-actions">
          <button className="icon-btn" onClick={() => setShowTeamDialog(true)} title={t("shell.team")} aria-label={t("shell.team")}>
            <TeamCardIcon />
          </button>
          <button className="icon-btn" onClick={handleShareImage} title={t("shell.image")} aria-label={t("shell.image")}>
            <PictureIcon />
          </button>
          <button className="icon-btn" onClick={handleShareText} title={t("shell.share")} aria-label={t("shell.share")}>
            <ShareIcon />
          </button>
        </div>
      </div>
      <div className="screen" style={{ maxWidth: 720, paddingBottom: "calc(var(--bottom-nav-h) + 24px)" }}>
        {tabs[selectedTab]?.content}
      </div>

      <div className="bottom-nav">
        {primaryEntries.map(({ tab, i }) => (
          <button
            key={tab.label}
            className={`bottom-nav-item ${i === selectedTab ? "active" : ""}`}
            onClick={() => setSelectedTab(i)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
        {moreEntries.length > 0 && (
          <button className={`bottom-nav-item ${isMoreActive ? "active" : ""}`} onClick={() => setShowMoreMenu(true)}>
            <MoreIcon />
            <span>{t("nav.more")}</span>
          </button>
        )}
      </div>

      {showMoreMenu && (
        <Dialog
          title={t("nav.more")}
          onDismiss={() => setShowMoreMenu(false)}
          actions={
            <button className="btn-text" onClick={() => setShowMoreMenu(false)}>
              {t("common.close")}
            </button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {moreEntries.map(({ tab, i }) => (
              <button
                key={tab.label}
                className={`more-menu-item ${i === selectedTab ? "active" : ""}`}
                onClick={() => {
                  setSelectedTab(i);
                  setShowMoreMenu(false);
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </Dialog>
      )}

      {showTeamDialog && (
        <TeamDialog
          teamCode={teamCode}
          teamName={teamName}
          isReadOnly={isReadOnly}
          onDismiss={() => setShowTeamDialog(false)}
          onLeaveTeam={() => {
            setShowTeamDialog(false);
            clearTeamCode();
            onLeaveTeam();
          }}
        />
      )}
    </div>
  );
}
