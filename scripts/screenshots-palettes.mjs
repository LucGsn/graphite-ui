// Captures des trois propositions de thème clair (A, B, C) : page /palettes + pages d'exemple en clair.
// Prérequis : `npm run build`. Sortie : docs/captures/palettes/*.png. Le serveur est coupé à la fin.
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sortie = resolve(racine, "docs/captures/palettes");
mkdirSync(sortie, { recursive: true });

const PORT = 3010;
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

  // 1. Page de comparaison : une capture par palette (section) à 1440 et 375, plus la page entière à 1440.
  for (const width of [1440, 375]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`http://localhost:${PORT}/palettes`, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    for (const p of ["a", "b", "c"]) {
      await page
        .locator(`section:has([data-palette="${p}"])`)
        .screenshot({ path: resolve(sortie, `palette-${p}-${width}.png`) });
    }
    if (width === 1440)
      await page.screenshot({ path: resolve(sortie, "comparaison-1440.png"), fullPage: true });
    await page.close();
  }

  // 2. Pages d'exemple réelles en clair, palette posée sur <html>.
  for (const [nom, chemin] of [
    ["tableau-de-bord", "/exemples/tableau-de-bord"],
    ["liste", "/exemples/liste"],
  ]) {
    for (const p of ["a", "b", "c"]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`http://localhost:${PORT}${chemin}`, { waitUntil: "networkidle" });
      await page.evaluate((pal) => {
        document.documentElement.dataset.theme = "light";
        document.documentElement.dataset.palette = pal;
      }, p);
      await page.waitForTimeout(250);
      await page.screenshot({ path: resolve(sortie, `${nom}-${p}-1440.png`), fullPage: true });
      await page.close();
    }
  }
  await browser.close();
  console.log("captures écrites dans", sortie);
} finally {
  arreter();
}
