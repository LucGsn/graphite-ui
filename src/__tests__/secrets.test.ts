import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Garde-fou : aucun secret dans les fichiers suivis par Git. (L'historique complet a été balayé à la main ;
// ce test empêche qu'un secret entre dans un commit à venir.)
const RACINE = resolve(__dirname, "..", "..");
const suivis = execFileSync("git", ["ls-files"], { cwd: RACINE, encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const MOTIFS: [string, RegExp][] = [
  ["clé AWS", /AKIA[0-9A-Z]{16}/],
  ["jeton GitHub", /\bgh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/],
  ["clé de style sk-", /\bsk-[A-Za-z0-9_-]{20,}/],
  ["jeton Slack", /xox[baprs]-[A-Za-z0-9-]{10,}/],
  ["clé privée", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["JWT", /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/],
  [
    "affectation de secret",
    /(api[_-]?key|secret|passw(or)?d|token)["']?\s*[:=]\s*["'][A-Za-z0-9/+_-]{16,}["']/i,
  ],
];

describe("secrets", () => {
  it("aucun fichier d'environnement ou de clé n'est suivi", () => {
    const fautifs = suivis.filter((f) => /(^|\/)\.env(\.|$)|\.pem$|\.key$|id_rsa|auth\.json$/.test(f));
    expect(fautifs).toEqual([]);
  });

  it("aucun motif de secret dans les fichiers texte suivis", () => {
    const trouves: string[] = [];
    for (const f of suivis) {
      if (/\.(png|jpg|ico|woff2?|zip)$/.test(f) || f.endsWith("package-lock.json")) continue;
      const texte = readFileSync(join(RACINE, f), "utf8");
      for (const [nom, re] of MOTIFS) if (re.test(texte)) trouves.push(`${f} : ${nom}`);
    }
    expect(trouves).toEqual([]);
  });
});
