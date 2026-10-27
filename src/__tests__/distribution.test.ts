import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Distribution privée : le paquet se publie sur GitHub Packages (@lucgsn/graphite-ui) et rien ne suppose un accès public.
const RACINE = resolve(__dirname, "..", "..");
const lire = (f: string) => readFileSync(join(RACINE, f), "utf8");
const pkg = JSON.parse(lire("package.json"));
const suivis = execFileSync("git", ["ls-files"], { cwd: RACINE, encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const LIGNE_REGISTRE = "@lucgsn:registry=https://npm.pkg.github.com";
const LIGNE_JETON = "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}";

describe("paquet privé sur GitHub Packages", () => {
  it("porte le nom scopé et ne peut être publié que sur GitHub Packages", () => {
    expect(pkg.name).toBe("@lucgsn/graphite-ui");
    expect(pkg.private).toBeUndefined();
    expect(pkg.publishConfig).toEqual({ registry: "https://npm.pkg.github.com", access: "restricted" });
    expect(pkg.repository.url).toContain("github.com/LucGsn/graphite-ui");
    expect(pkg.license).toBe("UNLICENSED");
  });

  it("le contenu publié : sources, tokens, skill, docs ; ni tests, ni vitrine, ni captures, ni scripts", () => {
    const sortie = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
      cwd: RACINE,
      encoding: "utf8",
    });
    const fichiers: string[] = JSON.parse(sortie)[0].files.map((f: { path: string }) => f.path);
    for (const attendu of [
      "package.json",
      "README.md",
      "DESIGN.md",
      "CHANGELOG.md",
      "src/index.ts",
      "src/questionnaire.ts",
      "src/lib/questionnaire/questionnaire.schema.json",
      "src/styles/index.css",
      "src/styles/themes/omnes.css",
      "tokens/tokens.json",
      "skills/graphite-ui/SKILL.md",
      "skills/graphite-ui/reference/questionnaire.md",
    ])
      expect(fichiers, attendu).toContain(attendu);
    const indesirables = fichiers.filter(
      (f) =>
        /^(showcase|docs|scripts|\.github|node_modules)\//.test(f) || /(__tests__|\.test\.tsx?$)/.test(f),
    );
    expect(indesirables).toEqual([]);
    // Tous les points d'entrée déclarés existent dans le paquet.
    for (const cible of Object.values(pkg.exports) as string[])
      expect(fichiers, cible).toContain(cible.replace(/^\.\//, ""));
  });

  it("aucun .npmrc n'est suivi (sa variable ${NPM_TOKEN} casserait npm ci) ; l'exemple est fourni", () => {
    expect(suivis.filter((f) => /(^|\/)\.npmrc$/.test(f))).toEqual([]);
    const exemple = lire(".npmrc.example");
    expect(exemple).toContain(LIGNE_REGISTRE);
    expect(exemple).toContain(LIGNE_JETON);
  });
});

describe("workflow de release", () => {
  const wf = lire(".github/workflows/release.yml");

  it("publie sur GitHub Packages avec les bonnes permissions, en plus de la release et du zip", () => {
    expect(wf).toMatch(/permissions:\s*\n\s+contents: write\s*\n\s+packages: write/);
    expect(wf).toContain("registry-url: https://npm.pkg.github.com");
    expect(wf).toContain('scope: "@lucgsn"');
    expect(wf).toContain("NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}");
    expect(wf).toContain("npm publish");
    expect(wf).toContain("gh release create");
    expect(wf).toContain("zip -r");
  });

  it("garde les deux déclencheurs, exige main et la version de package.json, et ne republie pas", () => {
    expect(wf).toContain('tags: ["v*"]');
    expect(wf).toContain("workflow_dispatch:");
    expect(wf).toContain("refs/heads/main");
    expect(wf).toContain("require('./package.json').version");
    expect(wf).toContain("npm view");
  });

  it("la publication précède la création du tag et de la release (un échec n'en laisse pas de moitié)", () => {
    expect(wf.indexOf("npm publish")).toBeGreaterThan(-1);
    expect(wf.indexOf("npm publish")).toBeLessThan(wf.indexOf("gh release create"));
  });
});

describe("workflow de vérification d'installation", () => {
  const wf = lire(".github/workflows/verify-install.yml");

  it("se lance à la main, en lecture seule, avec le jeton intégré (aucun jeton personnel)", () => {
    expect(wf).toContain("workflow_dispatch:");
    expect(wf).toMatch(/permissions:\s*\n\s+contents: read\s*\n\s+packages: read/);
    expect(wf).toContain("NPM_TOKEN: ${{ secrets.GITHUB_TOKEN }}");
    expect(wf).not.toMatch(/secrets\.(?!GITHUB_TOKEN)\w+/);
    expect(wf).toContain("node scripts/verify-install.mjs");
  });
});

describe("documentation d'installation privée", () => {
  const readme = lire("README.md");
  const skill = lire("skills/graphite-ui/SKILL.md");

  it("le README donne le .npmrc, le jeton read:packages seul et la variable NPM_TOKEN sur Vercel", () => {
    expect(readme).toContain(LIGNE_REGISTRE);
    expect(readme).toContain(LIGNE_JETON);
    expect(readme).toContain("**uniquement `read:packages`**");
    expect(readme).toContain("npm install graphite-ui@npm:@lucgsn/graphite-ui@");
    expect(readme).toMatch(/Vercel[\s\S]*Environment Variables[\s\S]*`NPM_TOKEN`/);
    expect(readme).toContain("Production, Preview et Development");
  });

  it("le skill décrit la même installation", () => {
    expect(skill).toContain(LIGNE_REGISTRE);
    expect(skill).toContain("npm install graphite-ui@npm:@lucgsn/graphite-ui@");
  });

  it("plus aucune consigne d'installation depuis Git ni lien dépendant d'un accès public", () => {
    for (const f of [
      "README.md",
      "DESIGN.md",
      "docs/THEMING.md",
      "skills/graphite-ui/SKILL.md",
      "skills/graphite-ui/reference/components.md",
      "skills/graphite-ui/reference/questionnaire.md",
    ]) {
      const t = lire(f);
      expect(t, f).not.toMatch(/npm install github:|git\+ssh:|raw\.githubusercontent\.com/);
    }
    expect(lire("src/lib/questionnaire/questionnaire.schema.json")).toContain('"$id": "urn:');
  });

  it("le CHANGELOG récapitule 0.1.0, 0.2.0 (non publiée) et la version courante", () => {
    const c = lire("CHANGELOG.md");
    expect(c).toContain("## [0.1.0]");
    expect(c).toMatch(/## \[0\.2\.0\] — non publiée/);
    expect(c).toContain("**Jamais publiée**");
    expect(c).toContain(`## [${pkg.version}]`);
  });
});
