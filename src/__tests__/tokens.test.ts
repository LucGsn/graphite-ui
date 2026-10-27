import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { violations } from "./rules";

const RACINE = resolve(__dirname, "..", "..");
const tokens = JSON.parse(readFileSync(join(RACINE, "tokens/tokens.json"), "utf8")) as {
  themes: Record<"dark" | "light", Record<string, string>>;
  brands: Record<
    string,
    Record<"dark" | "light", Record<string, string>> & { static?: Record<string, string> }
  >;
};

// Thèmes à contrôler : neutre sombre/clair + chaque marque (jetons de marque posés sur le thème neutre).
const THEMES: [string, Record<string, string>][] = [
  ["dark", tokens.themes.dark],
  ["light", tokens.themes.light],
  ...Object.entries(tokens.brands).flatMap(([nom, b]) =>
    (["dark", "light"] as const).map((mode): [string, Record<string, string>] => [
      `${nom}/${mode}`,
      { ...tokens.themes[mode], ...b[mode] },
    ]),
  ),
];

describe("tokens de référence (Paperclip, sombre)", () => {
  const d = tokens.themes.dark;
  it("reprend les valeurs mesurées, en gris purs", () => {
    expect(d.background).toBe("oklch(20.5% 0 0)");
    expect(d.sidebar).toBe("oklch(26.9% 0 0)");
    expect(d.accent).toBe("oklch(32% 0 0)");
    expect(d.foreground).toBe("oklch(98.5% 0 0)");
    expect(d.muted).toBe("oklch(70.8% 0 0)");
    expect(d.border).toBe("oklch(100% 0 0 / 0.1)");
    expect(d.input).toBe("oklch(100% 0 0 / 0.15)");
    expect(d.field).toBe("oklab(1 0 0 / 0.045)");
  });

  it("garde le cœur neutre : surfaces et textes à chroma 0", () => {
    for (const [nom, t] of THEMES.slice(0, 2))
      for (const k of ["background", "card", "sidebar", "accent", "foreground", "muted", "primary", "border"])
        expect(t[k], `${nom}/${k}`).toMatch(/^oklch\([\d.]+% 0 0( \/ [\d.]+)?\)$/);
  });
});

describe("contraste : 4,5:1 pour tout texte, 3:1 pour les éléments graphiques", () => {
  for (const [nom, t] of THEMES)
    it(`${nom} : aucune paire sous son seuil`, () => {
      expect(violations(t)).toEqual([]);
    });
});

describe("thèmes de marque", () => {
  it("ne changent que quelques tokens (≤ 6 par mode)", () => {
    for (const [nom, b] of Object.entries(tokens.brands))
      for (const mode of ["dark", "light"] as const) {
        const cles = Object.keys(b[mode]).filter((k) => !k.startsWith("$"));
        expect(cles.length, `${nom}/${mode}`).toBeLessThanOrEqual(6);
        for (const k of cles) expect(tokens.themes[mode], `${nom}/${mode}/${k}`).toHaveProperty(k);
      }
  });
});

describe("marque omnes : charte « Business Review »", () => {
  const o = tokens.brands.omnes;
  it("reprend les trois couleurs de la charte et la police Arial", () => {
    expect(o.dark.primary.toLowerCase()).toBe("#3bc2a2");
    expect(o.dark["primary-foreground"].toLowerCase()).toBe("#120432");
    expect(o.light.primary.toLowerCase()).toBe("#0014d0");
    expect(o.light["chart-slate"].toLowerCase()).toBe("#120432");
    expect(o.static?.["font-sans-stack"]).toMatch(/^Arial,/);
  });
});

describe("génération", () => {
  it("tokens.css et themes/*.css sont à jour avec tokens.json", () => {
    const lire = () =>
      [
        "src/styles/tokens.css",
        ...readdirSync(join(RACINE, "src/styles/themes")).map((f) => `src/styles/themes/${f}`),
      ].map((f) => readFileSync(join(RACINE, f), "utf8"));
    const avant = lire();
    execFileSync(process.execPath, [join(RACINE, "scripts/build-tokens.mjs")], { cwd: RACINE });
    expect(lire()).toEqual(avant);
  });
});

