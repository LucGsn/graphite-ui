import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  QUESTION_TYPES,
  allQuestions,
  buildSteps,
  createDraft,
  createLocalDraftStore,
  evaluateCondition,
  formatSchemaErrors,
  pruneAnswers,
  restoreDraft,
  validateAnswer,
  validateAnswers,
  validateQuestionnaire,
  validateQuestionnaireText,
  visibleQuestions,
  type Questionnaire,
} from "./index";

const RACINE = join(__dirname, "..", "..", "..");
const lire = (chemin: string) => readFileSync(join(RACINE, chemin), "utf8");
const exemple = JSON.parse(lire("skills/graphite-ui/examples/questionnaire.example.json"));
const schema = JSON.parse(lire("src/lib/questionnaire/questionnaire.schema.json"));
const q = exemple as Questionnaire;
const question = (id: string) => allQuestions(q).find((x) => x.id === id)!;
const clone = () => JSON.parse(JSON.stringify(exemple));

describe("contrat : exemple et schéma", () => {
  it("l'exemple est valide et couvre les huit types", () => {
    const r = validateQuestionnaire(exemple);
    expect(r.errors).toEqual([]);
    expect(new Set(allQuestions(q).map((x) => x.type))).toEqual(new Set(QUESTION_TYPES));
  });

  it("le schéma JSON est versionné et cohérent avec les types", () => {
    expect(schema.properties.schemaVersion.const).toBe(1);
    const types = schema.$defs.question.oneOf.map(
      (r: { $ref: string }) => schema.$defs[r.$ref.split("/").pop()!].properties.type.const,
    );
    expect(types).toEqual([...QUESTION_TYPES]);
  });

  it("les copies du skill sont identiques à la source", () => {
    expect(lire("skills/graphite-ui/reference/questionnaire.schema.json")).toBe(
      lire("src/lib/questionnaire/questionnaire.schema.json"),
    );
  });

  it("le schéma JSON et validateQuestionnaire s'accordent sur la forme du document", () => {
    const ajv = new Ajv2020({ strict: false, allErrors: true });
    addFormats(ajv);
    const check = ajv.compile(schema);
    expect(check(exemple), JSON.stringify(check.errors)).toBe(true);
    const cassés: [string, (d: Questionnaire & Record<string, unknown>) => void][] = [
      [
        "propriété inconnue",
        (d) => {
          d.couleur = "bleu";
        },
      ],
      [
        "version 2",
        (d) => {
          (d as { schemaVersion: number }).schemaVersion = 2;
        },
      ],
      [
        "type inconnu",
        (d) => {
          (d.sections[0]!.questions[0] as { type: string }).type = "radio";
        },
      ],
      [
        "options manquantes",
        (d) => {
          delete (d.sections[0]!.questions[1] as { options?: unknown }).options;
        },
      ],
      [
        "une seule option",
        (d) => {
          (d.sections[0]!.questions[1] as { options: unknown[] }).options.length = 1;
        },
      ],
      [
        "section sans question",
        (d) => {
          d.sections[0]!.questions = [];
        },
      ],
      [
        "condition à deux opérateurs",
        (d) => {
          (d.sections[1]!.questions[3] as { showIf: object }).showIf = {
            question: "outils",
            notEmpty: true,
            equals: "x",
          };
        },
      ],
      [
        "date invalide",
        (d) => {
          (d.sections[2]!.questions[0] as { min: string }).min = "01/01/2026";
        },
      ],
      [
        "identifiant invalide",
        (d) => {
          d.sections[0]!.id = "mon id";
        },
      ],
    ];
    for (const [nom, casse] of cassés) {
      const doc = clone();
      casse(doc);
      expect(check(doc), `schéma : ${nom}`).toBe(false);
      expect(validateQuestionnaire(doc).ok, `validateQuestionnaire : ${nom}`).toBe(false);
    }
  });
});

