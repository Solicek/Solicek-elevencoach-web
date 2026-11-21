// eslint-disable-next-line
const { HttpsError } = require("firebase-functions/v2/https");

/**
 * Limity generování AI.
 *
 * AI je pro trenéry zdarma, takže ji musí něco držet na uzdě: účet i tým si kdokoli založí
 * zadarmo, a bez stropu by jediný člověk vyčerpal denní kvótu Gemini všem ostatním. Proto
 * tři vrstvy, od nejmírnější po pojistku:
 *   - denní limit na tým – férové rozdělení mezi trenéry,
 *   - minutový limit na tým – aby denní limit nešlo spotřebovat jedním nárazem,
 *   - denní limit pro celou aplikaci – pojistka proti cílenému zneužití.
 *
 * Hodnoty se čtou při každém volání z proměnných prostředí – nastavují se v functions/.env
 * a projeví se po `firebase deploy --only functions`, do kódu se kvůli nim sahat nemusí.
 */
function limits() {
  return {
    teamDaily: Number(process.env.AI_TEAM_DAILY_LIMIT || 20),
    teamMinute: Number(process.env.AI_TEAM_MINUTE_LIMIT || 5),
    globalDaily: Number(process.env.AI_GLOBAL_DAILY_LIMIT || 300),
  };
}

/** Počítadla se vedou po dnech v UTC; kdy přesně se den láme, je pro limit jedno. */
function dayKey(now) {
  return now.toISOString().slice(0, 10);
}
function minuteKey(now) {
  return now.toISOString().slice(0, 16);
}

/**
 * Počítadla píše jen server – Admin SDK jde mimo bezpečnostní pravidla. Appka na ně nesmí,
 * jinak by si je mohla vynulovat a limit by nic neznamenal (viz firestore.rules).
 */
function createAiQuota(db) {
  const teamUsageRef = (teamCode, day) => db.collection("teams").doc(teamCode).collection("aiUsage").doc(day);
  const globalUsageRef = (day) => db.collection("aiUsage").doc(day);

  /**
   * Započítá jedno generování dopředu a při vyčerpaném limitu ho k Gemini vůbec nepustí.
   * Běží v transakci, aby limit nešlo obejít tím, že se pošle deset volání naráz.
   * Důvod odmítnutí jde v details, ať appka ukáže srozumitelnou hlášku místo obecné chyby.
   */
  async function reserveAiCall(teamCode) {
    const { teamDaily, teamMinute, globalDaily } = limits();
    const now = new Date();
    const day = dayKey(now);
    const minute = minuteKey(now);
    const teamRef = teamUsageRef(teamCode, day);
    const globalRef = globalUsageRef(day);

    await db.runTransaction(async (tx) => {
      const [teamSnap, globalSnap] = await tx.getAll(teamRef, globalRef);
      const team = teamSnap.data() || {};
      const globalCount = (globalSnap.data() || {}).count || 0;
      const dayCount = team.count || 0;
      // Minutové okno platí jen v rámci stejné minuty, jinak se počítá od nuly.
      const minuteCount = team.minute === minute ? team.minuteCount || 0 : 0;

      if (globalCount >= globalDaily) {
        throw new HttpsError("resource-exhausted", "Denní limit AI pro celou aplikaci je vyčerpaný.", {
          reason: "global-daily",
        });
      }
      if (dayCount >= teamDaily) {
        throw new HttpsError("resource-exhausted", "Tým vyčerpal denní limit AI.", {
          reason: "team-daily",
          limit: teamDaily,
        });
      }
      if (minuteCount >= teamMinute) {
        throw new HttpsError("resource-exhausted", "Moc generování těsně za sebou.", {
          reason: "team-minute",
        });
      }

      tx.set(teamRef, { count: dayCount + 1, minute, minuteCount: minuteCount + 1, lastAt: now }, { merge: true });
      tx.set(globalRef, { count: globalCount + 1, lastAt: now }, { merge: true });
    });
  }

  /** Když Gemini neodpoví, nemá to trenéra stát pokus – započtení se vrátí zpátky. */
  async function refundAiCall(teamCode) {
    try {
      const day = dayKey(new Date());
      const teamRef = teamUsageRef(teamCode, day);
      const globalRef = globalUsageRef(day);
      await db.runTransaction(async (tx) => {
        const [teamSnap, globalSnap] = await tx.getAll(teamRef, globalRef);
        const team = teamSnap.data() || {};
        const globalCount = (globalSnap.data() || {}).count || 0;
        tx.set(
          teamRef,
          { count: Math.max(0, (team.count || 0) - 1), minuteCount: Math.max(0, (team.minuteCount || 0) - 1) },
          { merge: true }
        );
        tx.set(globalRef, { count: Math.max(0, globalCount - 1) }, { merge: true });
      });
    } catch (e) {
      // Nepovedené vrácení je kosmetická vada; volajícímu se kvůli tomu nic hlásit nebude.
      console.warn("Vrácení započteného generování selhalo:", e);
    }
  }

  return { reserveAiCall, refundAiCall };
}

module.exports = { createAiQuota, limits };
