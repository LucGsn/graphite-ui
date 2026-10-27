# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · versions : [SemVer](https://semver.org/lang/fr/).

Le paquet est publié sur GitHub Packages sous `@lucgsn/graphite-ui` (voir le [README](README.md#installer-dépôt-et-paquet-privés)). Une version n'existe qu'une fois publiée depuis Actions : **0.3.0 est la première version publiée.**

## [0.3.0] — Onboarding et questionnaires

Première version publiée. Elle contient tout ce qui est décrit ci-dessous pour 0.1.0 et 0.2.0.

### Ajouté

- **Questionnaires** : contrat TypeScript et schéma JSON versionnés (`schemaVersion: 1`), huit types de questions (choix unique et multiple, échelle, texte court et long, nombre, date, classement), affichage conditionnel `showIf` (`equals`, `in`, `notEmpty`, `gt`, `lt`, `contains`, combinables en `all` / `any`), `validateQuestionnaire` et `validateQuestionnaireText` (erreurs avec chemin, exploitables par une IA), `validateAnswers`, brouillon versionné. Importable sans React : `@lucgsn/graphite-ui/questionnaire`.
- **Composants** : `OnboardingShell` (une question ou une section par écran, écrans personnalisés intercalés, enregistrement et reprise, récapitulatif, écran de fin), `QuestionnaireRenderer`, `QuestionField` (puces ou cartes, icône et description, « Autre, préciser », nombre maximal de choix), `ProgressDots`, `SaveIndicator`, `ReviewSummary`, `CompletionScreen`.
- **Vitrine** : page `/onboarding` (questionnaire fictif, tous les types, deux écrans personnalisés).
- **Skill et docs** : section « Onboarding et questionnaires » dans `DESIGN.md` ; dans le skill, référence des composants, schéma, boucle de génération par une IA (générer → valider → corriger → revalider) et modèle de prompt.
- **Distribution privée** : publication du paquet sur GitHub Packages par le workflow de release, `.npmrc.example`, procédure d'installation locale et Vercel ; `CHANGELOG.md`.

### Modifié

- Le paquet s'appelle `@lucgsn/graphite-ui` (registre `https://npm.pkg.github.com`) et n'est plus installé depuis Git. Avec l'alias `graphite-ui@npm:@lucgsn/graphite-ui@0.3.0`, les imports restent `graphite-ui`.
- Le workflow de release exige que la version demandée soit celle de `package.json`.
- `$id` du schéma JSON : identifiant `urn:` (plus de lien vers le dépôt).

## [0.2.0] — non publiée

**Jamais publiée** : son tag aurait pointé sur le même code que la 0.3.0. Ses changements sont livrés avec la 0.3.0. Ne pas l'installer ni la référencer.

### Ajouté

- Thème de marque `omnes` aux couleurs de la charte « Business Review » (violet nuit `#120432`, bleu électrique `#0014D0`, vert menthe `#3BC2A2`) et police Arial ; le primaire est la menthe en sombre et le bleu en clair.
- Thème clair « blanc chaud » très subtil (chroma ≤ 0,01 sur tous les fonds), cartes distinguées du fond.
- Tests de contraste : 4,5:1 pour tout texte et 3:1 pour les éléments graphiques, dans les quatre thèmes ; garde-fou contre les secrets ; fins de ligne LF forcées.
- Workflow de release manuel (Actions → Release → Run workflow) qui crée le tag et la release.
- Déploiement de la vitrine sur Vercel (racine `showcase`, `showcase/vercel.json`).

## [0.1.0] — état initial, non publiée

Aucun tag ni release : c'est l'état initial du dépôt.

### Ajouté

- Tokens (`tokens/tokens.json` → CSS) : gris purs, thème sombre de référence et thème clair dérivé, couleur réservée aux statuts et aux données ; thème de marque d'exemple.
- Composants : `AppShell`, `Sidebar`, `PageHeader`, `SectionTitle`, `GroupDivider`, `Tabs`, `Button`, `IconButton`, `ToggleGroup`, `ModeSwitch`, `FilterSelect`, `Badge`, `StatusDot`, `Card`, `ChartCard`, `KpiStat`, `KpiGrid`, `BarChart`, `LineChart`, `Treemap`, `List`, `ListRow`, `DataTable`, `Drawer`, `InfoTooltip`, `EmptyState`.
- Vitrine (catalogue et trois pages d'exemple), `DESIGN.md`, `docs/THEMING.md`, skill Claude, CI (lint, typecheck, tests, build).
- Corrections : `Drawer` sans dépendance à `dom.iterable` chez le consommateur ; Prettier ignore les copies générées des tokens dans le skill.

[0.3.0]: https://github.com/LucGsn/graphite-ui/releases/tag/v0.3.0
