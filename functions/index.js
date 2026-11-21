// eslint-disable-next-line
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    category: { type: "STRING" },
    description: { type: "STRING" },
    players: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          x: { type: "NUMBER" },
          y: { type: "NUMBER" },
        },
        required: ["x", "y"],
      },
    },
    passSequence: {
      type: "ARRAY",
      items: { type: "INTEGER" },
    },
  },
  required: ["name", "category", "description", "players", "passSequence"],
};

/**
 * `category` se vrací VŽDY v češtině – je to uložená hodnota sdílená s Androidem, kterou si
 * appka přeloží až při vykreslení (stejně jako u vestavěných cvičení). Název a popis naopak
 * vznikají v jazyce trenéra, protože je nikdo dál nepřekládá.
 */
function buildInstructions(promptText, lang) {
  if (lang === "en") {
    return (
      "You are an assistant to a youth/amateur football coach. Suggest a simple, practical " +
      'training drill based on the coach\'s request: "' +
      promptText +
      '". ' +
      "Describe it as player positions on the pitch – x,y coordinates between 0.1 and 0.9, where [0,0] is the " +
      "top-left corner and [1,1] the bottom-right corner (the pitch is in portrait orientation). Use a realistic " +
      "number of players (usually 3 to 8) in a shape that fits the drill (e.g. a square, a circle, two lines " +
      "facing each other). passSequence is a list of indices into the players array (0-based) describing the " +
      "order in which players pass the ball – the same index may repeat (e.g. a player passing back to the " +
      "middle one). For category pick exactly one of these Czech values, do not translate them: Rozcvička, " +
      "Technika, Kondice, Herní situace, Zakončení. Write name and description in English, briefly and " +
      "practically (1-3 sentences), including a concrete instruction (number of touches, tempo, when to rotate)."
    );
  }
  return (
    "Jsi asistent fotbalového trenéra mládeže/amatérského týmu. Navrhni jednoduché, " +
    'prakticky proveditelné tréninkové cvičení podle požadavku trenéra: "' +
    promptText +
    '". ' +
    "Popiš ho jako pozice hráčů na hřišti – souřadnice x,y v rozsahu 0.1 až 0.9, kde [0,0] je levý horní " +
    "roh hřiště a [1,1] pravý dolní roh (hřiště je orientované na výšku). Použij realistický počet hráčů " +
    "(obvykle 3 až 8) a jejich rozestavení odpovídající požadovanému cvičení (např. čtverec, kruh, dvě " +
    "řady proti sobě apod.). passSequence je seznam indexů do pole players (0-based) popisující pořadí, " +
    "ve kterém si hráči přihrávají míč – klidně se stejný index může v sekvenci opakovat (např. hráč " +
    "vrací míč zpátky prostřednímu hráči). category vyber přesně z těchto možností: Rozcvička, Technika, " +
    "Kondice, Herní situace, Zakončení. description napiš v češtině, stručně a prakticky (1-3 věty), " +
    "včetně konkrétní instrukce (počet doteků, tempo, kdy střídat)."
  );
}

/**
 * Gemini občas vrátí 503 „model je přetížený" (nebo 429/500) – není to chyba nákresu ani
 * klíče, jen dočasná špička. Zkusí se proto znovu, chvíli počkat a nakonec sáhnout po
 * odlehčeném modelu, ať trenér nemusí klikat podruhé.
 */
// Pořadí modelů: první se zkouší nejlepší dostupný flash, lite je rychlá záloha. Alias
// "gemini-flash-latest" tu schválně není – v listopadu 2026 na požadavky vůbec neodpovídal
// (spojení viselo až do timeoutu), takže by jen spolykal čas.
const MODELS = ["gemini-3.6-flash", "gemini-flash-lite-latest"];
/** Kolik času dostane jedno volání modelu, než se přejde na další – visící model nesmí zdržet. */
const SINGLE_CALL_TIMEOUT_MS = 15000;
const RETRY_DELAYS_MS = [800, 2000, 4000];
const BUSY_STATUSES = new Set([429, 500, 502, 503, 504]);
/**
 * Dokdy se smí zkoušet. Volající (appka) čeká na odpověď jen omezenou dobu a funkce sama má
 * strop 60 s – radši tedy vrátit srozumitelnou hlášku, než nechat spojení spadnout na timeout.
 */
const RETRY_BUDGET_MS = 35000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Jedno zavolání Gemini s vlastním limitem. Vrací stav a tělo, výjimku hází jen při chybě sítě. */
async function callGemini(model, body, key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SINGLE_CALL_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return { status: response.status, ok: response.ok, text: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Callable Cloud Function – bezpečný proxy k Gemini API. Klíč žije jen v Secret Manageru na
 * serveru, appka (web i případně jiné klienty) ho nikdy nedostane do rukou. Vrací syrová
 * strukturovaná data (players/passSequence), vykreslení diagramu (kroužky/šipky) dělá klient.
 */
exports.generateTrainingDrill = onCall({ secrets: [geminiApiKey], cors: true }, async (request) => {
  const promptText = String(request.data?.promptText ?? "").trim();
  // Jazyk posílá klient (podle nastavení zařízení); neznámá hodnota padá na češtinu.
  const lang = request.data?.lang === "en" ? "en" : "cs";
  if (!promptText) {
    throw new HttpsError("invalid-argument", "Chybí popis cvičení.");
  }

  const body = {
    contents: [{ parts: [{ text: buildInstructions(promptText, lang) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  const key = geminiApiKey.value();
  let text = null;
  let lastBusy = null;

  // Projdou se modely a mezi pokusy se chvíli počká. Jiná než „přetížená" chyba (špatný klíč,
  // neplatný požadavek) se hlásí hned – opakovat ji nemá smysl.
  const startedAt = Date.now();
  outer: for (let attempt = 0; attempt < RETRY_DELAYS_MS.length + 1; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
    for (const model of MODELS) {
      if (Date.now() - startedAt > RETRY_BUDGET_MS) break outer;
      let result;
      try {
        result = await callGemini(model, body, key);
      } catch (e) {
        // Vypršelý limit nebo výpadek spojení – zkusí se další model, teprve když neprojde
        // žádný, dostane trenér hlášku.
        lastBusy = `${model}: ${e.name === "AbortError" ? "nestihl odpovědět" : String(e)}`;
        continue;
      }
      if (result.ok) {
        text = result.text;
        break outer;
      }
      if (!BUSY_STATUSES.has(result.status)) {
        throw new HttpsError("internal", `Gemini API vrátilo chybu ${result.status}: ${result.text.slice(0, 300)}`);
      }
      lastBusy = `${result.status}: ${result.text.slice(0, 200)}`;
    }
  }

  if (text === null) {
    console.warn("Gemini je přetížené, všechny pokusy selhaly –", lastBusy);
    throw new HttpsError(
      "resource-exhausted",
      "Gemini je zrovna přetížené. Zkus to prosím za chvíli znovu."
    );
  }

  try {
    const root = JSON.parse(text);
    const generatedText = root.candidates[0].content.parts[0].text;
    return JSON.parse(generatedText);
  } catch (e) {
    throw new HttpsError("internal", "Gemini vrátilo neočekávanou odpověď, zkus to prosím znovu.");
  }
});