describe("validateQuestionnaire : erreurs exploitables par une IA", () => {
  const erreurs = (casse: (d: ReturnType<typeof clone>) => void) => {
    const doc = clone();
    casse(doc);
    const r = validateQuestionnaire(doc);
    expect(r.ok).toBe(false);
    return r.errors;
  };
  const q0 = (d: ReturnType<typeof clone>, s: number, i: number) => d.sections[s].questions[i];

  it("refuse ce qui n'est pas un objet", () => {
    expect(validateQuestionnaire("x").ok).toBe(false);
    expect(validateQuestionnaire(null).ok).toBe(false);
    expect(validateQuestionnaire([]).ok).toBe(false);
  });

  it("signale la propriété inconnue, avec son chemin et les propriétés autorisées", () => {
    const e = erreurs((d) => {
      q0(d, 0, 0).multiline = true;
    });
    expect(e[0]!.path).toBe("sections[0].questions[0].multiline");
    expect(e[0]!.message).toContain("autorisées");
  });

  it("signale les identifiants en double, y compris entre section et question", () => {
    expect(
      erreurs((d) => {
        q0(d, 1, 0).id = "prenom";
      }).some((x) => x.message.includes("déjà utilisé")),
    ).toBe(true);
    expect(
      erreurs((d) => {
        d.sections[1].id = "prenom";
      }).some((x) => x.message.includes("section et une question")),
    ).toBe(true);
  });

  it("vérifie options, maxChoices, échelle, nombre et dates", () => {
    expect(
      erreurs((d) => {
        q0(d, 0, 1).options[1].value = "design";
      }).some((x) => x.message.includes("en double")),
    ).toBe(true);
    expect(
      erreurs((d) => {
        q0(d, 1, 2).maxChoices = 9;
      }).some((x) => x.path.endsWith("maxChoices")),
    ).toBe(true);
    expect(
      erreurs((d) => {
        q0(d, 1, 3).max = 1;
      }).some((x) => x.path.endsWith("max")),
    ).toBe(true);
    expect(
      erreurs((d) => {
        q0(d, 1, 3).max = 20;
      }).some((x) => x.message.includes("11 points")),
    ).toBe(true);
    expect(
      erreurs((d) => {
        q0(d, 1, 0).min = 600;
      }).some((x) => x.path.endsWith("max")),
    ).toBe(true);
    expect(
      erreurs((d) => {
        q0(d, 2, 0).min = "2028-01-01";
      }).some((x) => x.path.endsWith("max")),
    ).toBe(true);
    expect(
      erreurs((d) => {
        q0(d, 2, 0).max = "2027-02-30";
      }).some((x) => x.path.endsWith("max")),
    ).toBe(true);
  });

  it("n'accepte maxChoices que sur une question multiple", () => {
    expect(
      erreurs((d) => {
        q0(d, 0, 1).maxChoices = 2;
      }).some((x) => x.path.endsWith("maxChoices")),
    ).toBe(true);
  });

  it("conditions : cible placée avant, existante, valeurs et opérateurs cohérents", () => {
    const sur = (showIf: unknown) =>
      erreurs((d) => {
        q0(d, 1, 3).showIf = showIf;
      })
        .map((x) => `${x.path}: ${x.message}`)
        .join(" | ");
    expect(sur({ question: "inconnue", notEmpty: true })).toContain("introuvable");
    expect(sur({ question: "satisfaction", notEmpty: true })).toContain("AVANT");
    expect(sur({ question: "coordination", notEmpty: true })).toContain("AVANT");
    expect(sur({ question: "role", equals: "inexistant" })).toContain("Valeur(s) inconnue(s)");
    expect(sur({ question: "outils", equals: "docs" })).toContain("contains");
    expect(sur({ question: "role", gt: 3 })).toContain("scale");
    expect(sur({ question: "prenom", equals: "a", notEmpty: true })).toContain("Exactement un opérateur");
    expect(sur({ question: "role" })).toContain("Exactement un opérateur");
    expect(sur({ all: [] })).toContain("non vide");
    expect(sur({ all: [{ question: "role", equals: "dev" }], any: [] })).toContain("aucune autre");
    expect(sur({ any: [{ question: "role", equals: "inexistant" }] })).toContain("any[0]");
  });

  it("une question ne peut pas viser elle-même", () => {
    expect(
      erreurs((d) => {
        q0(d, 0, 1).showIf = { question: "role", notEmpty: true };
      }).length,
    ).toBeGreaterThan(0);
  });

  it("formatSchemaErrors donne une ligne par erreur", () => {
    const e = erreurs((d) => {
      d.title = "";
      d.schemaVersion = 3;
    });
    expect(formatSchemaErrors(e).split("\n")).toHaveLength(e.length);
    expect(formatSchemaErrors(e)).toContain("- title :");
  });
});

