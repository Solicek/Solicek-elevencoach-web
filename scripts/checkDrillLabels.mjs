/**
 * Ověří, že každý název i popis z vestavěné knihovny cvičení má překlad.
 * Chybějící text by se jinak anglickému trenérovi tiše zobrazil česky.
 */
import { registerHooks } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)) {
      try {
        return next(`${specifier}.ts`, context);
      } catch {
        // viz genAndroidLabels.mjs
      }
    }
    return next(specifier, context);
  },
});

const { DRILL_TEXTS } = await import(pathToFileURL(resolve("src/lib/drillLabels.ts")).href);
const { drillLibrary } = await import(pathToFileURL(resolve("src/drills.ts")).href);

const missing = [];
for (const drill of drillLibrary) {
  if (!DRILL_TEXTS[drill.name]) missing.push(`název: ${drill.name}`);
  if (drill.description && !DRILL_TEXTS[drill.description]) missing.push(`popis: ${drill.description}`);
}

console.log(`cvičení: ${drillLibrary.length}, překladů: ${Object.keys(DRILL_TEXTS).length}, chybí: ${missing.length}`);
missing.forEach((m) => console.log("  ", m));
if (missing.length > 0) process.exit(1);
