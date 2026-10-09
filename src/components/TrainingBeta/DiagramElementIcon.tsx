import { useId } from "react";
import { DiagramElementType } from "../../types";
import playerIconSrc from "../../assets/player-icon.png";
import goalIconSrc from "../../assets/goal-icon.png";

interface Props {
  type: string;
  color?: string;
  size?: number;
}

/** Jeden zdroj pravdy pro vzhled prvku nákresu – používá ho paleta, prvek na plátně i náhled. */
export function DiagramElementIcon({ type, color, size = 28 }: Props) {
  const coneClipId = useId();
  switch (type) {
    case DiagramElementType.PLAYER_RED:
      return <PlayerFigure size={size} />;
    case DiagramElementType.PLAYER_BLACK:
      return <PlayerFigure size={size} grayscale />;
    case DiagramElementType.GOALKEEPER:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="3.2" fill="#FDD835" />
          <path d="M6 21l1.5-9h9L18 21z" fill="#FDD835" />
          <line x1="7" y1="21" x2="17" y2="21" stroke="#5d4a00" strokeWidth="1.2" />
        </svg>
      );
    case DiagramElementType.SLALOM_POLE:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <ellipse cx="12" cy="20.5" rx="3.5" ry="1.3" fill="rgba(0,0,0,0.3)" />
          <ellipse cx="12" cy="20.2" rx="3.5" ry="1.3" fill={color ?? "#D84315"} />
          <line x1="12" y1="20" x2="12" y2="3.5" stroke={color ?? "#D84315"} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="3.5" r="1.6" fill={color ?? "#D84315"} />
        </svg>
      );
    case DiagramElementType.CONE:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <defs>
            <clipPath id={coneClipId}>
              <path d="M12 3l5 15H7z" />
            </clipPath>
          </defs>
          <path d="M12 3l5 15H7z" fill="#FB8C00" stroke="rgba(0,0,0,0.35)" strokeWidth="0.5" />
          <rect x="5" y="12.5" width="14" height="3" fill="#ffffff" clipPath={`url(#${coneClipId})`} />
          <rect x="5" y="18" width="14" height="3" rx="1" fill="#FB8C00" />
        </svg>
      );
    case DiagramElementType.GOAL_MINI:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 20V8h16v12" />
          <line x1="4" y1="8" x2="4" y2="20" />
          <line x1="20" y1="8" x2="20" y2="20" />
          <line x1="8" y1="8" x2="8" y2="16" />
          <line x1="16" y1="8" x2="16" y2="16" />
        </svg>
      );
    case DiagramElementType.GOAL_FULL:
      // Ikona branky – bitmapa dodaná uživatelem (skutečná fotka/kresba branky), zmenšená
      // na rozumnou velikost pro umístění do nákresu; otáčení řeší (stejně jako dřív)
      // vnější wrapper v editoru, tady se to ničím neliší od ostatních prvků.
      return (
        <img
          src={goalIconSrc}
          alt=""
          style={{
            width: size,
            height: size,
            objectFit: "contain",
          }}
        />
      );
    case DiagramElementType.BALL:
      // Míč se kreslí v polovičním rozměru oproti ostatním prvkům – v reálném poměru
      // velikostí na hřišti je nápadně menší než hráč/kužel/branka.
      return (
        <svg width={size / 2} height={size / 2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="#f5f5f5" stroke="#333" strokeWidth="1.2" />
          <path
            d="M12 7l3.5 2.5-1.3 4.1H9.8L8.5 9.5z M12 7V4M15.5 9.5l2.7-1.6M13.7 13.6l1.6 2.9M8.5 9.5L5.8 7.9M10.3 13.6l-1.6 2.9"
            fill="none"
            stroke="#333"
            strokeWidth="1"
          />
        </svg>
      );
    default:
      return null;
  }
}

/** Ikona hráče – bitmapa dodaná uživatelem (driblující postava s míčem); pro druhý tým
    se stejný obrázek jen odbarví/ztmaví filtrem, ať nemusíme mít dvě samostatné varianty. */
function PlayerFigure({ size, grayscale }: { size: number; grayscale?: boolean }) {
  return (
    <img
      src={playerIconSrc}
      alt=""
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        filter: grayscale ? "grayscale(1) brightness(0.55)" : undefined,
      }}
    />
  );
}
