/** Textes de l'interface d'onboarding (français par défaut) ; chaque composant accepte `labels` partiel. */
export interface OnboardingLabels {
  back: string;
  next: string;
  skip: string;
  submit: string;
  submitting: string;
  required: string;
  progress: string;
  saveDraft: string;
  saving: string;
  saved: string;
  saveError: string;
  retry: string;
  reviewTitle: string;
  reviewDescription: string;
  edit: string;
  noAnswer: string;
  completionTitle: string;
  completionDescription: string;
  submitError: string;
  otherLabel: string;
  otherPlaceholder: string;
  moveUp: string;
  moveDown: string;
  rankPosition: string;
  rankHint: string;
  rankKeep: string;
  maxChoices: string;
  charCount: string;
  selectedCount: string;
}

export const defaultOnboardingLabels: OnboardingLabels = {
  back: "Précédent",
  next: "Continuer",
  skip: "Passer",
  submit: "Envoyer mes réponses",
  submitting: "Envoi en cours…",
  required: "Obligatoire",
  progress: "Étape {current} sur {total}",
  saveDraft: "Enregistrer et reprendre plus tard",
  saving: "Enregistrement…",
  saved: "Enregistré",
  saveError: "Échec de l'enregistrement",
  retry: "Réessayer",
  reviewTitle: "Vérifiez vos réponses",
  reviewDescription: "Relisez avant d'envoyer : chaque réponse reste modifiable.",
  edit: "Modifier",
  noAnswer: "Non renseigné",
  completionTitle: "Merci, c'est terminé",
  completionDescription: "Vos réponses ont bien été enregistrées.",
  submitError: "L'envoi a échoué. Réessayez.",
  otherLabel: "Autre, préciser",
  otherPlaceholder: "Précisez…",
  moveUp: "Monter « {label} »",
  moveDown: "Descendre « {label} »",
  rankPosition: "{label} : position {position} sur {total}",
  rankHint: "Classez du premier au dernier avec les boutons monter / descendre.",
  rankKeep: "Garder cet ordre",
  maxChoices: "{max} choix au plus",
  charCount: "{count} / {max}",
  selectedCount: "{count} sur {max} choisis",
};

export function formatLabel(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

export function resolveLabels(overrides?: Partial<OnboardingLabels>): OnboardingLabels {
  return { ...defaultOnboardingLabels, ...overrides };
}
