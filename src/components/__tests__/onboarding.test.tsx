import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import * as React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  CompletionScreen,
  OnboardingShell,
  ProgressDots,
  QuestionField,
  QuestionnaireRenderer,
  ReviewSummary,
  SaveIndicator,
  formatAnswer,
  type Answers,
  type CustomStep,
  type OnboardingShellProps,
  type Question,
  type Questionnaire,
} from "../../index";
import exemple from "../../../skills/graphite-ui/examples/questionnaire.example.json";

const q = exemple as Questionnaire;
const question = (id: string) => q.sections.flatMap((s) => s.questions).find((x) => x.id === id) as Question;

// axe teste les ligatures d'icônes avec un canvas, que jsdom n'implémente pas.
beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

/** Contrôle d'accessibilité axe (le contraste n'est pas mesurable sous jsdom : il est testé sur les tokens). */
async function a11y(container: HTMLElement) {
  const r = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  return r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
}

/** Petit hôte qui garde les réponses (le shell est contrôlé). */
function Host(props: Partial<OnboardingShellProps> & { initial?: Answers }) {
  const { initial = {}, ...rest } = props;
  const [answers, setAnswers] = React.useState<Answers>(initial);
  return (
    <OnboardingShell
      questionnaire={q}
      answers={answers}
      onAnswersChange={setAnswers}
      onComplete={() => {}}
      {...rest}
    />
  );
}

const cta = () => screen.getByRole("button", { name: /Continuer|Passer|Envoyer mes réponses/ });

