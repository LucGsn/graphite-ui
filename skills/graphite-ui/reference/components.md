# Référence des composants

Tous s'importent de `"graphite-ui"`. Les composants marqués (client) utilisent des hooks : ils fonctionnent dans une page serveur Next.js tant qu'on ne leur passe pas de fonction (voir « Frontière serveur/client »).

## Base

| Composant              | Props principales                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `Button`               | `variant` `default`\|`primary`\|`ghost` · `size` `md`\|`sm` · props de `<button>`  |
| `IconButton`           | `label` (obligatoire) · `variant` (défaut `ghost`)                                 |
| `Badge`                | `tone` `success`\|`warning`\|`danger`\|`neutral` · `dot` (défaut `true`)           |
| `StatusDot`            | `tone`                                                                             |
| `Card`, `CardHeader`   | `CardHeader` : `title` · `subtitle` · `actions`                                    |
| `KpiStat`              | `label` · `value` · `unit` · `caption` · `badge` · `info` · `icon` · `placeholder` |
| `KpiGrid`              | 4 colonnes dès 1024 px, 2 dès 640 px                                               |
| `InfoTooltip` (client) | `text` · `label` · `icon` · `align` `start`\|`end`                                 |

## Coque et navigation

| Composant                      | Props principales                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `AppShell` (client)            | `sidebar` · `mobileTitle` · `menuLabel` · `closeLabel`                                                                  |
| `Sidebar`                      | `brand` · `sections: {title?, items: {label, href, icon?, active?}[]}[]` · `footer` · `linkComponent` (ex. `next/link`) |
| `PageHeader`                   | `title` · `description` · `actions`                                                                                     |
| `SectionTitle`, `GroupDivider` | texte en enfants                                                                                                        |
| `Tabs` (client)                | `items: {value,label}[]` · `value` · `onValueChange` · `label` · `idPrefix`                                             |

## Contrôles

| Composant               | Props principales                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `ToggleGroup` (client)  | `options: {value,label,icon?}[]` · `label` · `type` `single`\|`multiple` · `value` · `onValueChange` |
| `ModeSwitch` (client)   | `modes: [opt, opt]` · `value` · `onValueChange` · `label`                                            |
| `FilterSelect` (client) | `label` · `options: {value,label}[]` · `value` · `onValueChange`                                     |

## Données

| Composant            | Props principales                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `List`, `ListRow`    | `ListRow` : `initials` · `tone` · `title` · `detail` · `meta`                                                            |
| `DataTable` (client) | `columns: {key, header, cell?, sortValue?, numeric?, align?}[]` · `rows` · `rowKey` · `caption` · `empty` · `onRowClick` |
| `Drawer` (client)    | `open` · `onClose` · `title` · `description` · `closeLabel`                                                              |
| `EmptyState`         | `icon` · `title` · `description` · `action`                                                                              |

## Graphiques (Recharts)

| Composant            | Props principales                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `ChartCard`          | `title` · `subtitle` · `actions` · `legend: {label,color}[]` · `footnote`                                                                    |
| `BarChart` (client)  | `data: {label,value,color?}[]` · `orientation` `horizontal`\|`vertical` · `unit` · `formatValue` · `height` · `label`                        |
| `LineChart` (client) | `data` · `xKey` · `series: {key,label,color,band?:{lower,upper}}[]` · `unit` · `formatValue` · `yDomain` · `hideLegend` · `height` · `label` |
| `Treemap` (client)   | `items: {id,label,value,intensity,detail?,href?}[]` · `ratio` · `label` · `linkComponent`                                                    |

`color` : `green` \| `amber` \| `slate` \| `gray` \| `red` \| `foreground` (les tokens `--chart-*`).

## Onboarding et questionnaires

Tous (client). Le questionnaire est un document JSON (contrat, validation et boucle IA : [questionnaire.md](questionnaire.md)). `graphite-ui/questionnaire` exporte le contrat sans React.

