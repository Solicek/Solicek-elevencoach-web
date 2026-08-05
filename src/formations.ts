import type { PlayerPosition } from "./types";

/** Rovnoměrně rozmístěné x-souřadnice pro daný počet hráčů v řadě. Přepis Formations.kt. */
function rowX(count: number): number[] {
  switch (count) {
    case 1:
      return [0.5];
    case 2:
      return [0.32, 0.68];
    case 3:
      return [0.2, 0.5, 0.8];
    case 4:
      return [0.12, 0.37, 0.63, 0.88];
    case 5:
      return [0.08, 0.27, 0.5, 0.73, 0.92];
    default:
      return Array.from({ length: count }, (_, i) => (i + 1) / (count + 1));
  }
}

function row(count: number, y: number, label: string): PlayerPosition[] {
  return rowX(count).map((x, i) => ({ id: `${label}_${i}`, label, xPercent: x, yPercent: y }));
}

const brankar = (): PlayerPosition[] => row(1, 0.94, "B");

/** Pořadí musí odpovídat Android appce (pořadí v rozbalovacím seznamu). */
export const formations: Record<string, PlayerPosition[]> = {
  "4-4-2": [...brankar(), ...row(4, 0.76, "O"), ...row(4, 0.52, "Z"), ...row(2, 0.2, "U")],
  "4-3-3": [...brankar(), ...row(4, 0.76, "O"), ...row(3, 0.52, "Z"), ...row(3, 0.2, "U")],
  "3-5-2": [...brankar(), ...row(3, 0.78, "O"), ...row(5, 0.5, "Z"), ...row(2, 0.18, "U")],
  "3-5-1-1": [...brankar(), ...row(3, 0.8, "O"), ...row(5, 0.55, "Z"), ...row(1, 0.35, "OZ"), ...row(1, 0.15, "U")],
  "4-2-3-1": [...brankar(), ...row(4, 0.78, "O"), ...row(2, 0.6, "DZ"), ...row(3, 0.4, "OZ"), ...row(1, 0.15, "U")],
  "4-1-4-1": [...brankar(), ...row(4, 0.78, "O"), ...row(1, 0.6, "DZ"), ...row(4, 0.42, "Z"), ...row(1, 0.15, "U")],
  "5-3-2": [...brankar(), ...row(5, 0.76, "O"), ...row(3, 0.5, "Z"), ...row(2, 0.2, "U")],
  "3-4-3": [...brankar(), ...row(3, 0.78, "O"), ...row(4, 0.52, "Z"), ...row(3, 0.2, "U")],
  "4-4-1-1": [...brankar(), ...row(4, 0.78, "O"), ...row(4, 0.54, "Z"), ...row(1, 0.34, "OZ"), ...row(1, 0.15, "U")],
  "4-3-1-2": [...brankar(), ...row(4, 0.78, "O"), ...row(3, 0.56, "Z"), ...row(1, 0.38, "OZ"), ...row(2, 0.18, "U")],
  "4-5-1": [...brankar(), ...row(4, 0.78, "O"), ...row(5, 0.52, "Z"), ...row(1, 0.18, "U")],
  "5-4-1": [...brankar(), ...row(5, 0.78, "O"), ...row(4, 0.52, "Z"), ...row(1, 0.18, "U")],
  "4-2-4": [...brankar(), ...row(4, 0.78, "O"), ...row(2, 0.54, "Z"), ...row(4, 0.2, "U")],
  "3-4-2-1": [...brankar(), ...row(3, 0.8, "O"), ...row(4, 0.56, "Z"), ...row(2, 0.36, "OZ"), ...row(1, 0.15, "U")],
  "4-1-3-2": [...brankar(), ...row(4, 0.78, "O"), ...row(1, 0.6, "DZ"), ...row(3, 0.42, "Z"), ...row(2, 0.18, "U")],
  "4-4-2 diamant": [
    ...brankar(),
    ...row(4, 0.78, "O"),
    ...row(1, 0.62, "DZ"),
    ...row(2, 0.48, "Z"),
    ...row(1, 0.34, "OZ"),
    ...row(2, 0.15, "U"),
  ],
  "5-2-3": [...brankar(), ...row(5, 0.78, "O"), ...row(2, 0.52, "Z"), ...row(3, 0.2, "U")],
  "3-3-4": [...brankar(), ...row(3, 0.8, "O"), ...row(3, 0.54, "Z"), ...row(4, 0.2, "U")],
  "2-3-5 (historické)": [...brankar(), ...row(2, 0.8, "O"), ...row(3, 0.55, "Z"), ...row(5, 0.2, "U")],
};

export const formationNames = Object.keys(formations);
