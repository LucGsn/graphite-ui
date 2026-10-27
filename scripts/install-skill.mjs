// Installe le skill dans Claude Code : node scripts/install-skill.mjs [--project]
// Par défaut : ~/.claude/skills/graphite-ui. Avec --project : ./.claude/skills/graphite-ui (dossier courant).
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const source = resolve(dirname(fileURLToPath(import.meta.url)), "..", "skills", "graphite-ui");
const base = process.argv.includes("--project") ? join(process.cwd(), ".claude") : join(homedir(), ".claude");
const cible = join(base, "skills", "graphite-ui");

rmSync(cible, { recursive: true, force: true });
mkdirSync(dirname(cible), { recursive: true });
cpSync(source, cible, { recursive: true });
console.log(`skill installé : ${cible}`);
