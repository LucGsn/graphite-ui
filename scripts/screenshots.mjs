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
  const pages = [
    ["catalogue", "/"],
    ["tableau-de-bord", "/exemples/tableau-de-bord"],
    ["liste", "/exemples/liste"],
    ["detail", "/exemples/detail"],
  ];
  const cas = [
    ["dark", "neutral", 1440],
    ["light", "neutral", 1440],
    ["dark", "neutral", 375],
    ["light", "neutral", 375],
  ];
  const poser = (page, theme, brand) =>
    page.evaluate(
      ([t, b]) => {
        document.documentElement.dataset.theme = t;
        if (b === "neutral") delete document.documentElement.dataset.brand;
        else document.documentElement.dataset.brand = b;
      },
      [theme, brand],
    );
  for (const [nomPage, chemin] of pages) {
    for (const [theme, brand, width] of cas) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(`http://localhost:${PORT}${chemin}`, { waitUntil: "networkidle" });
      await poser(page, theme, brand);
      await page.waitForTimeout(200);
      const nom = `${nomPage}-${theme}-${width}`;
      await page.screenshot({ path: resolve(sortie, `${nom}.png`), fullPage: true });
      await page.close();
    }
  }
  // Variantes : marque omnes, infobulle ouverte, tiroir ouvert, menu mobile ouvert.
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`http://localhost:${PORT}/exemples/tableau-de-bord`, { waitUntil: "networkidle" });
    await poser(page, "dark", "omnes");
    await page.waitForTimeout(200);
    await page.screenshot({ path: resolve(sortie, "tableau-de-bord-omnes-dark-1440.png"), fullPage: true });
    await poser(page, "light", "omnes");
    await page.waitForTimeout(200);
    await page.screenshot({ path: resolve(sortie, "tableau-de-bord-omnes-light-1440.png"), fullPage: true });
    await poser(page, "dark", "neutral");
    await page.locator("main button[aria-label='Explication']").first().click();
    await page.screenshot({ path: resolve(sortie, "tableau-de-bord-infobulle-dark-1440.png") });
    await page.close();
  }
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`http://localhost:${PORT}/exemples/liste`, { waitUntil: "networkidle" });
    await page.getByRole("row").nth(1).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: resolve(sortie, "liste-tiroir-dark-1440.png") });
    await page.close();
  }
  {
    const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
    await page.goto(`http://localhost:${PORT}/exemples/tableau-de-bord`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: resolve(sortie, "tableau-de-bord-menu-mobile-dark-375.png") });
    await page.close();
  }
  await browser.close();
  console.log("captures écrites dans", sortie);
} finally {
  arreter();
}
