/**
 * Vygeneruje slovníky v androidím Labels.kt ze zdroje pravdy – webového src/lib/i18n.ts.
 *
 * Obě platformy musí mít překlady 1:1 (stejné klíče i texty), takže je zbytečné (a křehké)
 * udržovat je ručně dvakrát. Skript přepíše jen vyznačené bloky mezi značkami
 * GENERATED-START/END, zbytek Labels.kt (logika) zůstává ručně psaný.
 *
 * Spuštění: node scripts/genAndroidLabels.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Zdrojáky importují bez přípony ("./i18n") – to umí dořešit bundler, ne Node samotný.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)) {
      try {
        return next(`${specifier}.ts`, context);
      } catch {
        // Spadne-li to, zkusí se původní specifier níž (třeba jde o adresář s index.ts).
      }
    }
    return next(specifier, context);
  },
});

const I18N_TS = "src/lib/i18n.ts";
const LABELS_KT = "../FotbalovaSestava/app/src/main/java/com/example/fotbalovasestava/Labels.kt";

// Zdroje se importují přímo – Node od v22 umí TypeScript spustit sám (strip types).
const { STRINGS, STORED_LABELS } = await import(pathToFileURL(resolve(I18N_TS)).href);
const { DRILL_TEXTS } = await import(pathToFileURL(resolve("src/lib/drillLabels.ts")).href);

/** Kotlinový řetězcový literál – escapuje uvozovky, zpětná lomítka, $ a nové řádky. */
function kt(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/\n/g, "\\n")}"`;
}

function entries(obj) {
  return Object.entries(obj)
    .map(([key, { cs, en }]) => `        ${kt(key)} to (${kt(cs)} to ${kt(en)})`)
    .join(",\n");
}

let kotlin = readFileSync(LABELS_KT, "utf8");

function replaceBlock(source, name, body) {
  const start = `// GENERATED-START: ${name}`;
  const end = `// GENERATED-END: ${name}`;
  const pattern = new RegExp(`( *)${start}[\\s\\S]*?${end}`);
  if (!pattern.test(source)) throw new Error(`V Labels.kt chybí blok ${name}`);
  return source.replace(pattern, (_m, indent) => `${indent}${start}\n${body}\n${indent}${end}`);
}

kotlin = replaceBlock(kotlin, "strings", entries(STRINGS));
kotlin = replaceBlock(kotlin, "storedLabels", entries(STORED_LABELS));
kotlin = replaceBlock(kotlin, "drillTexts", entries(DRILL_TEXTS));
writeFileSync(LABELS_KT, kotlin, "utf8");

console.log(
  `Labels.kt: ${Object.keys(STRINGS).length} textů, ${Object.keys(STORED_LABELS).length} uložených hodnot, ` +
    `${Object.keys(DRILL_TEXTS).length} textů cvičení`
);
