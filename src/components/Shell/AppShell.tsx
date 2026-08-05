import { useState, type ReactNode } from "react";
import { clearTeamCode } from "../../lib/localTeamCode";
import { TeamDialog } from "./TeamDialog";
import { buildExportText, renderLineupImage } from "../../lib/exportLineup";
import { shareFile, shareText } from "../../lib/share";
import type { Substitute } from "../../types";

interface Tab {
  label: string;
  content: ReactNode;
}

interface Props {
  teamCode: string;
  teamName: string;
  formationName: string;
  names: Record<string, string>;
  substitutes: Substitute[];
  tabs: Tab[];
  onLeaveTeam: () => void;
}

export function AppShell({ teamCode, teamName, formationName, names, substitutes, tabs, onLeaveTeam }: Props) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [showTeamDialog, setShowTeamDialog] = useState(false);

  async function handleShareImage() {
    const blob = await renderLineupImage(formationName, names, substitutes);
    const file = new File([blob], "sestava.png", { type: "image/png" });
    await shareFile(file, "Sestava");
  }

  async function handleShareText() {
    await shareText(buildExportText(formationName, names, substitutes), "Sestava");
  }

  return (
    <div>
      <div className="top-bar">
        <h1 style={{ fontSize: "1.3rem" }}>{teamName || "…"}</h1>
        <div className="top-bar-actions">
          <button className="btn-text" onClick={() => setShowTeamDialog(true)}>
            Tým
          </button>
          <button className="btn-text" onClick={handleShareImage}>
            Obrázek
          </button>
          <button className="btn-text" onClick={handleShareText}>
            Sdílet
          </button>
        </div>
      </div>
      <div className="tab-bar">
        {tabs.map((tab, i) => (
          <button key={tab.label} className={`tab ${i === selectedTab ? "active" : ""}`} onClick={() => setSelectedTab(i)}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="screen" style={{ maxWidth: 720 }}>
        {tabs[selectedTab]?.content}
      </div>

      {showTeamDialog && (
        <TeamDialog
          teamCode={teamCode}
          teamName={teamName}
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
