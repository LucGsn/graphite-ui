import { validateAnswer } from "./validate";
import { allQuestions, type Answers, type Questionnaire } from "./types";

/** Brouillon d'un parcours : de quoi reprendre là où l'utilisateur s'était arrêté. */
export interface OnboardingDraft {
  version: 1;
  questionnaireId: string;
  schemaVersion: number;
  /** Étape courante (identifiant de question, de section ou d'écran personnalisé). */
  stepId: string | null;
  answers: Answers;
  savedAt: string;
}

export function createDraft(
  q: Questionnaire,
  answers: Answers,
  stepId: string | null,
  now = new Date(),
): OnboardingDraft {
  return {
    version: 1,
    questionnaireId: q.id,
    schemaVersion: q.schemaVersion,
    stepId,
    answers,
    savedAt: now.toISOString(),
  };
}

/**
 * Relit un brouillon (JSON déjà parsé ou texte). Renvoie `null` s'il est illisible, d'une autre version ou
 * d'un autre questionnaire ; les réponses à des questions disparues ou devenues invalides sont écartées.
 */
export function restoreDraft(
  q: Questionnaire,
  raw: unknown,
): { answers: Answers; stepId: string | null; savedAt: string } | null {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof value !== "object" || value === null) return null;
  const d = value as Partial<OnboardingDraft>;
  if (d.version !== 1 || d.questionnaireId !== q.id || d.schemaVersion !== q.schemaVersion) return null;
  if (typeof d.answers !== "object" || d.answers === null || Array.isArray(d.answers)) return null;
  const answers: Answers = {};
  for (const question of allQuestions(q)) {
    const a = (d.answers as Answers)[question.id];
    if (a === undefined) continue;
    // « required » n'est pas un défaut de la réponse elle-même : seule sa forme compte ici.
    const e = validateAnswer({ ...question, required: false }, a);
    if (!e) answers[question.id] = a;
  }
  return {
    answers,
    stepId: typeof d.stepId === "string" ? d.stepId : null,
    savedAt: typeof d.savedAt === "string" ? d.savedAt : "",
  };
}

export interface DraftStore {
  load(): { answers: Answers; stepId: string | null; savedAt: string } | null;
  save(draft: OnboardingDraft): void;
  clear(): void;
}

/** Brouillon dans le navigateur (`localStorage`) ; sans stockage disponible, il ne fait rien (sans erreur). */
export function createLocalDraftStore(key: string, q: Questionnaire): DraftStore {
  const storage = () => {
    try {
      return typeof localStorage === "undefined" ? null : localStorage;
    } catch {
      return null;
    }
  };
  return {
    load() {
      try {
        return restoreDraft(q, storage()?.getItem(key) ?? null);
      } catch {
        return null;
      }
    },
    save(draft) {
      try {
        storage()?.setItem(key, JSON.stringify(draft));
      } catch {
        // stockage plein ou indisponible : le parcours continue sans reprise
      }
    },
    clear() {
      try {
        storage()?.removeItem(key);
      } catch {
        // rien à nettoyer
      }
    },
  };
}
