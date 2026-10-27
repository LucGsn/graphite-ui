# Questionnaires et onboarding

Un questionnaire est un **document JSON** (contrat versionné) que `OnboardingShell` et `QuestionnaireRenderer` affichent directement. Une IA peut le générer ; `validateQuestionnaire` dit si le document est conforme et, sinon, **où et pourquoi** il ne l'est pas. graphite-ui ne contient aucun appel à un fournisseur d'IA : l'app appelle le modèle de son choix, puis valide.

Fichiers : schéma JSON [questionnaire.schema.json](questionnaire.schema.json) · exemple complet (les 8 types) [../examples/questionnaire.example.json](../examples/questionnaire.example.json) · page [../examples/onboarding.tsx](../examples/onboarding.tsx) · script [../examples/validate-questionnaire.ts](../examples/validate-questionnaire.ts).

## 1. Le contrat (version 1)

```json
{ "schemaVersion": 1, "id": "…", "title": "…", "description": "…", "sections": [ { "id": "…", "title": "…", "description": "…", "questions": [ … ] } ] }
```

- **Identifiants** (`id`) : lettres, chiffres, `-` et `_`. **Uniques dans tout le document** (sections et questions confondues). Stables : ils servent de clés dans les réponses.
- **Propriétés inconnues interdites** : toute propriété hors de la liste est une erreur.
- **Ordre** : une condition `showIf` ne peut viser qu'une question placée **avant**.

Propriétés communes à toutes les questions : `id`, `type`, `label` (obligatoires) · `help` · `required` (défaut `false`) · `showIf`.

| `type`     | Propriétés propres                                                   | Réponse (`Answers[id]`)                             |
| ---------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| `single`   | `options` (≥ 2) · `display` `chips`\|`cards` · `allowOther`          | `"valeur"` ou `{ "other": "texte" }`                |
| `multiple` | `options` (≥ 2) · `display` · `allowOther` · `maxChoices`            | `["valeur", …]` (peut contenir un `{ "other": … }`) |
| `scale`    | `min` · `max` (entiers, 11 points au plus) · `minLabel` · `maxLabel` | entier entre `min` et `max`                         |
| `short`    | `placeholder` · `maxLength`                                          | texte                                               |
| `long`     | `placeholder` · `maxLength`                                          | texte                                               |
| `number`   | `min` · `max` · `step` · `unit` · `placeholder`                      | nombre                                              |
| `date`     | `min` · `max` (`AAAA-MM-JJ`)                                         | `"AAAA-MM-JJ"`                                      |
| `ranking`  | `options` (≥ 2)                                                      | toutes les valeurs, dans l'ordre choisi             |

Option : `{ "value": "…", "label": "…", "description"?: "…", "icon"?: "clé" }`. `icon` est une **clé** que l'app résout avec la prop `iconMap` (jamais un nom de fichier, une URL ni du code). `allowOther` : `true` ou `{ "label"?, "placeholder"? }` ajoute « Autre, préciser » avec texte libre ; il compte pour un choix dans `maxChoices`.

`display` : `chips` (puces, défaut : réponses courtes) ou `cards` (cartes empilées : options avec description).

### Affichage conditionnel (`showIf`)

Un seul opérateur par condition feuille, sur une question **précédente** :