// ---------------------------------------------------------------------------
// Aucune couleur en dur hors des tokens.
// ---------------------------------------------------------------------------
function fichiers(dossier: string, sortie: string[] = []): string[] {
  for (const nom of readdirSync(dossier)) {
    if (nom === "node_modules" || nom === ".next") continue;
    const p = join(dossier, nom);
    if (statSync(p).isDirectory()) fichiers(p, sortie);
    else if (/\.tsx?$/.test(nom) && !/\.test\.tsx?$/.test(nom) && nom !== "color.ts") sortie.push(p);
  }
  return sortie;
}
const SOURCES = [
  ...fichiers(join(RACINE, "src")),
  ...fichiers(join(RACINE, "showcase")),
  ...fichiers(join(RACINE, "skills")),
];

describe("discipline des couleurs", () => {
  it("aucune couleur en dur (hex, rgb, hsl) hors des tokens", () => {
    const fautifs = SOURCES.filter((f) =>
      /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])|rgba?\(|hsla?\(/.test(readFileSync(f, "utf8")),
    );
    expect(fautifs).toEqual([]);
  });

  it("aucune couleur Tailwind brute (slate-500, blue-600…)", () => {
    const re =
      /\b(?:text|bg|border|ring|from|to|fill|stroke)-(?:blue|violet|purple|indigo|sky|cyan|teal|emerald|green|red|amber|orange|yellow|pink|rose|slate|zinc|gray|neutral|stone)-\d/;
    expect(SOURCES.filter((f) => re.test(readFileSync(f, "utf8")))).toEqual([]);
  });

  it("aucun texte sous 10 px", () => {
    const fautifs: string[] = [];
    for (const f of SOURCES)
      for (const m of readFileSync(f, "utf8").matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g))
        if (Number(m[1]) < 10) fautifs.push(`${f} : ${m[0]}`);
    expect(fautifs).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Skill Claude : autonome, à jour et cohérent.
// ---------------------------------------------------------------------------
describe("skill graphite-ui", () => {
  const dossier = join(RACINE, "skills/graphite-ui");
  const skill = readFileSync(join(dossier, "SKILL.md"), "utf8");

  it("a un frontmatter valide (name, description)", () => {
    const m = skill.match(/^---\nname: ([a-z0-9-]+)\ndescription: (.+)\n---\n/);
    expect(m, "frontmatter name/description").not.toBeNull();
    expect(m![1]).toBe("graphite-ui");
    expect(m![2].length).toBeGreaterThan(80);
  });

  it("embarque des tokens identiques à la source", () => {
    expect(readFileSync(join(dossier, "tokens/tokens.json"), "utf8")).toBe(
      readFileSync(join(RACINE, "tokens/tokens.json"), "utf8"),
    );
    expect(readFileSync(join(dossier, "tokens/tokens.css"), "utf8")).toBe(
      readFileSync(join(RACINE, "src/styles/tokens.css"), "utf8"),
    );
  });

  it("ne référence que des fichiers qui existent", () => {
    for (const chemin of skill.match(/(?:examples|reference|tokens)\/[\w.-]+/g) ?? [])
      expect(() => readFileSync(join(dossier, chemin)), chemin).not.toThrow();
  });

  it("tous les exemples n'importent que des composants exportés", async () => {
    const exportes = Object.keys(await import("../index"));
    for (const f of readdirSync(join(dossier, "examples"))) {
      const src = readFileSync(join(dossier, "examples", f), "utf8");
      const noms = [...src.matchAll(/import \{([^}]+)\} from "graphite-ui"/g)]
        .flatMap((m) => m[1].split(","))
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith("type "));
      for (const n of noms) expect(exportes, `${f} : ${n}`).toContain(n);
    }
  });
});