describe("validateQuestionnaireText (réponse brute d'une IA)", () => {
  it("accepte du JSON seul ou dans une clôture ```json", () => {
    expect(validateQuestionnaireText(JSON.stringify(exemple)).ok).toBe(true);
    expect(
      validateQuestionnaireText("Voici :\n```json\n" + JSON.stringify(exemple) + "\n```\nBonne journée").ok,
    ).toBe(true);
  });

  it("signale un JSON illisible comme une erreur de la racine, et relaie les erreurs du contrat", () => {
    const illisible = validateQuestionnaireText("{ pas du json");
    expect(illisible.ok).toBe(false);
    expect(illisible.errors[0]!.message).toContain("JSON illisible");
    const faux = validateQuestionnaireText(JSON.stringify({ ...exemple, schemaVersion: 9 }));
    expect(faux.errors[0]!.path).toBe("schemaVersion");
  });
});

describe("affichage conditionnel", () => {
  it("évalue les opérateurs et les combinaisons all / any", () => {
    const a = { n: 8, mode: "hybride", tags: ["a", "b"], vide: "" };
    expect(evaluateCondition({ question: "n", gt: 5 }, a)).toBe(true);
    expect(evaluateCondition({ question: "n", lt: 5 }, a)).toBe(false);
    expect(evaluateCondition({ question: "mode", in: ["distance", "hybride"] }, a)).toBe(true);
    expect(evaluateCondition({ question: "tags", contains: "b" }, a)).toBe(true);
    expect(evaluateCondition({ question: "vide", notEmpty: true }, a)).toBe(false);
    expect(evaluateCondition({ question: "absent", equals: "x" }, a)).toBe(false);
    expect(
      evaluateCondition(
        {
          all: [
            { question: "n", gt: 5 },
            { question: "mode", equals: "hybride" },
          ],
        },
        a,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        {
          all: [
            { question: "n", gt: 5 },
            { question: "mode", equals: "distance" },
          ],
        },
        a,
      ),
    ).toBe(false);
    expect(
      evaluateCondition(
        {
          any: [
            { question: "n", lt: 1 },
            { question: "tags", contains: "a" },
          ],
        },
        a,
      ),
    ).toBe(true);
  });

  it("masque et affiche les questions de l'exemple (all, any, notEmpty)", () => {
    const ids = (a: Parameters<typeof visibleQuestions>[1]) => visibleQuestions(q, a).map((x) => x.id);
    expect(ids({})).not.toContain("satisfaction");
    expect(ids({ outils: ["docs"] })).toContain("satisfaction");
    expect(ids({ "taille-equipe": 8, "mode-travail": "distance" })).toContain("coordination");
    expect(ids({ "taille-equipe": 3, "mode-travail": "distance" })).not.toContain("coordination");
    expect(ids({ "taille-equipe": 8, "mode-travail": "presentiel" })).not.toContain("coordination");
    expect(ids({ experience: "debutant" })).toContain("accompagnement");
    expect(ids({ experience: "expert" })).not.toContain("accompagnement");
    expect(ids({ experience: "expert", outils: ["docs"], satisfaction: 2 })).toContain("accompagnement");
  });

  it("une question masquée n'alimente plus les conditions suivantes et ses réponses sont écartées", () => {
    const a = { outils: [], satisfaction: 1, experience: "expert" };
    expect(visibleQuestions(q, a).map((x) => x.id)).not.toContain("accompagnement");
    expect(pruneAnswers(q, { ...a, prenom: "Léa" })).toEqual({
      prenom: "Léa",
      outils: [],
      experience: "expert",
    });
  });
});

