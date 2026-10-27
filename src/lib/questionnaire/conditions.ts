import type { Answer, Answers, Condition, Question, Questionnaire } from "./types";
import { allQuestions } from "./types";

const OPERATORS = ["equals", "in", "notEmpty", "gt", "lt", "contains"] as const;

export function isAnswerEmpty(answer: Answer | undefined): boolean {
  if (answer === undefined) return true;
  if (typeof answer === "string") return answer.trim() === "";
  if (typeof answer === "number") return Number.isNaN(answer);
  if (Array.isArray(answer)) return answer.length === 0;
  return answer.other.trim() === "";
}

/** Évalue une condition sur des réponses ; une réponse absente rend la condition fausse. */
export function evaluateCondition(condition: Condition, answers: Answers): boolean {
  if ("all" in condition) return condition.all.every((c) => evaluateCondition(c, answers));
  if ("any" in condition) return condition.any.some((c) => evaluateCondition(c, answers));
  const answer = answers[condition.question];
  if ("notEmpty" in condition) return !isAnswerEmpty(answer);
  if (answer === undefined) return false;
  if ("equals" in condition) return answer === condition.equals;
  if ("in" in condition) return (condition.in as unknown[]).includes(answer);
  if ("gt" in condition) return typeof answer === "number" && answer > condition.gt;
  if ("lt" in condition) return typeof answer === "number" && answer < condition.lt;
  if ("contains" in condition)
    return Array.isArray(answer) && (answer as unknown[]).includes(condition.contains);
  return false;
}

/** Les opérateurs d'une condition feuille (pour la validation du schéma). */
export const CONDITION_OPERATORS = OPERATORS;

/**
 * Questions visibles pour ces réponses, dans l'ordre. Une question masquée est ignorée, ainsi que sa
 * réponse : une condition qui s'appuie sur elle est évaluée comme si elle n'était pas répondue.
 */
export function visibleQuestions(q: Questionnaire, answers: Answers): Question[] {
  const effective: Answers = {};
  const visible: Question[] = [];
  for (const question of allQuestions(q)) {
    if (question.showIf && !evaluateCondition(question.showIf, effective)) continue;
    visible.push(question);
    if (answers[question.id] !== undefined) effective[question.id] = answers[question.id]!;
  }
  return visible;
}

/** Réponses limitées aux questions visibles (à envoyer au serveur : pas de réponses orphelines). */
export function pruneAnswers(q: Questionnaire, answers: Answers): Answers {
  const out: Answers = {};
  for (const question of visibleQuestions(q, answers)) {
    if (answers[question.id] !== undefined) out[question.id] = answers[question.id]!;
  }
  return out;
}