| Opérateur  | Vrai quand…                                        | Types visés                                   |
| ---------- | -------------------------------------------------- | --------------------------------------------- |
| `equals`   | la réponse est égale à la valeur                   | `single` (valeur d'option), `scale`, `number` |
| `in`       | la réponse est l'une des valeurs de la liste       | idem                                          |
| `notEmpty` | la question a une réponse (`true`)                 | tous                                          |
| `gt`, `lt` | la réponse est strictement supérieure / inférieure | `scale`, `number`                             |
| `contains` | la liste de réponses contient la valeur d'option   | `multiple`                                    |

Combinaisons, imbriquables : `{ "all": [ … ] }` (ET) et `{ "any": [ … ] }` (OU).

```json
"showIf": { "all": [ { "question": "taille-equipe", "gt": 5 }, { "any": [ { "question": "mode", "equals": "distance" }, { "question": "outils", "contains": "visio" } ] } ] }
```

Une question masquée n'est ni validée ni envoyée, et une condition qui s'appuie sur elle est évaluée comme si elle n'avait pas de réponse.

## 2. Valider

````ts
import {
  validateQuestionnaire,
  validateQuestionnaireText,
  formatSchemaErrors,
} from "graphite-ui/questionnaire";

const r = validateQuestionnaireText(reponseBruteDuModele); // accepte une clôture ```json
if (!r.ok)
  console.log(formatSchemaErrors(r.errors)); // une ligne par erreur : « - chemin : message »
else r.questionnaire; // typé `Questionnaire`
````

`graphite-ui/questionnaire` est le contrat **sans React** (serveur, scripts, tests). Il exporte aussi `validateAnswers` / `validateAnswer` (réponses, avec messages en français remplaçables), `buildSteps`, `visibleQuestions`, `pruneAnswers`, `createLocalDraftStore` / `restoreDraft` (brouillon versionné). En ligne de commande : `npx tsx examples/validate-questionnaire.ts questionnaire.json`.

## 3. La boucle pour une IA : générer → valider → corriger → revalider

1. **Générer.** Donner au modèle le prompt de la section 4 (schéma inclus) et la consigne métier. Il renvoie un document JSON.
2. **Valider** avec `validateQuestionnaireText(texte)`. Si `ok`, s'arrêter : le document est affichable tel quel.
3. **Corriger.** Sinon, renvoyer au modèle **le document et la liste exacte des erreurs** (`formatSchemaErrors`), en lui demandant le document complet corrigé, sans commentaire.
4. **Revalider.** Recommencer à l'étape 2. **Au plus 3 corrections** ; au-delà, signaler l'échec à une personne au lieu d'afficher un document non conforme.

Ne jamais « réparer » le JSON à la main dans la boucle et ne jamais afficher un document qui n'a pas passé `validateQuestionnaire`.

```ts
import { validateQuestionnaireText, formatSchemaErrors, type Questionnaire } from "graphite-ui/questionnaire";

type Message = { role: "user" | "assistant"; content: string };
/** À fournir par l'app : appelle le modèle de son choix et renvoie son texte. */
type AskModel = (system: string, messages: Message[]) => Promise<string>;

export async function generateQuestionnaire(
  askModel: AskModel,
  system: string,
  brief: string,
  maxFixes = 3,
): Promise<Questionnaire> {
  const messages: Message[] = [{ role: "user", content: brief }];
  for (let attempt = 0; attempt <= maxFixes; attempt++) {
    const text = await askModel(system, messages);
    const result = validateQuestionnaireText(text);
    if (result.ok) return result.questionnaire;
    if (attempt === maxFixes)
      throw new Error(
        `Questionnaire non conforme après ${maxFixes} corrections :\n${formatSchemaErrors(result.errors)}`,
      );
    messages.push(
      { role: "assistant", content: text },
      {
        role: "user",
        content: `Le document n'est pas conforme au contrat. Erreurs :\n${formatSchemaErrors(result.errors)}\n\nRenvoie le document JSON COMPLET corrigé, sans commentaire.`,
      },
    );
  }
  throw new Error("inatteignable");
}
```

### Exemple de correction

Document généré (extrait) :

```json
{
  "id": "equipe",
  "type": "radio",
  "label": "Où travaille l'équipe ?",
  "options": [{ "value": "site", "label": "Sur site" }]
}
```

Erreurs renvoyées par `formatSchemaErrors` :

```
- sections[1].questions[1].type : Type inconnu "radio" (types : single, multiple, scale, short, long, number, date, ranking).
```

Le modèle corrige (`"type": "single"` et ajoute une 2ᵉ option, car il en faut au moins 2) ; `validateQuestionnaire` renvoie alors `ok: true`. Autres erreurs courantes : identifiant en double, `showIf` qui vise une question placée après, `maxChoices` plus grand que le nombre de choix, valeur de condition absente des options.

## 4. Modèle de prompt pour générer un questionnaire

À utiliser comme message système ; remplacer les `{{…}}`. Joindre le contenu de `reference/questionnaire.schema.json` à la place de `{{SCHEMA}}`.

````text
Tu génères un questionnaire d'onboarding au format JSON « graphite-ui », version 1.

SORTIE
- Réponds UNIQUEMENT avec un document JSON valide : pas de texte autour, pas de commentaire, pas de virgule finale. Une clôture ```json est tolérée.
- Le document doit respecter exactement ce schéma JSON :
{{SCHEMA}}

RÈGLES (le schéma seul ne les exprime pas toutes)
1. "schemaVersion" vaut 1. "id" (document, sections, questions) : lettres, chiffres, "-" et "_" ; unique dans TOUT le document.
2. N'invente aucune propriété : toute propriété absente du schéma est une erreur.
3. Types : single (un choix), multiple (plusieurs choix), scale (échelle entière, 11 points au plus), short (texte court), long (texte long), number, date (AAAA-MM-JJ), ranking (classement de toutes les options).
4. single, multiple et ranking : au moins 2 options ; "value" unique dans la question, "label" lisible. "description" seulement si elle aide à choisir (alors "display": "cards"). N'utilise "icon" que si l'app fournit ces clés : {{CLES_ICONES_OU_AUCUNE}}.
5. "allowOther": true ajoute « Autre, préciser » (texte libre) quand la liste ne peut pas être exhaustive. "maxChoices" ne s'applique qu'à multiple et ne dépasse pas le nombre de choix.
6. "showIf" : une seule condition par niveau, sur une question placée AVANT (jamais elle-même ni une suivante). Opérateurs : equals, in, notEmpty, gt, lt, contains (contains : question de type multiple). Combine avec { "all": [...] } (ET) ou { "any": [...] } (OU). Les valeurs de equals / in / contains doivent exister dans les options de la question visée.
7. Une question à la fois : un libellé court, formulé comme une question, sans jargon. "required": true seulement si la réponse est indispensable.
8. Langue : {{LANGUE}}. Ton : {{TON}}. Aucun texte, nom ou donnée propre à un tiers ou à une marque.

CONTEXTE
- Objet du questionnaire : {{OBJET}}
- Public : {{PUBLIC}}
- Nombre de questions visé : {{NOMBRE}} (sections : {{SECTIONS}})
````

Quand le modèle se trompe, la boucle de la section 3 lui renvoie le document et la liste d'erreurs avec la consigne : « Renvoie le document JSON COMPLET corrigé, sans commentaire. »

## 5. Afficher

```tsx
<OnboardingShell
  questionnaire={q}
  answers={answers}
  onAnswersChange={setAnswers}
  mode="question" // ou "section"
  customSteps={[
    {
      id: "accueil",
      placement: "start",
      hideNavigation: true,
      render: ({ next }) => <Bienvenue onStart={next} />,
    },
  ]}
  onSave={(draft) => save(draft)} // brouillon versionné : enregistrement temporisé + reprise
  initialStepId={draft?.stepId}
  onComplete={(answers) => send(answers)} // seulement les réponses aux questions visibles
/>
```

Détail des props et des écrans personnalisés : [components.md](components.md#onboarding-et-questionnaires). Exemple complet : [../examples/onboarding.tsx](../examples/onboarding.tsx).
