// Captures de l'onboarding de démonstration : sombre/clair × 1440/375 px, étapes clés. Lance `next start`, le coupe à la fin.
// Prérequis : `npm run build`. Sortie : docs/captures/onboarding-*.png
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
/** Violations axe (WCAG 2.x A/AA, contraste compris) relevées à chaque étape capturée. */
const violations = [];
let controles = 0;
async function controle(page, etape) {
  controles += 1;
  await page.addScriptTag({ path: axePath });
  const trouvees = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] });
    return r.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  });
  for (const v of trouvees) violations.push(`${etape} — ${v}`);
}

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sortie = resolve(racine, "docs/captures");
mkdirSync(sortie, { recursive: true });

const PORT = 3011;
const serveur = spawn(
  process.execPath,
  [resolve(racine, "node_modules/next/dist/bin/next"), "start", "showcase", "--port", String(PORT)],
  { cwd: racine, stdio: "ignore" },
);
const arreter = () => {
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(serveur.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      // processus déjà arrêté
    }
  } else serveur.kill("SIGTERM");
};

async function attendre() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://localhost:${PORT}/`)).ok) return;
    } catch {
      // serveur pas encore prêt
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("serveur injoignable");
}

try {
  await attendre();
  const browser = await chromium.launch();
  for (const theme of ["dark", "light"]) {
    for (const width of [1440, 375]) {
      const height = width === 1440 ? 900 : 800;
      const page = await browser.newPage({ viewport: { width, height } });
      const photo = async (nom) => {
        await page.waitForTimeout(150);
        await controle(page, `${nom} ${theme} ${width}`);
        await page.screenshot({ path: resolve(sortie, `onboarding-${nom}-${theme}-${width}.png`) });
      };
      const suite = async () => {
        await page.getByRole("button", { name: /^(Continuer|Passer)$/ }).click();
        await page.waitForTimeout(120);
      };
      await page.goto(`http://localhost:${PORT}/onboarding`, { waitUntil: "networkidle" });
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);
      await page.waitForTimeout(200);
      await photo("accueil");
      await page.getByRole("button", { name: "Commencer", exact: true }).click();
      await page.getByRole("textbox").fill("Camille");
      await suite();
      await page.getByRole("radio", { name: "Design" }).check({ force: true });
      await photo("choix-puces");
      await suite();
      await page.getByRole("radio", { name: /Confirmé/ }).check({ force: true });
      await photo("choix-cartes");
      await suite();
      await page.getByText("Merci Camille.").waitFor();
      await suite();
      await page.getByRole("spinbutton").fill("8");
      await suite();
      await page.getByRole("radio", { name: "Hybride" }).check({ force: true });
      await suite();
      await page.getByRole("checkbox", { name: "Messagerie" }).check({ force: true });
      await page.getByRole("checkbox", { name: "Documents partagés" }).check({ force: true });
      await page.getByRole("checkbox", { name: "Autre, préciser" }).check({ force: true });
      await page.getByRole("textbox", { name: "Autre, préciser" }).fill("Wiki interne");
      await photo("choix-multiple");
      await suite();
      await page.getByRole("radio", { name: /^4/ }).check({ force: true });
      await photo("echelle");
      await suite();
      await page.getByRole("textbox").fill("Un point hebdomadaire et des notes partagées.");
      await suite();
      await page.getByLabel(/À quelle date/).fill("2026-03-02");
      await suite();
      await page.getByRole("button", { name: "Descendre « Gagner du temps »" }).click();
      await photo("classement");
      await suite();
      await page.getByRole("heading", { name: "Vérifiez vos réponses" }).waitFor();
      await photo("recapitulatif");
      await page.getByRole("button", { name: "Envoyer mes réponses" }).click();
      await page.getByRole("heading", { name: /c'est terminé/ }).waitFor();
      await photo("fin");
      await page.close();

      // Mode « une section par écran »
      const p2 = await browser.newPage({ viewport: { width, height } });
      await p2.goto(`http://localhost:${PORT}/onboarding`, { waitUntil: "networkidle" });
      await p2.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);
      await p2.getByRole("button", { name: "Par section" }).click();
      await p2.getByRole("button", { name: "Commencer", exact: true }).click();
      await p2.getByRole("textbox").fill("Camille");
      await p2.getByRole("radio", { name: "Développement" }).check({ force: true });
      await p2.waitForTimeout(200);
      await controle(p2, `section ${theme} ${width}`);
      await p2.screenshot({ path: resolve(sortie, `onboarding-section-${theme}-${width}.png`) });
      await p2.close();
    }
  }
  await browser.close();
  console.log("captures écrites dans", sortie);
  if (violations.length) {
    console.error(`Violations d'accessibilité :\n${violations.join("\n")}`);
    process.exitCode = 1;
  } else console.log(`axe : ${controles} états contrôlés, aucune violation (WCAG 2.2 AA, contraste compris)`);
} finally {
  arreter();
}
