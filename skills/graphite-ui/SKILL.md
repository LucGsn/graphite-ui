---
name: graphite-ui
description: Applique le design system graphite-ui (inspiré de Paperclip) à une interface web : gris neutres purs, thème sombre de référence et clair dérivé, couleur réservée aux statuts et aux données, gros chiffres, peu de texte, explications au survol. À utiliser dès qu'on crée ou refait une app, un tableau de bord, une page de liste ou de détail, un composant React/Tailwind, ou qu'on demande « le design graphite », « le style Paperclip », un thème de marque, ou d'harmoniser une interface avec les autres apps.
---

# graphite-ui

Design system neutre pour apps internes et projets personnels. Cœur gris pur + couche de marque interchangeable.

## 1. Les 8 principes (à tenir sans exception)

1. Gris neutres purs (chroma 0) pour toutes les surfaces et tous les textes.
2. Couleur **réservée** aux statuts (vert / ambre / rouge) et aux données (séries de graphique). Jamais sur un bouton, un titre ou un fond de carte.
3. Peu de texte : titre de page, libellé de 2 à 4 mots, légende d'une ligne.
4. Gros chiffres : 30 px / 600 / −0,75 px (`text-stat`), chiffres tabulaires.
5. Explications au survol (`InfoTooltip` : survol, clic, toucher, clavier) — pas de paragraphes à l'écran.
6. La couleur ne porte jamais seule le sens : point coloré **et** mot ; pastille **et** libellé de légende.
7. Sombre d'abord ; clair dérivé (`data-theme="light"`).
8. Cadres légers : bordure blanc 10 %, pas de fond ni d'ombre sur les cartes ; l'ombre seulement sur ce qui flotte.

## 2. Mettre en place dans une app Next.js (Tailwind v4)

1. Installer depuis le dépôt Git (jamais depuis le registre npm : le nom y est pris par un autre paquet) :
   ```bash
   npm install github:LucGsn/graphite-ui#vX.Y.Z recharts
   ```
2. `next.config.ts` : `transpilePackages: ["graphite-ui"]` (le paquet est livré en TypeScript).
3. `app/globals.css` :
   ```css
   @import "tailwindcss";
   @import "graphite-ui/styles.css";
   @source "../node_modules/graphite-ui/src";
   ```
   (le chemin de `@source` est relatif au fichier CSS).
4. `app/layout.tsx` : `<html lang="fr" data-theme="dark">` ; police Inter via `next/font` avec `variable: "--font-inter"`.
5. Importer les composants : `import { AppShell, Sidebar, KpiStat } from "graphite-ui"`.

Détails et dépannage : `reference/components.md`. Valeurs : `tokens/tokens.json` (source) et `tokens/tokens.css`.

## 3. Composer une page

- **Coque** : `AppShell` + `Sidebar` (groupes formulés comme des questions : « Où en est-on ? », « Pourquoi ? », « Agir »).
- **En-tête** : `PageHeader` (titre seul à gauche, actions à droite : `ModeSwitch` Lecture/Expert, un `Button`).
- **Corps** : `KpiGrid` de `KpiStat` (4 de front au plus), puis `ChartCard` avec `LineChart` / `BarChart` / `Treemap`, séparés par `GroupDivider` et `SectionTitle`.
- **Listes** : `Tabs`, `FilterSelect`, `DataTable` (ligne cliquable → `Drawer`), `List` + `ListRow`, `EmptyState`.

Exemples complets prêts à copier : `examples/dashboard.tsx`, `examples/list.tsx`, `examples/detail.tsx`.

## 4. Règles de composants

- Un seul `Button variant="primary"` par écran.
- `IconButton` : `label` obligatoire.
- `Badge` : un mot, gris ; la couleur est dans le point (`tone`).
- `KpiStat` : pas de cadre ; l'explication va dans `info`, jamais dans le texte.
- Graphiques : `label` obligatoire ; couleur fixée **par série** (jamais par rang) ; valeurs écrites ; dans un composant serveur, `unit="%"` plutôt qu'une fonction `formatValue`.
- `DataTable` : `caption` obligatoire, `numeric` sur les colonnes de nombres.
- Formats français : virgule décimale, espace avant `%`.

