"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Gauge,
  ListChecks,
  MessageSquare,
  Sprout,
  Star,
  Table,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  Button,
  OnboardingShell,
  ToggleGroup,
  createLocalDraftStore,
  validateQuestionnaire,
  type Answers,
  type CustomStep,
  type FlowMode,
  type IconMap,
  type Questionnaire,
} from "graphite-ui";
import exemple from "../../skills/graphite-ui/examples/questionnaire.example.json";
import { ThemeSwitcher } from "./theme-switcher";

const validation = validateQuestionnaire(exemple);
if (!validation.ok) throw new Error("Questionnaire de démonstration invalide");
const questionnaire: Questionnaire = validation.questionnaire;

/** Les clés `icon` du schéma sont résolues ici : le schéma ne porte jamais de code. */
const ICONS: IconMap = {
  seed: <Sprout />,
  gauge: <Gauge />,
  star: <Star />,
  file: <FileText />,
  chat: <MessageSquare />,
  table: <Table />,
  list: <ListChecks />,
};

const MODES = [
  { value: "question", label: "Par question" },
  { value: "section", label: "Par section" },
];

/** Page de démonstration : onboarding complet sur un questionnaire fictif, avec brouillon local et deux écrans personnalisés. */
export function OnboardingDemo() {
  const store = useMemo(() => createLocalDraftStore("graphite-ui.demo.onboarding", questionnaire), []);
  const [mode, setMode] = useState<FlowMode>("question");
  const [answers, setAnswers] = useState<Answers>({});
  const [initialStepId, setInitialStepId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [run, setRun] = useState(0);
  const [exited, setExited] = useState(false);

  // Reprise : relit le brouillon du navigateur, s'il existe.
  useEffect(() => {
    const draft = store.load();
    if (draft) {
      setAnswers(draft.answers);
      setInitialStepId(draft.stepId);
    }
    setReady(true);
  }, [store]);

  const restart = useCallback(() => {
    store.clear();
    setAnswers({});
    setInitialStepId(null);
    setExited(false);
    setRun((n) => n + 1);
  }, [store]);

  const customSteps: CustomStep[] = [
    {
      id: "accueil",
      placement: "start",
      title: "Bienvenue",
      hideNavigation: true,
      render: ({ next }) => (
        <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
          <div
            aria-hidden="true"
            className="mb-5 flex size-14 items-center justify-center rounded-full border bg-accent [&_svg]:size-6"
          >
            <Sparkles />
          </div>
          <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">
            Préparons votre espace de travail
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Huit questions, une minute. Vous pouvez enregistrer et reprendre plus tard. Questionnaire fictif
            de démonstration.
          </p>
          <Button variant="primary" className="mt-8 h-11 w-full max-w-xs text-base sm:text-sm" onClick={next}>
            Commencer
          </Button>
        </div>
      ),
    },
    {
      id: "transition",
      placement: { after: "experience" },
      title: "Préparation",
      render: ({ answers: a }) => (
        <div className="flex min-h-[50dvh] flex-col items-center justify-center text-center">
          <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">
            {typeof a.prenom === "string" ? `Merci ${a.prenom}.` : "Merci."}
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Nous adaptons le niveau d'aide à votre aisance. Encore quelques questions sur votre équipe.
          </p>
        </div>
      ),
    },
  ];

  if (!ready) return null;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex min-h-[60px] max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              aria-label="Retour au catalogue"
              className="inline-flex size-9 items-center justify-center rounded-md text-muted outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/30"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <span className="truncate text-sm font-semibold uppercase tracking-[0.7px]">Onboarding</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              label="Mode d'affichage : une question ou une section par écran"
              options={MODES}
              value={mode}
              onValueChange={(v) => {
                setMode(v as FlowMode);
                setInitialStepId(null);
                setRun((n) => n + 1);
              }}
            />
            <Button size="sm" onClick={restart}>
              Recommencer
            </Button>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {exited ? (
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Brouillon enregistré</h2>
          <p className="mt-2 text-sm text-muted">
            Vos réponses sont gardées dans ce navigateur. Revenez quand vous voulez.
          </p>
          <Button variant="primary" className="mt-8" onClick={() => setExited(false)}>
            Reprendre
          </Button>
        </div>
      ) : (
        <OnboardingShell
          key={`${mode}-${run}`}
          className="min-h-[calc(100dvh-60px)]"
          questionnaire={questionnaire}
          answers={answers}
          onAnswersChange={setAnswers}
          mode={mode}
          customSteps={customSteps}
          iconMap={ICONS}
          initialStepId={initialStepId}
          onSave={(draft) =>
            new Promise<void>((resolve) =>
              setTimeout(() => {
                store.save(draft);
                resolve();
              }, 400),
            )
          }
          onExit={() => setExited(true)}
          onComplete={() =>
            new Promise<void>((resolve) =>
              setTimeout(() => {
                store.clear();
                resolve();
              }, 700),
            )
          }
          completion={{
            title:
              typeof answers.prenom === "string"
                ? `Merci ${answers.prenom}, c'est terminé`
                : "Merci, c'est terminé",
            description: "Votre espace est prêt. Ce questionnaire est fictif : rien n'a été envoyé.",
            actions: (
              <>
                <Button variant="primary" onClick={restart}>
                  Recommencer la démo
                </Button>
                <Button onClick={() => (window.location.href = "/")}>Retour au catalogue</Button>
              </>
            ),
          }}
        />
      )}
    </div>
  );
}
