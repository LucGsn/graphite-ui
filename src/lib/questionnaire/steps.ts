import { evaluateCondition, visibleQuestions } from "./conditions";
import type { Answers, Condition, Question, Questionnaire, Section } from "./types";

export type FlowMode = "question" | "section";

/** Où insérer un écran personnalisé : début, fin (avant le récapitulatif), ou autour d'une question / section. */
export type StepPlacement = "start" | "end" | { before: string } | { after: string };

/** Description minimale d'un écran personnalisé (le rendu est ajouté par le composant). */
export interface CustomStepRef {
  id: string;
  placement: StepPlacement;
  showIf?: Condition;
}

export const REVIEW_STEP_ID = "__review__";

export type FlowStep<C extends CustomStepRef = CustomStepRef> =
  | { kind: "question"; id: string; question: Question; section: Section }
  | { kind: "section"; id: string; section: Section; questions: Question[] }
  | { kind: "custom"; id: string; custom: C }
  | { kind: "review"; id: typeof REVIEW_STEP_ID };

/**
 * Construit le parcours : questions (ou sections), écrans personnalisés intercalés, récapitulatif.
 * Pure et recalculée à chaque changement de réponses : `showIf` masque les questions (et les sections
 * entièrement masquées) ; un écran personnalisé peut aussi porter un `showIf`.
 */
export function buildSteps<C extends CustomStepRef>(
  q: Questionnaire,
  answers: Answers,
  options: { mode?: FlowMode; customSteps?: readonly C[]; review?: boolean } = {},
): FlowStep<C>[] {
  const { mode = "question", customSteps = [], review = true } = options;
  const visible = new Set(visibleQuestions(q, answers).map((x) => x.id));

  const ids = new Set<string>([REVIEW_STEP_ID]);
  for (const s of q.sections) {
    ids.add(s.id);
    for (const question of s.questions) ids.add(question.id);
  }
  for (const c of customSteps) {
    if (ids.has(c.id))
      throw new Error(`Écran personnalisé « ${c.id} » : identifiant déjà utilisé dans le questionnaire.`);
    ids.add(c.id);
  }

  // Unités, avant masquage : les ancrages restent valables même si la question visée est masquée.
  const units: { step: FlowStep<C>; anchors: string[] }[] = [];
  for (const section of q.sections) {
    if (mode === "section")
      units.push({
        step: { kind: "section", id: section.id, section, questions: section.questions },
        anchors: [section.id, ...section.questions.map((x) => x.id)],
      });
    else
      for (const question of section.questions)
        units.push({
          step: { kind: "question", id: question.id, question, section },
          anchors: [question.id, section.id],
        });
  }

  const inserts = customSteps.map((custom, order) => {
    const { placement } = custom;
    let index: number;
    if (placement === "start") index = 0;
    else if (placement === "end") index = units.length;
    else {
      const before = "before" in placement;
      const anchor = before ? placement.before : placement.after;
      const hits = units.flatMap((u, i) => (u.anchors.includes(anchor) ? [i] : []));
      if (hits.length === 0)
        throw new Error(
          `Écran personnalisé « ${custom.id} » : « ${anchor} » ne correspond à aucune question ni section.`,
        );
      index = before ? hits[0]! : hits[hits.length - 1]! + 1;
    }
    return { index, order, custom };
  });
  inserts.sort((a, b) => a.index - b.index || a.order - b.order);

  const merged: FlowStep<C>[] = [];
  let next = 0;
  const pushCustoms = (upTo: number) => {
    while (next < inserts.length && inserts[next]!.index <= upTo) {
      const { custom } = inserts[next++]!;
      if (!custom.showIf || evaluateCondition(custom.showIf, answers))
        merged.push({ kind: "custom", id: custom.id, custom });
    }
  };
  units.forEach((u, i) => {
    pushCustoms(i);
    const s = u.step;
    if (s.kind === "question") {
      if (visible.has(s.question.id)) merged.push(s);
    } else if (s.kind === "section") {
      const questions = s.section.questions.filter((x) => visible.has(x.id));
      if (questions.length > 0) merged.push({ ...s, questions });
    }
  });
  pushCustoms(units.length);
  if (review) merged.push({ kind: "review", id: REVIEW_STEP_ID });
  return merged;
}
