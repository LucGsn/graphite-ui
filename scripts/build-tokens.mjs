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
  // Variables propres à la marque, indépendantes du mode (ex. police).
  const statique = b.static ? `\n[data-brand="${nom}"] {\n${vars(b.static)}\n}\n` : "";
  const css = `${entete}${statique}
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

// Copies embarquées dans le skill : il doit fonctionner sans accès au reste du dépôt.
const skill = resolve(racine, "skills/graphite-ui/tokens");
mkdirSync(skill, { recursive: true });
writeFileSync(resolve(skill, "tokens.json"), readFileSync(resolve(racine, "tokens/tokens.json")));
writeFileSync(resolve(skill, "tokens.css"), tokens);
writeFileSync(
  resolve(skill, "theme-omnes.css"),
  readFileSync(resolve(racine, "src/styles/themes/omnes.css")),
);

// Propositions de thème clair (vitrine uniquement) : [data-theme="light"][data-palette="a|b|c"].
import { existsSync } from "node:fs";
const fichierPalettes = resolve(racine, "tokens/light-palettes.json");
if (existsSync(fichierPalettes)) {
  const palettes = JSON.parse(readFileSync(fichierPalettes, "utf8"));
  const blocs = Object.entries(palettes)
    .filter(([k]) => !k.startsWith("$"))
    .map(([nom, p]) => `[data-theme="light"][data-palette="${nom}"] {\n${vars(p)}\n}`)
    .join("\n\n");
  writeFileSync(resolve(racine, "showcase/app/palettes.css"), `${entete}\n${blocs}\n`);
}
