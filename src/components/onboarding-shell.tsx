"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "../lib/cn";
import {
  buildSteps,
  createDraft,
  defaultQuestionnaireMessages,
  pruneAnswers,
  resolveLabels,
  validateAnswer,
  validateAnswers,
  type Answers,
  type CustomStepRef,
  type FlowMode,
  type FlowStep,
  type OnboardingDraft,
  type OnboardingLabels,
  type Question,
  type Questionnaire,
  type QuestionnaireMessages,
} from "../lib/questionnaire";
import { Button } from "./button";
import { CompletionScreen, type CompletionScreenProps } from "./completion-screen";
import { ProgressDots } from "./progress-dots";
import { QuestionField, type IconMap } from "./question-field";
import { ReviewSummary } from "./review-summary";
import { SaveIndicator, type SaveStatus } from "./save-indicator";

export interface CustomStepContext {
  next: () => void;
  back: () => void;
  goTo: (stepId: string) => void;
  answers: Answers;
  setAnswers: (answers: Answers) => void;
}

/** Écran fourni par l'app (accueil, transition, démo, paywall…), intercalé n'importe où dans le parcours. */
export interface CustomStep extends CustomStepRef {
  render: (ctx: CustomStepContext) => React.ReactNode;
  /** Nom accessible de l'écran (annoncé quand il prend le focus). */
  title?: string;
  /** Compte dans la progression (défaut : non ; la barre est alors masquée sur cet écran). */
  showProgress?: boolean;
  /** Masque le bouton « Continuer » : l'écran appelle lui-même `ctx.next()`. */
  hideNavigation?: boolean;
  nextLabel?: string;
  /** `false` désactive « Continuer » (défaut : true). */
  canContinue?: boolean;
}

export interface OnboardingShellProps {
  questionnaire: Questionnaire;
  answers: Answers;
  onAnswersChange: (answers: Answers) => void;
  /** `question` : une question par écran (défaut) ; `section` : une section par écran. */
  mode?: FlowMode;
  customSteps?: readonly CustomStep[];
  /** Récapitulatif avant l'envoi (défaut : oui). */
  review?: boolean;
  /** Appelée à l'envoi, avec les réponses aux questions visibles seulement. Une promesse rejetée affiche l'erreur et permet de réessayer. */
  onComplete: (answers: Answers) => void | Promise<void>;
  /** Écran de fin : un nœud, ou les propriétés de CompletionScreen. */
  completion?: React.ReactNode | CompletionScreenProps;
  /** Enregistrement automatique (temporisé) et bouton « Enregistrer et reprendre plus tard ». */
  onSave?: (draft: OnboardingDraft) => void | Promise<void>;
  saveDelayMs?: number;
  /** Appelée après « Enregistrer et reprendre plus tard », une fois le brouillon enregistré. */
  onExit?: (draft: OnboardingDraft) => void;
  /** Étape affichée au départ (reprise d'un brouillon) ; ignorée si elle n'existe plus. */
  initialStepId?: string | null;
  /** Mode contrôlé de l'étape courante. */
  stepId?: string;
  onStepChange?: (stepId: string, index: number) => void;
  labels?: Partial<OnboardingLabels>;
  messages?: Partial<QuestionnaireMessages>;
  iconMap?: IconMap;
  locale?: string;
  className?: string;
}

const isCompletion = (c: unknown): c is CompletionScreenProps =>
  typeof c === "object" && c !== null && !React.isValidElement(c);

/**
 * Parcours d'onboarding : barre de progression (points pour le passé, pilule pour l'étape courante),
 * précédent / continuer collé en bas (désactivé tant que la réponse manque), enregistrement et reprise,
 * récapitulatif puis écran de fin. Questions et écrans personnalisés s'enchaînent dans l'ordre voulu.
 */
