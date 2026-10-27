# graphite-ui

Design system neutre, inspiré de Paperclip : gris purs, couleur réservée aux statuts et aux données, peu de texte, gros chiffres, explications au survol. Un cœur neutre, une couche de marque interchangeable, un thème sombre de référence et un thème clair dérivé.

- **Principes et règles d'usage** : [DESIGN.md](DESIGN.md)
- **Thèmes (sombre, clair, marque)** : [docs/THEMING.md](docs/THEMING.md)
- **Vitrine** : tous les composants et variantes, sombre et clair, `npm run dev` (http://localhost:3010)
- **Skill Claude** : [skills/graphite-ui](skills/graphite-ui) — voir « Skill Claude » plus bas

## Composants

`AppShell` · `Sidebar` · `PageHeader` · `SectionTitle` · `GroupDivider` · `Tabs` · `Button` · `IconButton` · `ToggleGroup` · `ModeSwitch` · `FilterSelect` · `Badge` · `StatusDot` · `Card` · `ChartCard` · `KpiStat` · `KpiGrid` · `BarChart` · `LineChart` (bande d'incertitude) · `Treemap` · `List` · `ListRow` · `DataTable` · `Drawer` · `InfoTooltip` · `EmptyState`

Props et pièges : [skills/graphite-ui/reference/components.md](skills/graphite-ui/reference/components.md). Aucun texte ni donnée métier : tout est générique.

## Installer dans une app Next.js existante (Tailwind v4)

Le dépôt est privé : l'accès Git doit être configuré (`gh auth login`, ou une clé SSH). L'installation se fait **depuis Git, avec une version taguée** — jamais depuis le registre npm, où le nom `graphite-ui` appartient à un autre paquet.

```bash
npm install github:LucGsn/graphite-ui#v0.2.0 recharts
# ou, en SSH : npm install git+ssh://git@github.com/LucGsn/graphite-ui.git#v0.2.0 recharts
```

`recharts` n'est nécessaire que pour `BarChart` et `LineChart`.

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

**Mettre à jour** : changer le tag dans `package.json` (`#v0.3.0`), puis `npm install`. Les versions sont des tags Git `vX.Y.Z` ; chaque tag crée une release GitHub (avec le zip du skill).

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
```

`tokens/tokens.json` est la source unique : `npm run tokens` en génère `src/styles/tokens.css`, `src/styles/themes/*.css` et les copies du skill ; un test échoue si l'un d'eux est périmé.

## Déployer la vitrine sur Vercel

Importer le dépôt dans Vercel, **Root Directory = `showcase`**, framework Next.js. L'option « Include source files outside of the Root Directory » (activée par défaut) est nécessaire : la vitrine importe `../src`.
