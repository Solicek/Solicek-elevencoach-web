import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import type { DiagramPoint, Drill } from "../types";
import { currentLang, t, type Lang } from "./i18n";

/** Malý kroužek (aproximovaný mnohoúhelníkem) – v diagramu značí pozici hráče. */
function circleStroke(center: DiagramPoint, radius: number, segments = 16): DiagramPoint[] {
  const points: DiagramPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    points.push({ x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) });
  }
  return points;
}

/**
 * Malá šipka "V" uprostřed úsečky from->to – v diagramu značí směr přihrávky. Schválně
 * uprostřed hrany, ne u rohu, aby na malém náhledu v knihovně cvičení nesplynula s kroužkem
 * hráče na rohu – silná čára by jinak tenkou šipku hned u rohu pohltila.
 */
function arrowHeadStrokes(from: DiagramPoint, to: DiagramPoint, size = 0.055): DiagramPoint[][] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return [];
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const tip = { x: from.x + dx * 0.5, y: from.y + dy * 0.5 };
  const backX = tip.x - ux * size;
  const backY = tip.y - uy * size;
  const left = { x: backX + px * size * 0.65, y: backY + py * size * 0.65 };
  const right = { x: backX - px * size * 0.65, y: backY - py * size * 0.65 };
  return [
    [left, tip],
    [right, tip],
  ];
}

interface GeminiDrillResponse {
  name: string;
  category: string;
  description: string;
  players: { x: number; y: number }[];
  passSequence: number[];
}

const generateTrainingDrillFn = httpsCallable<{ promptText: string; lang: Lang }, GeminiDrillResponse>(
  functions,
  "generateTrainingDrill"
);

/**
 * Nechá Gemini (přes bezpečný Cloud Function proxy, klíč nikdy nedorazí do prohlížeče) navrhnout
 * cvičení podle volného popisu trenéra a převede odpověď na Drill s vykresleným náčrtkem
 * (hráči = kroužky, přihrávky = čáry se šipkami uprostřed hrany).
 */
export async function generateDrillFromPrompt(promptText: string): Promise<Drill> {
  // Chyby z funkce chodí česky (jsou psané pro log), uživateli se ukáže hláška v jeho jazyce
  // podle kódu – "unavailable" je výpadek sítě/API, zbytek se neodliší.
  let result;
  try {
    result = await generateTrainingDrillFn({ promptText, lang: currentLang() });
  } catch (e) {
    const code = (e as { code?: string }).code ?? "";
    throw new Error(code.includes("unavailable") ? t("ai.network") : t("tr.aiFailed"));
  }
  const data = result.data;

  const corners = (data.players ?? []).map((p) => ({
    x: Math.min(0.95, Math.max(0.05, p.x)),
    y: Math.min(0.95, Math.max(0.05, p.y)),
  }));

  const diagram: DiagramPoint[][] = [];
  const passSequence = data.passSequence ?? [];
  for (let i = 0; i < passSequence.length - 1; i++) {
    const from = corners[passSequence[i]];
    const to = corners[passSequence[i + 1]];
    if (from && to) {
      diagram.push([from, to]);
      diagram.push(...arrowHeadStrokes(from, to));
    }
  }
  corners.forEach((corner) => diagram.push(circleStroke(corner, 0.035)));

  return {
    id: crypto.randomUUID(),
    name: data.name || "AI cvičení",
    category: data.category || "Technika",
    description: data.description || "",
    isCustom: true,
    diagram,
  };
}
