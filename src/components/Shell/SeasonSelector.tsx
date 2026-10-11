import { seasonLabel } from "../../lib/season";
import { t } from "../../lib/i18n";

interface Props {
  /** Sezóny k výběru (rok začátku), od nejnovější. */
  seasons: number[];
  /** Vybraná sezóna; `null` = "Vše" (napříč sezónami). */
  selected: number | null;
  onSelect: (startYear: number | null) => void;
}

/**
 * Přepínač sezón nad statistikami. Sezóna se odvozuje z data (viz lib/season.ts), takže tohle
 * je jen filtr nad daty, která už v archivu jsou – nic se nikam nepřesouvá.
 *
 * U týmu s jedinou sezónou se nevykresluje, aby zbytečně nezabíral místo.
 */
export function SeasonSelector({ seasons, selected, onSelect }: Props) {
  if (seasons.length < 2) return null;
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 8px" }}>
      {seasons.map((startYear) => (
        <button
          key={startYear}
          className={`chip ${startYear === selected ? "selected" : ""}`}
          onClick={() => onSelect(startYear)}
        >
          {seasonLabel(startYear)}
        </button>
      ))}
      <button className={`chip ${selected === null ? "selected" : ""}`} onClick={() => onSelect(null)}>
        {t("season.all")}
      </button>
    </div>
  );
}