describe("validateAnswer", () => {
  const e = (id: string, v: Parameters<typeof validateAnswer>[1]) =>
    validateAnswer(question(id), v)?.code ?? null;

  it("obligatoire / facultatif", () => {
    expect(e("prenom", undefined)).toBe("required");
    expect(e("prenom", "  ")).toBe("required");
    expect(e("mode-travail", undefined)).toBeNull();
    expect(e("outils", [])).toBe("required");
  });

  it("choix unique et « Autre »", () => {
    expect(e("role", "dev")).toBeNull();
    expect(e("role", "inconnu")).toBe("unknownOption");
    expect(e("role", { other: "Support" })).toBeNull();
    expect(e("role", { other: " " })).toBe("otherEmpty");
    expect(e("experience", { other: "x" })).toBe("unknownOption");
  });

  it("choix multiple : maximum, doublons, « Autre » compte pour un choix", () => {
    expect(e("outils", ["docs", "tableur"])).toBeNull();
    expect(e("outils", ["docs", "tableur", "tickets"])).toBeNull();
    expect(e("outils", ["docs", "tableur", "tickets", "messagerie"])).toBe("tooMany");
    expect(e("outils", ["docs", "tableur", { other: "Wiki" }])).toBeNull();
    expect(e("outils", ["docs", "messagerie", "tableur", { other: "Wiki" }])).toBe("tooMany");
    expect(e("outils", ["docs", "docs"])).toBe("unknownOption");
    expect(e("outils", ["docs", { other: "a" }, { other: "b" }])).toBe("invalid");
  });

  it("échelle, nombre, texte, date, classement", () => {
    expect(e("satisfaction", 3)).toBeNull();
    expect(e("satisfaction", 6)).toBe("scaleRange");
    expect(e("satisfaction", 2.5)).toBe("scaleRange");
    expect(e("taille-equipe", 12)).toBeNull();
    expect(e("taille-equipe", 0)).toBe("min");
    expect(e("taille-equipe", 501)).toBe("max");
    expect(e("taille-equipe", 2.5)).toBe("notInteger");
    expect(e("prenom", "x".repeat(41))).toBe("tooLong");
    expect(e("date-demarrage", "2026-06-01")).toBeNull();
    expect(e("date-demarrage", "2025-12-31")).toBe("dateMin");
    expect(e("date-demarrage", "2028-01-01")).toBe("dateMax");
    expect(e("date-demarrage", "2026-02-30")).toBe("invalidDate");
    expect(e("priorites", ["temps", "qualite", "cout", "autonomie"])).toBeNull();
    expect(e("priorites", ["temps", "qualite"])).toBe("ranking");
    expect(e("priorites", ["temps", "temps", "cout", "autonomie"])).toBe("ranking");
  });

  it("messages personnalisables", () => {
    const m = validateAnswer(question("outils"), ["a"], {
      ...{
        required: "",
        otherEmpty: "",
        tooMany: "",
        unknownOption: "Inconnu !",
        invalid: "",
        tooLong: "",
        notInteger: "",
        min: "",
        max: "",
        step: "",
        scaleRange: "",
        invalidDate: "",
        dateMin: "",
        dateMax: "",
        ranking: "",
      },
    });
    expect(m?.message).toBe("Inconnu !");
    expect(validateAnswer(question("prenom"), "x".repeat(41))?.message).toContain("40");
  });

  it("validateAnswers ne contrôle que les questions visibles", () => {
    const r = validateAnswers(q, {});
    expect(Object.keys(r.errors).sort()).toEqual([
      "date-demarrage",
      "experience",
      "outils",
      "prenom",
      "priorites",
      "role",
      "taille-equipe",
    ]);
    expect(r.ok).toBe(false);
    const ok = validateAnswers(q, {
      prenom: "Léa",
      role: "dev",
      experience: "expert",
      "taille-equipe": 4,
      outils: ["docs"],
      satisfaction: 4,
      "date-demarrage": "2026-03-01",
      priorites: ["temps", "qualite", "cout", "autonomie"],
    });
    expect(ok).toEqual({ ok: true, errors: {} });
  });
});

