import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import type { DiagramPoint, Drill, TrainingBlock } from "../types";
import { currentLang, t, type Lang } from "./i18n";
import { loadTeamCode } from "./localTeamCode";

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

const generateTrainingDrillFn = httpsCallable<
  { promptText: string; lang: Lang; teamCode: string },
  GeminiDrillResponse
>(functions, "generateTrainingDrill");

interface GeminiPlanResponse {
  name: string;
  blocks: { title: string; description: string; minutes: number }[];
}

const generateTrainingPlanFn = httpsCallable<
  { promptText: string; lang: Lang; minutes: number; teamCode: string },
  GeminiPlanResponse
>(functions, "generateTrainingPlan");

/** Chyby z funkce chodí česky (jsou psané pro log), trenér vidí hlášku ve svém jazyce podle kódu. */
function describeAiError(e: unknown): Error {
  const code = (e as { code?: string }).code ?? "";
  // Vyčerpaný limit chodí jako "resource-exhausted" se jménem limitu v details, ať trenér
  // pozná, jestli má počkat minutu, nebo do zítřka – viz reserveAiCall v functions/index.js.
  const reason = (e as { details?: { reason?: string } }).details?.reason ?? "";
  if (reason === "team-daily") return new Error(t("ai.limitTeamDaily"));
  if (reason === "team-minute") return new Error(t("ai.limitTeamMinute"));
  if (reason === "global-daily") return new Error(t("ai.limitGlobal"));
  // "resource-exhausted" bez důvodu = Gemini je přetížené (dočasné), "unavailable" = síť.
  if (code.includes("resource-exhausted")) return new Error(t("ai.busy"));
  if (code.includes("unauthenticated") || code.includes("permission-denied")) return new Error(t("ai.notAllowed"));
  return new Error(code.includes("unavailable") ? t("ai.network") : t("tr.aiFailed"));
}

/**
 * Nechá Gemini poskládat CELÝ trénink – bloky s minutami, od rozcvičky po zklidnění. Vrací je
 * rovnou jako TrainingBlock, takže se dají jen připsat k tréninku.
 */
export async function generateTrainingPlanFromPrompt(promptText: string, minutes: number): Promise<TrainingBlock[]> {
  let result;
  try {
    result = await generateTrainingPlanFn({
      promptText,
      lang: currentLang(),
      minutes,
      // Funkce si ověří, že kód patří existujícímu týmu – bez toho by ji mohl volat kdokoli.
      teamCode: loadTeamCode() ?? "",
    });
  } catch (e) {
    throw describeAiError(e);
  }
  const blocks = (result.data.blocks ?? [])
    .filter((b) => (b.title ?? "").trim() !== "")
    .map((b) => ({
      id: crypto.randomUUID(),
      title: b.title.trim(),
      description: (b.description ?? "").trim(),
      // Minuty hlídáme i tady – model občas vrátí 0 nebo nesmyslně velké číslo.
      minutes: Math.min(90, Math.max(1, Math.round(Number(b.minutes) || 10))),
    }));
  if (blocks.length === 0) throw new Error(t("tr.aiFailed"));
  return blocks;
}

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
    result = await generateTrainingDrillFn({ promptText, lang: currentLang(), teamCode: loadTeamCode() ?? "" });
  } catch (e) {
    throw describeAiError(e);
  }
  const data = result.data;

  // Model občas vrátí souřadnice v procentech (0–100) místo podílu plochy (0–1). Bez
  // přepočtu by se po oříznutí všichni hráči slili do rohu, takže se to pozná a podělí.
  const raw = data.players ?? [];
  const looksLikePercent = raw.some((p) => Math.abs(p.x) > 1.5 || Math.abs(p.y) > 1.5);
  const corners = raw.map((p) => ({
    x: Math.min(0.95, Math.max(0.05, looksLikePercent ? p.x / 100 : p.x)),
    y: Math.min(0.95, Math.max(0.05, looksLikePercent ? p.y / 100 : p.y)),
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
