# graphite-ui

Design system neutre, inspiré de Paperclip : gris purs, couleur réservée aux statuts et aux données, peu de texte, gros chiffres, explications au survol. Un cœur neutre, une couche de marque interchangeable, un thème sombre de référence et un thème clair dérivé.

- **Principes et règles d'usage** : [DESIGN.md](DESIGN.md)
- **Thèmes (sombre, clair, marque)** : [docs/THEMING.md](docs/THEMING.md)
- **Vitrine** : tous les composants et variantes, sombre et clair, `npm run dev` (http://localhost:3010)
- **Skill Claude** : [skills/graphite-ui](skills/graphite-ui) — voir « Skill Claude » plus bas

## Composants

`AppShell` · `Sidebar` · `PageHeader` · `SectionTitle` · `GroupDivider` · `Tabs` · `Button` · `IconButton` · `ToggleGroup` · `ModeSwitch` · `FilterSelect` · `Badge` · `StatusDot` · `Card` · `ChartCard` · `KpiStat` · `KpiGrid` · `BarChart` · `LineChart` (bande d'incertitude) · `Treemap` · `List` · `ListRow` · `DataTable` · `Drawer` · `InfoTooltip` · `EmptyState`

Props et pièges : [skills/graphite-ui/reference/components.md](skills/graphite-ui/reference/components.md). Aucun texte ni donnée métier : tout est générique.

## Installer (dépôt et paquet privés)

Le dépôt est privé. Le paquet est publié sur **GitHub Packages** (registre npm privé de GitHub) sous le nom `@lucgsn/graphite-ui`, à chaque release (Actions → Release). Il n'y a plus d'installation depuis Git, et rien n'est publié sur le registre npm public, où le nom `graphite-ui` appartient à un autre paquet.

### 1. Créer un jeton en lecture seule

GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)** → _Generate new token (classic)_ ([GitHub Packages n'accepte que ces jetons](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry), pas les jetons « fine-grained »).

- Nom : `graphite-ui (lecture)` ; expiration : 90 jours à 1 an (à renouveler avant l'échéance).
- Cocher **uniquement `read:packages`**. Rien d'autre (surtout pas `repo` ni `write:packages`).
- Le compte qui crée le jeton doit avoir accès au dépôt `LucGsn/graphite-ui` : le paquet hérite des droits du dépôt privé.
- Copier le jeton une fois : GitHub ne le réaffiche pas. Ne jamais l'écrire dans un fichier du dépôt.

### 2. En local

Poser le jeton dans l'environnement du poste, hors de tout dépôt (ex. `~/.zshrc`) :

```bash
export NPM_TOKEN=<votre-jeton>
```

Dans le projet qui consomme le paquet, créer (et **versionner**) un fichier `.npmrc` à la racine. Il ne contient aucun jeton, seulement la référence à la variable ([`.npmrc.example`](.npmrc.example)) :

```ini
@lucgsn:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

Installer avec un **alias**, pour que les imports restent `graphite-ui` :

```bash
npm install graphite-ui@npm:@lucgsn/graphite-ui@0.3.0 recharts
```

`package.json` contient alors `"graphite-ui": "npm:@lucgsn/graphite-ui@0.3.0"`, et tous les extraits ci-dessous (`transpilePackages`, `@import`, `@source`, imports) s'appliquent tels quels. Sans alias (`npm install @lucgsn/graphite-ui`), remplacer `graphite-ui` par `@lucgsn/graphite-ui` partout, y compris dans `@source "../node_modules/@lucgsn/graphite-ui/src"`.

`recharts` n'est nécessaire que pour `BarChart` et `LineChart`. `NPM_TOKEN` doit être défini à chaque `npm install` / `npm ci` ; sinon npm répond « Failed to replace env in config: ${NPM_TOKEN} ».

### 3. Sur Vercel (chaque projet qui consomme le paquet)

1. Le `.npmrc` ci-dessus est dans le dépôt du projet (il ne contient pas de jeton).
2. Vercel → le projet → **Settings → Environment Variables** → ajouter `NPM_TOKEN` = le jeton, cochée pour **Production, Preview et Development** (sans Preview, les déploiements de branches échouent), type _Sensitive_.
3. Redéployer. L'installation de Vercel lit le `.npmrc` et la variable ; aucune autre commande n'est nécessaire.

La vitrine de ce dépôt n'a **pas** besoin de `NPM_TOKEN` : elle importe `../src` directement. Dans les GitHub Actions d'un projet consommateur : `env: NPM_TOKEN: ${{ secrets.NPM_TOKEN }}` (secret du dépôt).

### Dépannage

| Message ou symptôme                                     | Cause probable                                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `401 Unauthorized`                                      | `NPM_TOKEN` absent, expiré, révoqué, ou non défini pour cet environnement Vercel (Preview).          |
| `404 Not Found - @lucgsn/graphite-ui`                   | Le compte du jeton n'a pas accès au dépôt, ou la ligne `@lucgsn:registry=…` manque dans le `.npmrc`. |
| `Failed to replace env in config`                       | `NPM_TOKEN` n'est pas défini dans l'environnement qui lance npm.                                     |
| Un autre paquet `graphite-ui` s'installe (ou 404 npmjs) | Installation sans alias ni scope : utiliser `graphite-ui@npm:@lucgsn/graphite-ui@<version>`.         |
| `No matching version`                                   | Cette version n'est pas publiée (la 0.2.0 ne l'a jamais été : voir le [CHANGELOG](CHANGELOG.md)).    |

**1. `next.config.ts`** — le paquet est livré en TypeScript :

```ts
const config: NextConfig = { transpilePackages: ["graphite-ui"] };
```

**2. `app/globals.css`** :

```css
@import "tailwindcss";
@import "graphite-ui/styles.css";
/* @import "graphite-ui/themes/omnes.css"; */ /* thème de marque d'exemple, facultatif */
@source "../node_modules/graphite-ui/src";
```

`@source` est relatif au fichier CSS : ajuster le nombre de `../` selon son emplacement.

**3. `app/layout.tsx`** — thème posé sur `<html>`, police Inter :

```tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

`data-theme="light"` pour le clair ; `data-brand="omnes"` pour le thème de marque (combinables).

**4. Utiliser les composants** :

```tsx
import { KpiGrid, KpiStat, Badge } from "graphite-ui";

export default function Page() {
  return (
    <KpiGrid>
      <KpiStat
        label="Taux d'activation"
        value="44"
        unit="%"
        caption="vs 41 le mois dernier"
        info="Part des comptes qui font une première action sous 7 jours."
        badge={<Badge tone="success">Solide</Badge>}
      />
    </KpiGrid>
  );
}
```

Dans un composant **serveur**, ne pas passer de fonction à un composant client : pour les graphiques, `unit="%"` plutôt que `formatValue`. Détails : [reference/components.md](skills/graphite-ui/reference/components.md#frontière-serveurclient).

**Mettre à jour** : changer la version dans `package.json` (`npm:@lucgsn/graphite-ui@0.4.0`), puis `npm install`. Les versions sont consignées dans le [CHANGELOG](CHANGELOG.md).

## Onboarding et questionnaires

Un questionnaire se décrit en JSON (contrat versionné, huit types de questions, affichage conditionnel) et s'affiche avec `OnboardingShell` : une question ou une section par écran, écrans personnalisés, enregistrement et reprise, récapitulatif, écran de fin. Le contrat et sa validation s'importent sans React : `import { validateQuestionnaire } from "graphite-ui/questionnaire"`. Aucun appel à une IA dans le paquet : une IA peut générer le document, `validateQuestionnaire` dit s'il est conforme (voir le skill). Démonstration : `/onboarding` dans la vitrine.

## Skill Claude

Le dossier `skills/graphite-ui/` contient `SKILL.md`, les tokens (`tokens/`), une référence des composants et trois pages d'exemple (`examples/`). Il est autonome.

- **Claude Code** : `node scripts/install-skill.mjs` (installe dans `~/.claude/skills/graphite-ui`) ou `node scripts/install-skill.mjs --project` (dans `./.claude/skills/` du projet courant).
- **claude.ai** : Réglages → Capacités → Skills → importer le zip de la release (`graphite-ui-skill-vX.Y.Z.zip`). Pour le fabriquer à la main : zipper le dossier `skills/graphite-ui` (le dossier `graphite-ui/` doit être à la racine de l'archive).

## Développer

```bash
npm install
npm run dev        # vitrine
npm test           # rendu des composants, contraste ≥ 4,5:1, aucune couleur en dur, skill à jour
npm run lint && npm run typecheck && npm run build
npm run tokens     # régénère les CSS (et les copies du skill) depuis tokens/tokens.json
npm run shots      # captures sombre/clair × 1440/375 dans docs/captures (après build)
npm run shots:onboarding   # parcours d'onboarding : captures + contrôle axe (contraste compris)
```

`tokens/tokens.json` est la source unique : `npm run tokens` en génère `src/styles/tokens.css`, `src/styles/themes/*.css` et les copies du skill ; un test échoue si l'un d'eux est périmé.

## Publier une version

1. Passer la version à `X.Y.Z` dans `package.json`, `showcase/package.json` et `package-lock.json` (les deux lignes `version` du lockfile), ajouter l'entrée du [CHANGELOG](CHANGELOG.md), ouvrir une PR vers `main`, CI verte, fusionner.
2. GitHub → **Actions → Release → Run workflow** (branche `main`), saisir `X.Y.Z`.
3. Le workflow vérifie que la version est celle de `package.json`, publie `@lucgsn/graphite-ui@X.Y.Z` sur GitHub Packages, crée le tag `vX.Y.Z` et la release avec le zip du skill (`graphite-ui-skill-vX.Y.Z.zip`). Une version déjà publiée n'est jamais republiée.

## Déployer la vitrine sur Vercel

Importer le dépôt dans Vercel, **Root Directory = `showcase`**, framework Next.js. L'option « Include source files outside of the Root Directory » (activée par défaut) est nécessaire : la vitrine importe `../src`.