| Composant               | Props principales                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OnboardingShell`       | `questionnaire` · `answers` + `onAnswersChange` (contrôlé) · `mode` `question` (défaut) \| `section` · `customSteps` · `review` (défaut `true`) · `onComplete(answers)` · `completion` · `onSave(draft)` · `saveDelayMs` · `onExit(draft)` · `initialStepId` · `stepId` + `onStepChange` · `labels` · `messages` · `iconMap` · `locale` |
| `QuestionnaireRenderer` | `questionnaire` · `answers` + `onAnswersChange` · `only` `{ section }` \| `{ question }` · `showSectionHeadings` · `labels` · `messages` · `iconMap` · `locale` : affiche tout le questionnaire (ou une section, ou une question) sans coque                                                                                            |
| `QuestionField`         | `question` · `value` · `onChange` · `error` · `iconMap` · `labels` : une question de n'importe quel type                                                                                                                                                                                                                                |
| `ProgressDots`          | `current` (à partir de 1) · `total` : passé en points, étape courante en pilule ; au-delà de 12 étapes, pilule et « n / total »                                                                                                                                                                                                         |
| `SaveIndicator`         | `status` `idle` \| `saving` \| `saved` \| `error` · `compact`                                                                                                                                                                                                                                                                           |
| `ReviewSummary`         | `questionnaire` · `answers` · `onEdit(questionId)` · `locale`                                                                                                                                                                                                                                                                           |
| `CompletionScreen`      | `title` · `description` · `icon` · `children` · `actions` · `autoFocus`                                                                                                                                                                                                                                                                 |

Fonctions : `validateQuestionnaire(json)` · `validateQuestionnaireText(texte)` · `formatSchemaErrors(erreurs)` · `validateAnswers(q, réponses)` · `visibleQuestions(q, réponses)` · `pruneAnswers` · `buildSteps` · `createLocalDraftStore(clé, q)` · `restoreDraft(q, brut)` · `formatAnswer(question, réponse)`.

**Comportement de `OnboardingShell`**

- **Une question par écran** (défaut) : titre centré, puces centrées ou cartes, « Continuer » collé en bas, **désactivé tant qu'une réponse obligatoire manque** (ou invalide) ; « Passer » si la question est facultative et vide. **Une section par écran** : titre de section, toutes ses questions visibles.
- **Progression** : points pour le passé, pilule pour l'étape courante, futur masqué ; les questions masquées par `showIf` ne comptent pas.
- **Écrans personnalisés** (`customSteps`) : `{ id, placement, render(ctx), title?, showProgress?, hideNavigation?, nextLabel?, canContinue?, showIf? }`. `placement` : `"start"`, `"end"` (avant le récapitulatif), `{ before: id }` ou `{ after: id }` (id d'une question **ou** d'une section). `ctx` : `next`, `back`, `goTo(id)`, `answers`, `setAnswers`. Sans `showProgress`, la barre est masquée sur l'écran ; avec `hideNavigation`, l'écran appelle lui-même `ctx.next()`.
- **Enregistrement** : avec `onSave`, le brouillon (`{ version, questionnaireId, stepId, answers, savedAt }`) est enregistré après `saveDelayMs` (600 ms) sans saisie, et par « Enregistrer et reprendre plus tard » (puis `onExit`). L'indicateur dit « Enregistrement… », « Enregistré » ou « Échec » (avec « Réessayer »). Reprise : `initialStepId` (une étape disparue ramène au début).
- **Envoi** : `onComplete` reçoit les réponses des questions **visibles** seulement. Une promesse rejetée affiche l'erreur et permet de réessayer ; sinon `completion` s'affiche (nœud, ou props de `CompletionScreen`).
- **Textes** : tout se remplace par `labels` (français par défaut) et `messages` (messages de validation).
- **Accessibilité** : groupes natifs (`fieldset`, boutons radio et cases), erreurs reliées au champ (`aria-describedby`, `role="alert"`), focus sur le titre à chaque étape, classement par boutons monter / descendre annoncés, cibles de 44 px, `prefers-reduced-motion` respecté.

## Frontière serveur/client

Une page serveur ne peut pas passer une **fonction** à un composant client. Pour les graphiques, utiliser `unit="%"` (sérialisable) plutôt que `formatValue`. Pour `DataTable`, `columns` contient des fonctions (`cell`, `sortValue`) : placer le tableau dans un composant `"use client"`. `onClick`, `onValueChange` et `onClose` appartiennent aussi à un composant client.

## Dépannage

- **Aucun style / classes sans effet** : `@source "../node_modules/graphite-ui/src";` manque dans le CSS, ou son chemin relatif est faux.
- **Erreur « Unexpected token » sur du TypeScript** : `transpilePackages: ["graphite-ui"]` manque dans `next.config`.
- **Graphiques vides en test (jsdom)** : définir un `ResizeObserver` factice.
- **Mauvais paquet installé / 401 / 404** : `package.json` doit référencer `"graphite-ui": "npm:@lucgsn/graphite-ui@X.Y.Z"` (et non `"graphite-ui": "^…"`, autre paquet sur le registre npm public) ; le `.npmrc` doit contenir `@lucgsn:registry=https://npm.pkg.github.com` et `//npm.pkg.github.com/:_authToken=${NPM_TOKEN}` ; `NPM_TOKEN` (jeton classic `read:packages`) doit être défini en local et dans Vercel (Production, Preview, Development).
