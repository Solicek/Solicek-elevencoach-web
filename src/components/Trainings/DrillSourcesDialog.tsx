import { Dialog } from "../Shell/Dialog";
import { t, type StringKey } from "../../lib/i18n";

interface Source {
  name: string;
  url: string;
  descriptionKey: StringKey;
}

const sources: Source[] = [
  {
    name: "CoachTruly",
    url: "https://coachtruly.com/drill-database/football",
    descriptionKey: "tr.sourceCoachTruly",
  },
  {
    name: "iCoachFootball",
    url: "https://www.icoachfootball.net/",
    descriptionKey: "tr.sourceICoach",
  },
  {
    name: "Sportplan",
    url: "https://www.sportplan.net/drills/Football/index.jsp",
    descriptionKey: "tr.sourceSportplan",
  },
];

interface Props {
  onDismiss: () => void;
}

/** Odkazy na ověřené externí weby s hotovými fotbalovými tréninkovými cvičeními k inspiraci. */
export function DrillSourcesDialog({ onDismiss }: Props) {
  return (
    <Dialog
      title={t("tr.sourcesTitle")}
      onDismiss={onDismiss}
      actions={
        <button className="btn-text" onClick={onDismiss}>
          {t("common.close")}
        </button>
      }
    >
      <p className="text-gray" style={{ fontSize: "0.8rem" }}>
        {t("tr.sourcesHint")}
      </p>
      <div className="spacer-12" />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="list-row"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div>
              <p className="text-bold" style={{ color: "var(--primary)" }}>
                {source.name} ↗
              </p>
              <p className="text-gray" style={{ fontSize: "0.8rem" }}>
                {t(source.descriptionKey)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </Dialog>
  );
}
