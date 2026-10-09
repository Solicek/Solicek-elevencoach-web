import { Dialog } from "../Shell/Dialog";

interface Source {
  name: string;
  url: string;
  description: string;
}

const sources: Source[] = [
  {
    name: "CoachTruly",
    url: "https://coachtruly.com/drill-database/football",
    description: "320 cvičení zdarma bez registrace – řazeno podle témat (přihrávky, střelba, obrana, herní situace).",
  },
  {
    name: "iCoachFootball",
    url: "https://www.icoachfootball.net/",
    description: "Cvičení zdarma bez registrace, rozdělená podle věkových kategorií od nejmenších po dospělé.",
  },
  {
    name: "Sportplan",
    url: "https://www.sportplan.net/drills/Football/index.jsp",
    description: "Přes 550 cvičení s videi a animacemi – plná knihovna vyžaduje bezplatnou registraci.",
  },
];

interface Props {
  onDismiss: () => void;
}

/** Odkazy na ověřené externí weby s hotovými fotbalovými tréninkovými cvičeními k inspiraci. */
export function DrillSourcesDialog({ onDismiss }: Props) {
  return (
    <Dialog
      title="Zdroje cvičení online"
      onDismiss={onDismiss}
      actions={
        <button className="btn-text" onClick={onDismiss}>
          Zavřít
        </button>
      }
    >
      <p className="text-gray" style={{ fontSize: "0.8rem" }}>
        Vyzkoušené weby s hotovými tréninkovými cvičeními. Co se ti bude líbit, si pak přidej jako vlastní cvičení tady v appce.
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
                {source.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </Dialog>
  );
}
