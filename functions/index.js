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

function buildInstructions(promptText) {
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
 * Callable Cloud Function – bezpečný proxy k Gemini API. Klíč žije jen v Secret Manageru na
 * serveru, appka (web i případně jiné klienty) ho nikdy nedostane do rukou. Vrací syrová
 * strukturovaná data (players/passSequence), vykreslení diagramu (kroužky/šipky) dělá klient.
 */
exports.generateTrainingDrill = onCall({ secrets: [geminiApiKey], cors: true }, async (request) => {
  const promptText = String(request.data?.promptText ?? "").trim();
  if (!promptText) {
    throw new HttpsError("invalid-argument", "Chybí popis cvičení.");
  }

  const body = {
    contents: [{ parts: [{ text: buildInstructions(promptText) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey.value()}`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new HttpsError("unavailable", "Nepodařilo se spojit s Gemini API – zkontroluj připojení k internetu.");
  }

  const text = await response.text();
  if (!response.ok) {
    throw new HttpsError("internal", `Gemini API vrátilo chybu ${response.status}: ${text.slice(0, 300)}`);
  }

  try {
    const root = JSON.parse(text);
    const generatedText = root.candidates[0].content.parts[0].text;
    return JSON.parse(generatedText);
  } catch (e) {
    throw new HttpsError("internal", "Gemini vrátilo neočekávanou odpověď, zkus to prosím znovu.");
  }
});