export function OnboardingShell({
  questionnaire,
  answers,
  onAnswersChange,
  mode = "question",
  customSteps,
  review = true,
  onComplete,
  completion,
  onSave,
  saveDelayMs = 600,
  onExit,
  initialStepId,
  stepId: controlledStepId,
  onStepChange,
  labels: labelOverrides,
  messages: messageOverrides,
  iconMap,
  locale,
  className,
}: OnboardingShellProps) {
  const labels = resolveLabels(labelOverrides);
  const messages = React.useMemo(
    () => ({ ...defaultQuestionnaireMessages, ...messageOverrides }),
    [messageOverrides],
  );
  const steps = buildSteps<CustomStep>(questionnaire, answers, { mode, customSteps, review });

  const [innerId, setInnerId] = React.useState<string | null>(initialStepId ?? null);
  const requested = controlledStepId ?? innerId;
  const index = Math.max(
    0,
    steps.findIndex((s) => s.id === requested),
  );
  const step = steps[index]!;
  const stepId = step.id;

  const [phase, setPhase] = React.useState<"flow" | "done">("flow");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(false);
  const [touched, setTouched] = React.useState<Set<string>>(() => new Set());
  const uid = React.useId();
  const headingId = `${uid}-title`;
  const helpId = `${uid}-help`;
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const regionRef = React.useRef<HTMLDivElement>(null);

  const goTo = React.useCallback(
    (id: string) => {
      const i = steps.findIndex((s) => s.id === id);
      if (i < 0) return;
      setInnerId(id);
      onStepChange?.(id, i);
    },
    // `steps` est recalculé à chaque rendu ; seule son identité fonctionnelle compte ici.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [steps.map((s) => s.id).join("|"), onStepChange],
  );

  // Focus sur le titre de l'étape à chaque changement (pas au premier rendu) : annoncé au lecteur d'écran.
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    (headingRef.current ?? regionRef.current)?.focus();
  }, [stepId, phase]);

  // ---- Enregistrement ---------------------------------------------------
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const saveSeq = React.useRef(0);
  const latest = React.useRef({ answers, stepId });
  latest.current = { answers, stepId };
  const save = React.useCallback(async (): Promise<OnboardingDraft | null> => {
    if (!onSave) return null;
    const draft = createDraft(questionnaire, latest.current.answers, latest.current.stepId);
    const seq = ++saveSeq.current;
    setSaveStatus("saving");
    try {
      await onSave(draft);
      if (seq === saveSeq.current) setSaveStatus("saved");
      return draft;
    } catch {
      if (seq === saveSeq.current) setSaveStatus("error");
      return null;
    }
  }, [onSave, questionnaire]);

  const firstSave = React.useRef(true);
  React.useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    if (!onSave || phase === "done") return;
    const t = setTimeout(() => void save(), saveDelayMs);
    return () => clearTimeout(t);
  }, [answers, stepId, onSave, save, saveDelayMs, phase]);

  // ---- Validité de l'étape ----------------------------------------------
  const stepQuestions: Question[] =
    step.kind === "question" ? [step.question] : step.kind === "section" ? step.questions : [];
  const errors = Object.fromEntries(
    stepQuestions.map((q) => [q.id, validateAnswer(q, answers[q.id], messages)] as const),
  );
  const questionsValid = stepQuestions.every((q) => !errors[q.id]);
  const optionalEmpty =
    stepQuestions.length > 0 && stepQuestions.every((q) => !q.required && answers[q.id] === undefined);
  const canContinue =
    step.kind === "custom"
      ? step.custom.canContinue !== false
      : step.kind === "review"
        ? validateAnswers(questionnaire, answers, messages).ok
        : questionsValid;

  const isLast = index === steps.length - 1;
  const submit = async () => {
    setSubmitting(true);
    setSubmitError(false);
    try {
      await onComplete(pruneAnswers(questionnaire, answers));
      setPhase("done");
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };
  const next = () => {
    if (isLast) void submit();
    else goTo(steps[index + 1]!.id);
  };
  const back = () => {
    if (index > 0) goTo(steps[index - 1]!.id);
  };

  if (phase === "done") {
    const done =
      completion === undefined || isCompletion(completion) ? (
        <CompletionScreen labels={labelOverrides} {...(completion as CompletionScreenProps | undefined)} />
      ) : (
        completion
      );
    return <div className={cn("mx-auto min-h-dvh w-full max-w-xl", className)}>{done}</div>;
  }

  // ---- Progression -------------------------------------------------------
  const counts = (s: FlowStep<CustomStep>) => s.kind !== "custom" || s.custom.showProgress === true;
  const counted = steps.filter(counts);
  const current = counts(step) ? counted.indexOf(step) + 1 : 0;

  const editTarget = (questionId: string) =>
    mode === "section"
      ? (questionnaire.sections.find((s) => s.questions.some((q) => q.id === questionId))?.id ?? questionId)
      : questionId;

  const ctx: CustomStepContext = { next, back, goTo, answers, setAnswers: onAnswersChange };

  const setAnswer = (question: Question, value: Answers[string] | undefined) => {
    const nextAnswers = { ...answers };
    if (value === undefined) delete nextAnswers[question.id];
    else nextAnswers[question.id] = value;
    onAnswersChange(nextAnswers);
  };
  const fieldFor = (question: Question, own: boolean) => {
    const e = errors[question.id];
    const show =
      e &&
      (e.code === "required"
        ? touched.has(question.id)
        : answers[question.id] !== undefined || touched.has(question.id));
    return (
      <QuestionField
        key={question.id}
        question={question}
        value={answers[question.id]}
        onChange={(v) => setAnswer(question, v)}
        error={show ? e.message : null}
        labels={labelOverrides}
        iconMap={iconMap}
        locale={locale}
        showHeader={own}
        labelledBy={own ? undefined : headingId}
        describedBy={own ? undefined : question.help ? helpId : undefined}
        align={own ? "start" : "center"}
        onBlur={() => setTouched((t) => (t.has(question.id) ? t : new Set(t).add(question.id)))}
      />
    );
  };

  const hideNav = step.kind === "custom" && step.custom.hideNavigation;
  const ctaLabel =
    step.kind === "custom" && step.custom.nextLabel
      ? step.custom.nextLabel
      : isLast
        ? submitting
          ? labels.submitting
          : labels.submit
        : optionalEmpty
          ? labels.skip
          : labels.next;

  return (
    <div className={cn("mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 sm:px-6", className)}>
      <header className="grid h-16 shrink-0 grid-cols-[2.75rem_1fr_2.75rem] items-center">
        {index > 0 ? (
          <button
            type="button"
            onClick={back}
            aria-label={labels.back}
            className="inline-flex size-11 items-center justify-center rounded-md text-muted outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/30"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
        ) : (
          <span />
        )}
        <div className="flex justify-center">
          {current > 0 ? (
            <ProgressDots current={current} total={counted.length} labels={labelOverrides} />
          ) : null}
        </div>
        <div className="flex justify-end">
          {onSave ? <SaveIndicator status={saveStatus} labels={labelOverrides} compact /> : null}
        </div>
      </header>

      <main className="flex-1 pb-8 pt-4 sm:pt-10">
        {step.kind === "question" ? (
          <>
            <h1
              ref={headingRef}
              id={headingId}
              tabIndex={-1}
              className="text-balance text-center text-2xl font-semibold tracking-tight outline-none"
            >
              {step.question.label}
            </h1>
            {step.question.required ? (
              <p className="mt-1 text-center text-xs text-muted">{labels.required}</p>
            ) : null}
            {step.question.help ? (
              <p id={helpId} className="mt-2 text-center text-sm text-muted">
                {step.question.help}
              </p>
            ) : null}
            <div className="mt-8">{fieldFor(step.question, false)}</div>
          </>
        ) : null}

        {step.kind === "section" ? (
          <>
            <h1
              ref={headingRef}
              id={headingId}
              tabIndex={-1}
              className="text-2xl font-semibold tracking-tight outline-none"
            >
              {step.section.title}
            </h1>
            {step.section.description ? (
              <p className="mt-2 text-sm text-muted">{step.section.description}</p>
            ) : null}
            <div className="mt-8 flex flex-col gap-8">{step.questions.map((q) => fieldFor(q, true))}</div>
          </>
        ) : null}

        {step.kind === "custom" ? (
          <div
            ref={regionRef}
            tabIndex={-1}
            role={step.custom.title ? "region" : undefined}
            aria-label={step.custom.title}
            className="outline-none"
          >
            {step.custom.render(ctx)}
          </div>
        ) : null}

        {step.kind === "review" ? (
          <>
            <h1
              ref={headingRef}
              id={headingId}
              tabIndex={-1}
              className="text-2xl font-semibold tracking-tight outline-none"
            >
              {labels.reviewTitle}
            </h1>
            <p className="mt-2 text-sm text-muted">{labels.reviewDescription}</p>
            <ReviewSummary
              className="mt-6"
              questionnaire={questionnaire}
              answers={answers}
              labels={labelOverrides}
              locale={locale}
              onEdit={(id) => goTo(editTarget(id))}
            />
          </>
        ) : null}
      </main>

      {hideNav ? null : (
        <footer className="sticky bottom-0 -mx-4 border-t bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:-mx-6 sm:px-6">
          {submitError ? (
            <p role="alert" className="mb-3 text-center text-sm font-medium text-danger">
              {labels.submitError}
            </p>
          ) : null}
          {saveStatus === "error" ? (
            <p
              role="alert"
              className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-danger"
            >
              {labels.saveError}
              <button
                type="button"
                onClick={() => void save()}
                className="rounded-md px-1 underline outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              >
                {labels.retry}
              </button>
            </p>
          ) : null}
          <Button
            variant="primary"
            className="h-11 w-full text-base sm:text-sm"
            disabled={!canContinue || submitting}
            onClick={next}
          >
            {ctaLabel}
          </Button>
          {onSave ? (
            <Button
              variant="ghost"
              className="mx-auto mt-2 flex h-11 w-full text-muted"
              onClick={async () => {
                const draft = await save();
                if (draft) onExit?.(draft);
              }}
            >
              {labels.saveDraft}
            </Button>
          ) : null}
        </footer>
      )}
    </div>
  );
}