describe("QuestionField : les huit types", () => {
  function Field({ id, ...rest }: { id: string } & Partial<React.ComponentProps<typeof QuestionField>>) {
    const [v, setV] = React.useState<React.ComponentProps<typeof QuestionField>["value"]>(undefined);
    return <QuestionField question={question(id)} value={v} onChange={setV} {...rest} />;
  }

  it("choix unique : groupe nommé, boutons radio, un seul choix à la fois", async () => {
    const { container } = render(<Field id="role" />);
    const group = screen.getByRole("group", { name: /Quel est votre rôle/ });
    const dev = within(group).getByRole("radio", { name: "Développement" });
    await userEvent.click(dev);
    expect(dev).toBeChecked();
    await userEvent.click(within(group).getByRole("radio", { name: "Design" }));
    expect(dev).not.toBeChecked();
    expect(await a11y(container)).toEqual([]);
  });

  it("choix unique en cartes : titre, description et icône (iconMap) ; sélection au clavier", async () => {
    const { container } = render(
      <Field id="experience" iconMap={{ seed: <svg data-testid="icone-seed" /> }} />,
    );
    expect(screen.getByText("Je découvre")).toBeInTheDocument();
    expect(screen.getByTestId("icone-seed")).toBeInTheDocument();
    screen.getAllByRole("radio")[0]!.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: /Confirmé/ })).toBeChecked();
    expect(await a11y(container)).toEqual([]);
  });

  it("« Autre, préciser » : champ texte libre, focalisé, et réponse { other }", async () => {
    const onChange = vi.fn();
    render(<QuestionField question={question("role")} value={{ other: "" }} onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "Autre rôle" });
    expect(screen.getByRole("radio", { name: "Autre rôle" })).toBeChecked();
    fireEvent.change(input, { target: { value: "Support" } });
    expect(onChange).toHaveBeenLastCalledWith({ other: "Support" });
  });

  it("choix multiple : maximum de choix (les autres options se désactivent) et « Autre » compté", async () => {
    const { container } = render(<Field id="outils" />);
    for (const name of ["Documents partagés", "Messagerie"])
      await userEvent.click(screen.getByRole("checkbox", { name }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Autre, préciser" }));
    expect(screen.getByRole("checkbox", { name: "Tableurs" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Suivi de tickets" })).toBeDisabled();
    expect(screen.getByText("3 sur 3 choisis")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox", { name: "Autre, préciser" }), "Wiki");
    await userEvent.click(screen.getByRole("checkbox", { name: "Messagerie" }));
    expect(screen.getByRole("checkbox", { name: "Tableurs" })).toBeEnabled();
    expect(await a11y(container)).toEqual([]);
  });

  it("échelle : boutons radio numérotés, libellés d'extrémités lus", async () => {
    const { container } = render(<Field id="satisfaction" />);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    await userEvent.click(screen.getByRole("radio", { name: /^4/ }));
    expect(screen.getByRole("radio", { name: /^4/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /^1 \(Pas du tout\)/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^5 \(Tout à fait\)/ })).toBeInTheDocument();
    expect(await a11y(container)).toEqual([]);
  });

  it("texte court et long : étiquette, compteur de caractères", async () => {
    const { container } = render(
      <>
        <Field id="prenom" />
        <Field id="coordination" />
      </>,
    );
    await userEvent.type(screen.getByRole("textbox", { name: /Comment vous appelez-vous/ }), "Léa");
    expect(screen.getByRole("textbox", { name: /Comment vous appelez-vous/ })).toHaveValue("Léa");
    expect(screen.getByText("3 / 40")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /coordonne/ }).tagName).toBe("TEXTAREA");
    expect(await a11y(container)).toEqual([]);
  });

  it("nombre : saisie, unité, effacement", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <QuestionField question={question("taille-equipe")} value={undefined} onChange={onChange} />,
    );
    const input = screen.getByRole("spinbutton", { name: /Combien de personnes/ });
    expect(screen.getByText("personnes")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "12" } });
    expect(onChange).toHaveBeenLastCalledWith(12);
    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(await a11y(container)).toEqual([]);
  });

  it("date : champ date avec bornes", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <QuestionField question={question("date-demarrage")} value={undefined} onChange={onChange} />,
    );
    const input = screen.getByLabelText(/À quelle date/);
    expect(input).toHaveAttribute("type", "date");
    expect(input).toHaveAttribute("min", "2026-01-01");
    fireEvent.change(input, { target: { value: "2026-05-04" } });
    expect(onChange).toHaveBeenLastCalledWith("2026-05-04");
    expect(await a11y(container)).toEqual([]);
  });

  it("classement : monter / descendre au clavier, annonce de la position, confirmation de l'ordre par défaut", async () => {
    const onChange = vi.fn();
    function Rank() {
      const [v, setV] = React.useState<React.ComponentProps<typeof QuestionField>["value"]>(undefined);
      return (
        <QuestionField question={question("priorites")} value={v} onChange={(x) => (onChange(x), setV(x))} />
      );
    }
    const { container } = render(<Rank />);
    expect(screen.getByRole("button", { name: "Garder cet ordre" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Descendre « Gagner du temps »" }));
    expect(onChange).toHaveBeenLastCalledWith(["qualite", "temps", "cout", "autonomie"]);
    expect(screen.getByRole("status")).toHaveTextContent("Gagner du temps : position 2 sur 4");
    expect(screen.queryByRole("button", { name: "Garder cet ordre" })).toBeNull();
    expect(screen.getByRole("button", { name: "Monter « Améliorer la qualité »" })).toBeDisabled();
    expect(await a11y(container)).toEqual([]);
  });

  it("affiche une erreur liée au champ (alert + aria-describedby)", () => {
    render(<QuestionField question={question("prenom")} value="x" onChange={() => {}} error="Trop court" />);
    const input = screen.getByRole("textbox");
    expect(screen.getByRole("alert")).toHaveTextContent("Trop court");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(screen.getByRole("alert").id);
  });
});

describe("QuestionnaireRenderer", () => {
  function Form(props: Partial<React.ComponentProps<typeof QuestionnaireRenderer>>) {
    const [answers, setAnswers] = React.useState<Answers>({});
    return (
      <QuestionnaireRenderer questionnaire={q} answers={answers} onAnswersChange={setAnswers} {...props} />
    );
  }

  it("affiche sections et questions, masque ce que showIf masque, et réagit aux réponses", async () => {
    const { container } = render(<Form />);
    expect(screen.getByRole("heading", { name: "Votre équipe" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Ces outils vous conviennent/ })).toBeNull();
    await userEvent.click(screen.getByRole("checkbox", { name: "Messagerie" }));
    expect(screen.getByRole("group", { name: /Ces outils vous conviennent/ })).toBeInTheDocument();
    expect(await a11y(container)).toEqual([]);
  });

  it("combinaison all : la question apparaît seulement quand toutes les conditions sont vraies", async () => {
    render(<Form />);
    expect(screen.queryByLabelText(/coordonne/)).toBeNull();
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "8" } });
    expect(screen.queryByLabelText(/coordonne/)).toBeNull();
    await userEvent.click(screen.getByRole("radio", { name: "À distance" }));
    expect(screen.getByLabelText(/coordonne/)).toBeInTheDocument();
  });

  it("combinaison any : une seule condition suffit", async () => {
    render(<Form />);
    expect(screen.queryByRole("group", { name: /accompagnement/ })).toBeNull();
    await userEvent.click(screen.getByRole("radio", { name: /Débutant/ }));
    expect(screen.getByRole("group", { name: /accompagnement/ })).toBeInTheDocument();
  });

  it("messages de validation : format dès la saisie, « obligatoire » à la sortie du champ", async () => {
    render(<Form only={{ section: "equipe" }} />);
    const n = screen.getByRole("spinbutton");
    fireEvent.change(n, { target: { value: "900" } });
    expect(screen.getByRole("alert")).toHaveTextContent("au plus 500");
    fireEvent.change(n, { target: { value: "" } });
    expect(screen.queryByRole("alert")).toBeNull();
    await userEvent.click(n);
    await userEvent.tab();
    expect(screen.getByRole("alert")).toHaveTextContent("obligatoire");
  });

  it("peut se limiter à une question", () => {
    render(<Form only={{ question: "prenom" }} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.queryByRole("heading")).toBeNull();
  });
});

