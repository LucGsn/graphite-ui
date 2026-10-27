"use client";

import { useMemo, useState } from "react";
import { Sprout, Star } from "lucide-react";
import {
  Button,
  OnboardingShell,
  createLocalDraftStore,
  validateQuestionnaire,
  type Answers,
  type CustomStep,
} from "graphite-ui";
import raw from "./questionnaire.example.json";

// Le document vient d'un fichier ou d'une IA : on le valide AVANT de l'afficher.
const validation = validateQuestionnaire(raw);
if (!validation.ok) throw new Error("Questionnaire non conforme");
const questionnaire = validation.questionnaire;

// Les clés `icon` du questionnaire sont résolues ici ; le JSON ne porte jamais de code.
const icones = { seed: <Sprout />, star: <Star /> };

/** Onboarding complet : accueil personnalisé, une question par écran, brouillon local, récapitulatif, écran de fin. */
export default function Onboarding() {
  const store = useMemo(() => createLocalDraftStore("mon-app.onboarding", questionnaire), []);
  const [draft] = useState(() => store.load());
  const [answers, setAnswers] = useState<Answers>(draft?.answers ?? {});

  const customSteps: CustomStep[] = [
    {
      id: "accueil",
      placement: "start",
      hideNavigation: true,
      title: "Bienvenue",
      render: ({ next }) => (
        <div className="py-16 text-center">
          <h1 tabIndex={-1} className="text-2xl font-semibold outline-none">
            Préparons votre espace
          </h1>
          <Button variant="primary" className="mt-8" onClick={next}>
            Commencer
          </Button>
        </div>
      ),
    },
  ];

  return (
    <OnboardingShell
      questionnaire={questionnaire}
      answers={answers}
      onAnswersChange={setAnswers}
      mode="question"
      customSteps={customSteps}
      iconMap={icones}
      initialStepId={draft?.stepId}
      onSave={(d) => store.save(d)}
      onComplete={async (reponses) => {
        await fetch("/api/onboarding", { method: "POST", body: JSON.stringify(reponses) });
        store.clear();
      }}
      completion={{ title: "Merci, c'est terminé" }}
    />
  );
}
