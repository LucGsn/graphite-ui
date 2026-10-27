import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { chroma, contrast } from "./color";
import { violations } from "./rules";

// Propositions de thème clair (tokens/light-palettes.json) : mêmes exigences pour les trois.
const RACINE = resolve(__dirname, "..", "..");
const lire = (f: string) => JSON.parse(readFileSync(join(RACINE, f), "utf8"));
const base = lire("tokens/tokens.json").themes.light as Record<string, string>;
const palettes = lire("tokens/light-palettes.json") as Record<string, Record<string, string>>;
const NOMS = Object.keys(palettes).filter((k) => !k.startsWith("$"));

// Une palette ne touche ni aux statuts ni aux couleurs de données (identiques pour les trois).
const INTERDITS = [
  "success",
  "warning",
  "danger",
  "neutral",
  "chart-green",
  "chart-amber",
  "chart-slate",
  "chart-gray",
  "chart-red",
];

describe.each(NOMS)("palette claire %s", (nom) => {
  const { $nom, ...p } = palettes[nom];
  const t = { ...base, ...p };

  it("tient 4,5:1 sur tout texte et 3:1 sur les éléments graphiques", () => {
    expect(violations(t)).toEqual([]);
  });

  it("ne redéfinit ni statuts ni couleurs de données", () => {
    for (const k of INTERDITS) expect(p, `${$nom} : ${k}`).not.toHaveProperty(k);
  });

  it("distingue la carte du fond (cadre ou écart de luminosité)", () => {
    expect(contrast(t.card, t.background)).toBeGreaterThanOrEqual(1.02);
  });

  it("boutons, menu actif et bouton plein sont des gris purs (jamais beiges)", () => {
    for (const k of ["accent", "field", "primary", "border", "input", "chart-band"])
      expect(t[k], `${nom}/${k}`).toMatch(/^(oklch\([\d.]+%|oklab\([\d.]+) 0 0( \/ [\d.]+)?\)$/);
  });

  it("fonds à chroma ≤ 0,01", () => {
    for (const k of ["background", "sidebar", "card"])
      expect(chroma(t[k]), `${nom}/${k}`).toBeLessThanOrEqual(0.01);
  });

  it("la bande d'incertitude est un gris clair translucide", () => {
    expect(t["chart-band"]).toMatch(/^oklch\(0% 0 0 \/ 0\.\d+\)$/);
  });
});