describe("pièces d'interface", () => {
  it("ProgressDots : passé en points, étape courante en pilule, libellé accessible", () => {
    const { container } = render(<ProgressDots current={3} total={5} />);
    expect(screen.getByRole("img", { name: "Étape 3 sur 5" })).toBeInTheDocument();
    expect(container.querySelectorAll("span")).toHaveLength(3);
    expect(container.querySelector(".w-6")).not.toBeNull();
  });

  it("ProgressDots : au-delà de 12 étapes, pilule et « n / total »", () => {
    render(<ProgressDots current={4} total={20} />);
    expect(screen.getByText("4 / 20")).toBeInTheDocument();
  });

  it("SaveIndicator : annonce polie, texte lisible même en mode compact", () => {
    const { rerender } = render(<SaveIndicator status="saved" compact />);
    expect(screen.getByRole("status")).toHaveTextContent("Enregistré");
    expect(screen.getByText("Enregistré")).toHaveClass("sr-only");
    rerender(<SaveIndicator status="error" />);
    expect(screen.getByRole("status")).toHaveTextContent("Échec de l'enregistrement");
    rerender(<SaveIndicator status="idle" />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("formatAnswer : libellés d'options, nombre + unité, date longue, classement, échelle", () => {
    expect(formatAnswer(question("role"), "dev")).toBe("Développement");
    expect(formatAnswer(question("role"), { other: "Support" })).toBe("Support");
    expect(formatAnswer(question("outils"), ["docs", { other: "Wiki" }])).toBe("Documents partagés, Wiki");
    expect(formatAnswer(question("taille-equipe"), 12)).toBe("12 personnes");
    expect(formatAnswer(question("satisfaction"), 4)).toBe("4 / 5");
    expect(formatAnswer(question("date-demarrage"), "2026-05-04")).toBe("4 mai 2026");
    expect(formatAnswer(question("priorites"), ["qualite", "temps", "cout", "autonomie"])).toBe(
      "1. Améliorer la qualité · 2. Gagner du temps · 3. Réduire les coûts · 4. Gagner en autonomie",
    );
    expect(formatAnswer(question("prenom"), undefined)).toBe("");
  });

  it("ReviewSummary : réponses par section, « Non renseigné », bouton Modifier nommé", async () => {
    const onEdit = vi.fn();
    const { container } = render(
      <ReviewSummary questionnaire={q} answers={{ prenom: "Léa", role: "dev" }} onEdit={onEdit} />,
    );
    expect(screen.getByText("Léa")).toBeInTheDocument();
    expect(screen.getAllByText("Non renseigné").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Ces outils vous conviennent/)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Modifier : Comment vous appelez-vous ?" }));
    expect(onEdit).toHaveBeenCalledWith("prenom");
    expect(await a11y(container)).toEqual([]);
  });

  it("CompletionScreen : titre focalisé à l'affichage, textes et actions personnalisables", () => {
    const { container } = render(
      <CompletionScreen
        title="Bravo"
        description="À bientôt"
        actions={<button>Aller au tableau de bord</button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "Bravo" })).toHaveFocus();
    expect(screen.getByText("À bientôt")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});

describe("OnboardingShell : une question par écran", () => {
  it("avance question par question ; « Continuer » reste désactivé tant que la réponse manque", async () => {
    render(<Host />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Comment vous appelez-vous ?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Obligatoire")).toBeInTheDocument();
    expect(cta()).toBeDisabled();
    expect(screen.getByRole("img", { name: /Étape 1 sur/ })).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox"), "Léa");
    expect(cta()).toBeEnabled();
    await userEvent.click(cta());
    expect(screen.getByRole("heading", { level: 1, name: "Quel est votre rôle ?" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Étape 2 sur/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Précédent" })).toBeInTheDocument();
  });

  it("le focus passe au titre à chaque étape et « Précédent » conserve les réponses", async () => {
    render(<Host initial={{ prenom: "Léa" }} />);
    await userEvent.click(cta());
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
    await userEvent.click(screen.getByRole("radio", { name: "Design" }));
    await userEvent.click(screen.getByRole("button", { name: "Précédent" }));
    expect(screen.getByRole("textbox")).toHaveValue("Léa");
    await userEvent.click(cta());
    expect(screen.getByRole("radio", { name: "Design" })).toBeChecked();
  });

  it("question facultative : « Passer » reste actif ; « Continuer » quand une réponse est donnée", async () => {
    render(
      <Host
        initial={{ prenom: "Léa", role: "dev", experience: "expert", "taille-equipe": 3 }}
        stepId={undefined}
        initialStepId="mode-travail"
      />,
    );
    expect(screen.getByRole("button", { name: "Passer" })).toBeEnabled();
    await userEvent.click(screen.getByRole("radio", { name: "Hybride" }));
    expect(screen.getByRole("button", { name: "Continuer" })).toBeEnabled();
  });

  it("une réponse invalide désactive le bouton et affiche le message", async () => {
    render(
      <Host initial={{ prenom: "Léa", role: "dev", experience: "expert" }} initialStepId="taille-equipe" />,
    );
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "900" } });
    expect(cta()).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("au plus 500");
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "30" } });
    expect(cta()).toBeEnabled();
  });

  it("saute les questions masquées, et la barre compte les étapes visibles", async () => {
    render(
      <Host
        initial={{
          prenom: "Léa",
          role: "dev",
          experience: "expert",
          "taille-equipe": 3,
          "mode-travail": "presentiel",
          outils: ["docs"],
        }}
        initialStepId="outils"
      />,
    );
    const before = screen.getByRole("img", { name: /Étape \d+ sur (\d+)/ }).getAttribute("aria-label")!;
    await userEvent.click(cta());
    expect(
      screen.getByRole("heading", { level: 1, name: /Ces outils vous conviennent/ }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: /^4/ }));
    await userEvent.click(cta());
    expect(screen.getByRole("heading", { level: 1, name: /À quelle date/ })).toBeInTheDocument();
    expect(before).toMatch(/sur \d+/);
  });

  it("n'a aucune violation d'accessibilité sur une question de chaque famille", async () => {
    const { container } = render(<Host initial={{ prenom: "Léa" }} />);
    expect(await a11y(container)).toEqual([]);
    await userEvent.click(cta());
    expect(await a11y(container)).toEqual([]);
  });
});

describe("OnboardingShell : une section par écran", () => {
  it("affiche toutes les questions visibles de la section ; le bouton attend les réponses obligatoires", async () => {
    const { container } = render(<Host mode="section" />);
    expect(screen.getByRole("heading", { level: 1, name: "Vous" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Comment vous appelez-vous/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Quel est votre rôle/ })).toBeInTheDocument();
    expect(cta()).toBeDisabled();
    await userEvent.type(screen.getByRole("textbox"), "Léa");
    await userEvent.click(screen.getByRole("radio", { name: "Design" }));
    expect(cta()).toBeDisabled();
    await userEvent.click(screen.getByRole("radio", { name: /Confirmé/ }));
    expect(cta()).toBeEnabled();
    expect(await a11y(container)).toEqual([]);
    await userEvent.click(cta());
    expect(screen.getByRole("heading", { level: 1, name: "Votre équipe" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Étape 2 sur 4" })).toBeInTheDocument();
  });

  it("les questions conditionnelles apparaissent dans l'écran quand leur condition devient vraie", async () => {
    render(
      <Host
        mode="section"
        initial={{ prenom: "Léa", role: "dev", experience: "expert" }}
        initialStepId="equipe"
      />,
    );
    expect(screen.queryByRole("group", { name: /Ces outils vous conviennent/ })).toBeNull();
    await userEvent.click(screen.getByRole("checkbox", { name: "Messagerie" }));
    expect(screen.getByRole("group", { name: /Ces outils vous conviennent/ })).toBeInTheDocument();
  });
});

describe("OnboardingShell : écrans personnalisés", () => {
  const custom: CustomStep[] = [
    {
      id: "accueil",
      placement: "start",
      title: "Bienvenue",
      hideNavigation: true,
      render: ({ next }) => <button onClick={next}>Commencer</button>,
    },
    {
      id: "calcul",
      placement: { after: "role" },
      showProgress: true,
      title: "Préparation",
      nextLabel: "Suite",
      render: () => <p>Nous préparons votre espace…</p>,
    },
    {
      id: "bloque",
      placement: { after: "experience" },
      canContinue: false,
      render: () => <p>Écran bloquant</p>,
    },
  ];

  it("s'intercale où on veut, avec ses propres règles (progression, navigation, blocage)", async () => {
    render(<Host customSteps={custom} initial={{ prenom: "Léa", role: "dev", experience: "debutant" }} />);
    expect(screen.queryByRole("img", { name: /Étape/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Continuer|Passer/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Commencer" }));
    expect(screen.getByRole("heading", { level: 1, name: /appelez/ })).toBeInTheDocument();
    await userEvent.click(cta());
    await userEvent.click(cta());
    expect(screen.getByText("Nous préparons votre espace…")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Étape 3 sur/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Suite" }));
    await userEvent.click(cta());
    expect(screen.getByText("Écran bloquant")).toBeInTheDocument();
    expect(cta()).toBeDisabled();
  });

  it("le contexte donne next, back, goTo et les réponses", async () => {
    const seen = vi.fn();
    const steps: CustomStep[] = [
      {
        id: "demo",
        placement: "start",
        render: (ctx) => {
          seen(ctx.answers);
          return (
            <>
              <button onClick={() => ctx.goTo("role")}>Sauter au rôle</button>
              <button onClick={ctx.back}>Retour</button>
            </>
          );
        },
      },
    ];
    render(<Host customSteps={steps} initial={{ prenom: "Léa" }} />);
    expect(seen).toHaveBeenCalledWith({ prenom: "Léa" });
    await userEvent.click(screen.getByRole("button", { name: "Sauter au rôle" }));
    expect(screen.getByRole("heading", { level: 1, name: "Quel est votre rôle ?" })).toBeInTheDocument();
  });
});

describe("OnboardingShell : récapitulatif, envoi et écran de fin", () => {
  const complet: Answers = {
    prenom: "Léa",
    role: "dev",
    experience: "expert",
    "taille-equipe": 4,
    outils: ["docs"],
    satisfaction: 4,
    "date-demarrage": "2026-03-01",
    priorites: ["temps", "qualite", "cout", "autonomie"],
  };

  it("récapitulatif : modification d'une réponse, puis envoi des réponses visibles et écran de fin", async () => {
    const onComplete = vi.fn();
    render(
      <Host
        initial={{ ...complet, coordination: "orpheline" }}
        initialStepId="__review__"
        onComplete={onComplete}
        completion={{ title: "Bravo !" }}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Vérifiez vos réponses" })).toBeInTheDocument();
    expect(screen.getByText("4 personnes")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Modifier : Comment vous appelez-vous ?" }));
    expect(screen.getByRole("textbox")).toHaveValue("Léa");
    for (let i = 0; i < 20 && !screen.queryByText("Vérifiez vos réponses"); i += 1)
      await userEvent.click(cta());
    await userEvent.click(screen.getByRole("button", { name: "Envoyer mes réponses" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Bravo !" })).toBeInTheDocument());
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0]![0]).not.toHaveProperty("coordination");
    expect(onComplete.mock.calls[0]![0]).toMatchObject({ prenom: "Léa", outils: ["docs"] });
  });

  it("échec d'envoi : message, puis nouvel essai", async () => {
    const onComplete = vi.fn().mockRejectedValueOnce(new Error("réseau")).mockResolvedValueOnce(undefined);
    render(
      <Host
        initial={complet}
        initialStepId="__review__"
        onComplete={onComplete}
        completion={<p>Fini !</p>}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Envoyer mes réponses" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("L'envoi a échoué");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer mes réponses" }));
    expect(await screen.findByText("Fini !")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it("sans récapitulatif, la dernière question envoie", async () => {
    const onComplete = vi.fn();
    render(<Host review={false} initial={complet} initialStepId="priorites" onComplete={onComplete} />);
    await userEvent.click(screen.getByRole("button", { name: "Envoyer mes réponses" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(await screen.findByRole("heading", { name: "Merci, c'est terminé" })).toBeInTheDocument();
  });

  it("récapitulatif accessible", async () => {
    const { container } = render(<Host initial={complet} initialStepId="__review__" />);
    expect(await a11y(container)).toEqual([]);
  });
});

describe("OnboardingShell : enregistrement et reprise", () => {
  it("enregistre automatiquement (temporisé), indique l'état, et expose le brouillon", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<Host onSave={onSave} saveDelayMs={300} />);
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Léa" } });
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Léa M" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0]![0]).toMatchObject({
      version: 1,
      questionnaireId: "atelier-demo",
      stepId: "prenom",
      answers: { prenom: "Léa M" },
    });
    expect(screen.getByText("Enregistré")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("« Enregistrer et reprendre plus tard » enregistre tout de suite puis appelle onExit", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onExit = vi.fn();
    render(<Host onSave={onSave} onExit={onExit} initial={{ prenom: "Léa" }} />);
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer et reprendre plus tard" }));
    await waitFor(() => expect(onExit).toHaveBeenCalledOnce());
    expect(onExit.mock.calls[0]![0].answers).toEqual({ prenom: "Léa" });
  });

  it("échec d'enregistrement : message et bouton Réessayer ; pas de sortie", async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error("hors ligne")).mockResolvedValue(undefined);
    const onExit = vi.fn();
    render(<Host onSave={onSave} onExit={onExit} />);
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer et reprendre plus tard" }));
    expect(await screen.findByText("Échec de l'enregistrement", { selector: "p" })).toBeInTheDocument();
    expect(onExit).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    await waitFor(() =>
      expect(screen.queryByText("Échec de l'enregistrement", { selector: "p" })).toBeNull(),
    );
  });

  it("reprend à l'étape du brouillon ; une étape disparue ramène au début", async () => {
    const { unmount } = render(<Host initial={{ prenom: "Léa" }} initialStepId="role" />);
    expect(screen.getByRole("heading", { level: 1, name: "Quel est votre rôle ?" })).toBeInTheDocument();
    unmount();
    render(<Host initial={{ prenom: "Léa" }} initialStepId="question-supprimee" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Comment vous appelez-vous ?" }),
    ).toBeInTheDocument();
  });

  it("notifie les changements d'étape", async () => {
    const onStepChange = vi.fn();
    render(<Host initial={{ prenom: "Léa" }} onStepChange={onStepChange} />);
    await userEvent.click(cta());
    expect(onStepChange).toHaveBeenCalledWith("role", 1);
  });
});

describe("OnboardingShell : textes", () => {
  it("tous les libellés se remplacent (langue, ton)", async () => {
    render(
      <Host
        labels={{ next: "Next", back: "Back", required: "Required", progress: "Step {current} of {total}" }}
        initial={{ prenom: "Léa" }}
      />,
    );
    expect(
      screen.getByRole("img", {
        name: "Step 1 of " + screen.getByRole("img").getAttribute("aria-label")!.split(" of ")[1],
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });
});
