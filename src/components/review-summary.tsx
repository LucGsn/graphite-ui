import * as React from "react";
import { cn } from "../lib/cn";
import {
  isAnswerEmpty,
  isOtherChoice,
  resolveLabels,
  visibleQuestions,
  type Answer,
  type Answers,
  type OnboardingLabels,
  type Question,
  type Questionnaire,
} from "../lib/questionnaire";

/** Réponse en texte lisible (libellés des options, nombres et dates selon la locale). */
export function formatAnswer(question: Question, answer: Answer | undefined, locale = "fr-FR"): string {
  if (answer === undefined || isAnswerEmpty(answer)) return "";
  const label = (v: string | { other: string }) =>
    isOtherChoice(v)
      ? v.other
      : ((question.type === "single" || question.type === "multiple" || question.type === "ranking"
          ? question.options.find((o) => o.value === v)?.label
          : undefined) ?? String(v));
  if (Array.isArray(answer)) {
    const items = answer.map(label);
    return question.type === "ranking" ? items.map((t, i) => `${i + 1}. ${t}`).join(" · ") : items.join(", ");
  }
  if (isOtherChoice(answer)) return answer.other;
  if (typeof answer === "number") {
    if (question.type === "scale") return `${answer} / ${question.max}`;
    const n = new Intl.NumberFormat(locale).format(answer);
    return question.type === "number" && question.unit ? `${n} ${question.unit}` : n;
  }
  if (question.type === "date") {
    const d = new Date(`${answer}T00:00:00Z`);
    return Number.isNaN(d.getTime())
      ? answer
      : new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(d);
  }
  return label(answer);
}

export interface ReviewSummaryProps {
  questionnaire: Questionnaire;
  answers: Answers;
  /** Fournie : chaque ligne propose « Modifier » (reçoit l'id de la question). */
  onEdit?: (questionId: string) => void;
  labels?: Partial<OnboardingLabels>;
  locale?: string;
  className?: string;
}

/** Récapitulatif des réponses, par section, aux questions visibles seulement. */
export function ReviewSummary({
  questionnaire,
  answers,
  onEdit,
  labels,
  locale,
  className,
}: ReviewSummaryProps) {
  const l = resolveLabels(labels);
  const visible = new Set(visibleQuestions(questionnaire, answers).map((q) => q.id));
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {questionnaire.sections.map((section) => {
        const questions = section.questions.filter((q) => visible.has(q.id));
        if (questions.length === 0) return null;
        return (
          <section key={section.id} aria-labelledby={`review-${section.id}`}>
            <h2
              id={`review-${section.id}`}
              className="mb-2 text-xs font-semibold uppercase tracking-[0.7px] text-muted"
            >
              {section.title}
            </h2>
            <dl className="divide-y rounded-lg border">
              {questions.map((q) => {
                const text = formatAnswer(q, answers[q.id], locale);
                return (
                  <div key={q.id} className="p-3.5">
                    <dt className="text-sm text-muted">{q.label}</dt>
                    <dd className="mt-0.5 flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          "min-w-0 whitespace-pre-line break-words text-sm font-medium",
                          !text && "font-normal text-muted",
                        )}
                      >
                        {text || l.noAnswer}
                      </span>
                      {onEdit ? (
                        <button
                          type="button"
                          onClick={() => onEdit(q.id)}
                          aria-label={`${l.edit} : ${q.label}`}
                          className="-my-1.5 inline-flex h-9 shrink-0 items-center rounded-md border border-transparent px-2.5 text-sm font-medium text-muted outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/30"
                        >
                          {l.edit}
                        </button>
                      ) : null}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
