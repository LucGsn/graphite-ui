// Génère src/styles/tokens.css et src/styles/themes/*.css depuis tokens/tokens.json (source unique).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const t = JSON.parse(readFileSync(resolve(racine, "tokens/tokens.json"), "utf8"));
const vars = (o) =>
  Object.entries(o)
    .filter(([k]) => !k.startsWith("$"))
    .map(([k, v]) => `  --${k}: ${v};`)
    .join("\n");

const entete =
  "/* GÉNÉRÉ par scripts/build-tokens.mjs depuis tokens/tokens.json — ne pas modifier à la main. */\n";

const tokens = `${entete}
:root,
[data-theme="dark"] {
  color-scheme: dark;
${vars(t.themes.dark)}
${vars(t.static)}
}

[data-theme="light"] {
  color-scheme: light;
${vars(t.themes.light)}
}
`;
writeFileSync(resolve(racine, "src/styles/tokens.css"), tokens);

mkdirSync(resolve(racine, "src/styles/themes"), { recursive: true });
for (const [nom, b] of Object.entries(t.brands)) {
  const css = `${entete}
[data-brand="${nom}"],
[data-brand="${nom}"][data-theme="dark"] {
${vars(b.dark)}
}

[data-brand="${nom}"][data-theme="light"] {
${vars(b.light)}
}
`;
  writeFileSync(resolve(racine, `src/styles/themes/${nom}.css`), css);
}
console.log("tokens générés");
