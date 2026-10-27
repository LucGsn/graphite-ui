// Captures du site vitrine : sombre/clair × 1440/375 px (+ marque omnes). Lance `next start`, le coupe à la fin.
// Prérequis : `npm run build`. Sortie : docs/captures/*.png
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sortie = resolve(racine, "docs/captures");
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
      // processus déjà arrêté
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("serveur injoignable");
}

try {
  await attendre();
  const browser = await chromium.launch();
  const cas = [
    ["dark", "neutral", 1440],
    ["light", "neutral", 1440],
    ["dark", "neutral", 375],
    ["light", "neutral", 375],
    ["dark", "omnes", 1440],
  ];
  for (const [theme, brand, width] of cas) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
    await page.evaluate(
      ([t, b]) => {
        document.documentElement.dataset.theme = t;
        if (b === "neutral") delete document.documentElement.dataset.brand;
        else document.documentElement.dataset.brand = b;
      },
      [theme, brand],
    );
    await page.waitForTimeout(150);
    const nom = `${brand === "neutral" ? "" : brand + "-"}${theme}-${width}`;
    await page.screenshot({ path: resolve(sortie, `${nom}.png`), fullPage: true });
    if (width === 1440 && brand === "neutral") {
      // Infobulle ouverte par clic sur la 1re icône « i » d'un chiffre clé.
      await page.locator("#kpi-stat").scrollIntoViewIfNeeded();
      await page.locator("#kpi-stat button[aria-label='Explication']").first().click();
      await page.locator("#kpi-stat").screenshot({ path: resolve(sortie, `${nom}-infobulle.png`) });
    }
    await page.close();
  }
  await browser.close();
  console.log("captures écrites dans", sortie);
} finally {
  arreter();
}
