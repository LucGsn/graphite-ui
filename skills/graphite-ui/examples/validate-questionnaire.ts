// Valide un questionnaire JSON (contrat graphite-ui) : `npx tsx examples/validate-questionnaire.ts questionnaire.json`
// Affiche une ligne par erreur (à renvoyer telle quelle à l'IA qui l'a généré) ; code de sortie 1 si non conforme.
import { readFileSync } from "node:fs";
import { formatSchemaErrors, validateQuestionnaireText } from "graphite-ui/questionnaire";

const fichier = process.argv[2];
if (!fichier) {
  console.error("Usage : npx tsx validate-questionnaire.ts <questionnaire.json>");
  process.exit(2);
}

const resultat = validateQuestionnaireText(readFileSync(fichier, "utf8"));
if (resultat.ok) {
  console.log(
    `Conforme : « ${resultat.questionnaire.title} » (${resultat.questionnaire.sections.length} sections).`,
  );
} else {
  console.error(formatSchemaErrors(resultat.errors));
  process.exit(1);
}