## 5. Interdits

- Valeur de couleur en dur (`#888`, `rgb()`, `hsl()`) ou classe Tailwind de couleur brute (`text-slate-500`, `bg-blue-600`) : utiliser les tokens (`text-muted`, `bg-field`, `bg-success`…).
- Accent bleu ou violet « de marque » ; fond coloré sur une carte, un badge ou une ligne.
- Texte sous 10 px ; gris plus clair que les tokens (le contraste 4,5:1 est testé).
- Paragraphe de méthode à l'écran ; carte dans une carte ; plusieurs boutons pleins.

## 6. Thème de marque

Une marque ne change que 2 à 6 tokens (`--primary`, `--primary-foreground`, 1 à 3 séries `--chart-*`), jamais les surfaces. Dans l'app, un bloc CSS après `graphite-ui/styles.css` :

```css
[data-brand="monprojet"] {
  --primary: oklch(78% 0.13 160);
  --primary-foreground: oklch(20.5% 0 0);
}
[data-brand="monprojet"][data-theme="light"] {
  --primary: oklch(40% 0.12 160);
  --primary-foreground: oklch(98.5% 0 0);
}
```

puis `<html data-brand="monprojet">`. Vérifier ≥ 4,5:1 entre `--primary-foreground` et `--primary`. Un exemple fourni : `tokens/theme-omnes.css` (charte « Business Review » : #120432, #0014D0, #3BC2A2, police Arial).

## 7. Onboarding et questionnaires

Pour tout parcours qui pose des questions (onboarding, inscription, qualification, enquête) : **ne pas coder les écrans à la main**. Décrire un questionnaire en JSON (contrat versionné : choix unique ou multiple, échelle, texte court ou long, nombre, date, classement ; affichage conditionnel `showIf` avec `all` / `any`), le **valider**, puis l'afficher avec `OnboardingShell` (une question ou une section par écran, écrans personnalisés intercalés, enregistrement et reprise, récapitulatif, écran de fin).

- Composants et props : [reference/components.md](reference/components.md#onboarding-et-questionnaires). Page prête à copier : `examples/onboarding.tsx`.
- Contrat, validation, **boucle de génération par une IA** (générer → `validateQuestionnaire` → corriger les erreurs signalées → revalider) et **modèle de prompt** : [reference/questionnaire.md](reference/questionnaire.md). Schéma : `reference/questionnaire.schema.json`. Exemple conforme : `examples/questionnaire.example.json`.
- Règles : le questionnaire ne contient ni code ni couleur (les icônes sont des clés résolues par `iconMap`) ; un document qui n'a pas passé `validateQuestionnaire` ne s'affiche jamais ; le contrat s'importe sans React depuis `graphite-ui/questionnaire`.
- Écran : un seul bouton plein (« Continuer »), désactivé tant que la réponse manque ; la couleur n'apparaît que pour les messages d'erreur (point et texte), jamais sur les choix.

## 8. Avant de rendre

- [ ] Aucune couleur en dur ni classe de couleur brute.
- [ ] Couleur uniquement sur statuts et séries ; chaque statut a un mot.
- [ ] Chaque chiffre clé : libellé court + légende d'une ligne ; explication dans `info`.
- [ ] Chaque graphique : `label`, légende écrite, valeurs lisibles.
- [ ] Une seule action primaire ; `IconButton` avec `label`.
- [ ] Rendu vérifié en sombre **et** en clair, à 1440 et 375 px.
- [ ] Questionnaire : document passé par `validateQuestionnaire`, parcours testé au clavier (Tab, flèches, Entrée) et à 375 px.
