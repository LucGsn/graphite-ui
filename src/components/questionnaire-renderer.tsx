"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import {
  defaultQuestionnaireMessages,
  validateAnswer,
  visibleQuestions,
  type Answer,
  type Answers,
  type OnboardingLabels,
  type Question,
  type Questionnaire,
  type QuestionnaireMessages,
} from "../lib/questionnaire";
import { QuestionField, type IconMap } from "./question-field";

export interface QuestionnaireRendererProps {
  questionnaire: Questionnaire;
  answers: Answers;
  onAnswersChange: (answers: Answers) => void;
  /** Limite l'affichage à une section ou à une question (par défaut : tout le questionnaire). */
  only?: { section: string } | { question: string };
  /** Titres de section au-dessus des questions (défaut : oui quand tout le questionnaire est affiché). */
  showSectionHeadings?: boolean;
  labels?: Partial<OnboardingLabels>;
  messages?: Partial<QuestionnaireMessages>;
  iconMap?: IconMap;
  locale?: string;
  className?: string;
}

/**
 * Affiche un questionnaire (ou une section, ou une question) à partir de son schéma JSON, avec
 * affichage conditionnel et messages de validation. Les erreurs de format apparaissent dès la
 * saisie ; « obligatoire » apparaît quand on quitte un champ resté vide.
 */
export function QuestionnaireRenderer({
  questionnaire,
  answers,
  onAnswersChange,
  only,
  showSectionHeadings,
  labels,
  messages,
  iconMap,
  locale,
  className,
}: QuestionnaireRendererProps) {
  const [touched, setTouched] = React.useState<Set<string>>(() => new Set());
  const msgs = React.useMemo(() => ({ ...defaultQuestionnaireMessages, ...messages }), [messages]);
  const visible = new Set(visibleQuestions(questionnaire, answers).map((q) => q.id));
  const headings = showSectionHeadings ?? !only;

  const setAnswer = (question: Question, value: Answer | undefined) => {
    const next = { ...answers };
    if (value === undefined) delete next[question.id];
    else next[question.id] = value;
    onAnswersChange(next);
  };
  const touch = (id: string) => setTouched((t) => (t.has(id) ? t : new Set(t).add(id)));

  const sections = questionnaire.sections
    .filter(
      (s) =>
        !only ||
        ("section" in only ? s.id === only.section : s.questions.some((q) => q.id === only.question)),
    )
    .map((s) => ({
      section: s,
      questions: s.questions.filter(
        (q) => visible.has(q.id) && (!only || "section" in only || q.id === only.question),
      ),
    }))
    .filter((s) => s.questions.length > 0);

  return (
    <div className={cn("flex flex-col gap-10", className)}>
      {sections.map(({ section, questions }) => (
        <section
          key={section.id}
          aria-labelledby={headings ? `sec-${section.id}` : undefined}
          className="flex flex-col gap-8"
        >
          {headings ? (
            <header>
              <h2 id={`sec-${section.id}`} className="text-lg font-semibold tracking-tight">
                {section.title}
              </h2>
              {section.description ? <p className="mt-1 text-sm text-muted">{section.description}</p> : null}
            </header>
          ) : null}
          {questions.map((question) => {
            const answer = answers[question.id];
            const e = validateAnswer(question, answer, msgs);
            const show =
              e &&
              (e.code === "required"
                ? touched.has(question.id)
                : answer !== undefined || touched.has(question.id));
            return (
              <QuestionField
                key={question.id}
                question={question}
                value={answer}
                onChange={(v) => setAnswer(question, v)}
                error={show ? e.message : null}
                labels={labels}
                iconMap={iconMap}
                locale={locale}
                onBlur={() => touch(question.id)}
              />
            );
          })}
        </section>
      ))}
    </div>
  );
}
