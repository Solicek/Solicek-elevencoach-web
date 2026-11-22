import { seasonLabel } from "../../lib/season";

interface Props {
  /** Sezóny k výběru (rok začátku), od nejnovější. */
  seasons: number[];
  /**
   * Vybraná sezóna. `null` znamená jen "sezóna se nedá určit" (data bez platného data) –
   * jako volba se nenabízí, statistika je vždy za jednu sezónu.
   */
  selected: number | null;
  onSelect: (startYear: number) => void;
}

/**
 * Přepínač sezón nad statistikami. Sezóna se odvozuje z data (viz lib/season.ts), takže tohle
 * je jen filtr nad daty, která už v archivu jsou – nic se nikam nepřesouvá.
 *
 * Volba "napříč sezónami" tu schválně NENÍ: každá sezóna má svou statistiku a sčítat ročníky
 * dohromady nedává v amatérské kopané smysl (jiná soutěž, jiná soupiska). Zápas se starým
 * soupeřem se dohledá hledáním v Zápisech, které jde přes všechny sezóny.
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
    </div>
  );
}