describe("buildSteps", () => {
  const types = (steps: ReturnType<typeof buildSteps>) => steps.map((s) => `${s.kind}:${s.id}`);

  it("une question par écran, puis le récapitulatif ; les questions masquées sont sautées", () => {
    const steps = types(buildSteps(q, {}));
    expect(steps[0]).toBe("question:prenom");
    expect(steps.at(-1)).toBe("review:__review__");
    expect(steps).not.toContain("question:satisfaction");
    expect(types(buildSteps(q, { outils: ["docs"] }))).toContain("question:satisfaction");
  });

  it("une section par écran ; une section entièrement masquée disparaît", () => {
    expect(types(buildSteps(q, {}, { mode: "section" }))).toEqual([
      "section:profil",
      "section:equipe",
      "section:demarrage",
      "review:__review__",
    ]);
    const mini = {
      ...q,
      sections: [
        { id: "a", title: "A", questions: [question("prenom")] },
        {
          id: "b",
          title: "B",
          questions: [{ ...question("coordination"), showIf: { question: "prenom", equals: "zzz" } }],
        },
      ],
    } as Questionnaire;
    expect(types(buildSteps(mini, {}, { mode: "section", review: false }))).toEqual(["section:a"]);
  });

  it("intercale des écrans personnalisés n'importe où (début, fin, avant / après question ou section)", () => {
    const custom = [
      { id: "accueil", placement: "start" as const },
      { id: "apres-prenom", placement: { after: "prenom" } },
      { id: "avant-equipe", placement: { before: "equipe" } },
      { id: "apres-equipe", placement: { after: "equipe" } },
      { id: "fin", placement: "end" as const },
    ];
    expect(types(buildSteps(q, {}, { customSteps: custom }))).toEqual([
      "custom:accueil",
      "question:prenom",
      "custom:apres-prenom",
      "question:role",
      "question:experience",
      "custom:avant-equipe",
      "question:taille-equipe",
      "question:mode-travail",
      "question:outils",
      "custom:apres-equipe",
      "question:date-demarrage",
      "question:priorites",
      "custom:fin",
      "review:__review__",
    ]);
    const section = types(
      buildSteps(
        q,
        {},
        {
          mode: "section",
          customSteps: [
            { id: "x", placement: { after: "profil" } },
            { id: "y", placement: { before: "taille-equipe" } },
          ],
        },
      ),
    );
    expect(section.slice(0, 4)).toEqual(["section:profil", "custom:x", "custom:y", "section:equipe"]);
  });

  it("un écran personnalisé peut avoir son propre showIf ; un ancrage inconnu ou un id en double lève une erreur claire", () => {
    const c = [
      { id: "bonus", placement: "start" as const, showIf: { question: "prenom", notEmpty: true as const } },
    ];
    expect(types(buildSteps(q, {}, { customSteps: c }))[0]).toBe("question:prenom");
    expect(types(buildSteps(q, { prenom: "Léa" }, { customSteps: c }))[0]).toBe("custom:bonus");
    expect(() =>
      buildSteps(q, {}, { customSteps: [{ id: "z", placement: { after: "nulle-part" } }] }),
    ).toThrow(/nulle-part/);
    expect(() => buildSteps(q, {}, { customSteps: [{ id: "prenom", placement: "start" }] })).toThrow(
      /déjà utilisé/,
    );
  });

  it("sans récapitulatif", () => {
    expect(types(buildSteps(q, {}, { review: false })).at(-1)).toBe("question:priorites");
  });
});

describe("brouillon", () => {
  const draft = createDraft(
    q,
    { prenom: "Léa", role: "dev", inconnue: "x", experience: "nimporte" } as never,
    "role",
    new Date("2026-01-01T10:00:00Z"),
  );

  it("restaure les réponses valides, écarte les autres, garde l'étape", () => {
    const r = restoreDraft(q, JSON.stringify(draft));
    expect(r).toEqual({
      answers: { prenom: "Léa", role: "dev" },
      stepId: "role",
      savedAt: "2026-01-01T10:00:00.000Z",
    });
  });

  it("ignore un brouillon corrompu, d'une autre version ou d'un autre questionnaire", () => {
    expect(restoreDraft(q, "{pas du json")).toBeNull();
    expect(restoreDraft(q, null)).toBeNull();
    expect(restoreDraft(q, { ...draft, version: 2 })).toBeNull();
    expect(restoreDraft(q, { ...draft, questionnaireId: "autre" })).toBeNull();
    expect(restoreDraft(q, { ...draft, answers: [] })).toBeNull();
  });

  it("le magasin local enregistre, relit et efface ; il ne plante pas sans stockage", () => {
    const store = createLocalDraftStore("test.brouillon", q);
    store.clear();
    expect(store.load()).toBeNull();
    store.save(draft);
    expect(store.load()?.answers).toEqual({ prenom: "Léa", role: "dev" });
    store.clear();
    expect(store.load()).toBeNull();
    const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage")!;
    Object.defineProperty(globalThis, "localStorage", {
      get() {
        throw new Error("bloqué");
      },
      configurable: true,
    });
    expect(() => {
      store.save(draft);
      store.load();
      store.clear();
    }).not.toThrow();
    Object.defineProperty(globalThis, "localStorage", original);
  });
});
