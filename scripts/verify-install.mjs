// Vérifie l'installation depuis GitHub Packages dans une app Next.js VIERGE, comme le ferait un projet consommateur :
//   NPM_TOKEN=<jeton read:packages> node scripts/verify-install.mjs [version]
// Crée une app dans un dossier temporaire, y met le .npmrc (sans jeton : il lit NPM_TOKEN), installe le paquet avec
// l'alias, applique la configuration du README, construit, démarre, puis contrôle la page et le contrat sans React.
// Le jeton n'est jamais écrit ni affiché. Le serveur est coupé à la fin.
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2] ?? JSON.parse(readFileSync(join(racine, "package.json"), "utf8")).version;
if (!process.env.NPM_TOKEN) {
  console.error(
    "NPM_TOKEN manquant : un jeton GitHub (classic) avec le seul droit read:packages est requis.",
  );
  process.exit(2);
}

const dossier = mkdtempSync(join(tmpdir(), "graphite-install-"));
const app = join(dossier, "app");
const lancer = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: ["ignore", "inherit", "inherit"], env: process.env });
console.log(`App vierge dans ${dossier} — installation de @lucgsn/graphite-ui@${version}`);

lancer(
  "npx",
  [
    "--yes",
    "create-next-app@latest",
    "app",
    "--ts",
    "--tailwind",
    "--app",
    "--no-src-dir",
    "--use-npm",
    "--no-eslint",
    "--no-turbopack",
    "--import-alias",
    "@/*",
    "--yes",
  ],
  dossier,
);

// .npmrc du README : aucune valeur de jeton, seulement la référence à la variable.
writeFileSync(
  join(app, ".npmrc"),
  "@lucgsn:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${NPM_TOKEN}\n",
);
lancer(
  "npm",
  ["install", `graphite-ui@npm:@lucgsn/graphite-ui@${version}`, "recharts", "--no-audit", "--no-fund"],
  app,
);

// Configuration du README.
const cfg = readFileSync(join(app, "next.config.ts"), "utf8").replace(
  "const nextConfig: NextConfig = {",
  'const nextConfig: NextConfig = {\n  transpilePackages: ["graphite-ui"],',
);
writeFileSync(join(app, "next.config.ts"), cfg);
writeFileSync(
  join(app, "app/globals.css"),
  '@import "tailwindcss";\n@import "graphite-ui/styles.css";\n@source "../node_modules/graphite-ui/src";\n',
);
writeFileSync(
  join(app, "app/layout.tsx"),
  `import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
`,
);
writeFileSync(
  join(app, "app/page.tsx"),
  `import { Onboarding } from "./onboarding";

export default function Page() {
  return <Onboarding />;
}
`,
);
writeFileSync(
  join(app, "app/onboarding.tsx"),
  `"use client";

import { useState } from "react";
import { OnboardingShell, validateQuestionnaire, type Answers } from "graphite-ui";

const validation = validateQuestionnaire({
  schemaVersion: 1,
  id: "verification",
  title: "Vérification",
  sections: [
    {
      id: "a",
      title: "A",
      questions: [
        { id: "nom", type: "short", label: "Votre nom ?", required: true },
        { id: "note", type: "scale", label: "Votre note ?", min: 1, max: 5 },
      ],
    },
  ],
});
if (!validation.ok) throw new Error("questionnaire invalide");
const questionnaire = validation.questionnaire;

export function Onboarding() {
  const [answers, setAnswers] = useState<Answers>({});
  return <OnboardingShell questionnaire={questionnaire} answers={answers} onAnswersChange={setAnswers} onComplete={() => {}} />;
}
`,
);
mkdirSync(join(app, "app/api/valider"), { recursive: true });
writeFileSync(
  join(app, "app/api/valider/route.ts"),
  `import { formatSchemaErrors, validateQuestionnaireText } from "graphite-ui/questionnaire";

export async function POST(req: Request) {
  const r = validateQuestionnaireText(await req.text());
  return Response.json({ ok: r.ok, erreurs: r.ok ? "" : formatSchemaErrors(r.errors) });
}
`,
);

lancer("npx", ["next", "build"], app);

const PORT = 3014;
const serveur = spawn(
  process.execPath,
  [join(app, "node_modules/next/dist/bin/next"), "start", "-p", String(PORT)],
  {
    cwd: app,
    stdio: "ignore",
  },
);
let echec = null;
try {
  let pret = false;
  for (let i = 0; i < 60 && !pret; i++) {
    try {
      pret = (await fetch(`http://localhost:${PORT}/`)).ok;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  if (!pret) throw new Error("serveur injoignable");
  const html = await (await fetch(`http://localhost:${PORT}/`)).text();
  if (!html.includes("Votre nom ?")) throw new Error("la page n'affiche pas la question");
  if (!html.includes('data-theme="dark"')) throw new Error("thème non posé sur <html>");
  const r = await fetch(`http://localhost:${PORT}/api/valider`, {
    method: "POST",
    body: JSON.stringify({
      schemaVersion: 1,
      id: "x",
      title: "X",
      sections: [{ id: "s", title: "S", questions: [{ id: "q", type: "radio", label: "?" }] }],
    }),
  });
  const corps = await r.json();
  if (corps.ok !== false || !String(corps.erreurs).includes("Type inconnu"))
    throw new Error("la validation côté serveur ne répond pas comme prévu");
  console.log(
    `OK : @lucgsn/graphite-ui@${version} installé depuis GitHub Packages, app construite, page et contrat sans React vérifiés.`,
  );
} catch (e) {
  echec = e;
} finally {
  serveur.kill("SIGTERM");
}
if (echec) {
  console.error(`ÉCHEC : ${echec.message}`);
  process.exit(1);
}
