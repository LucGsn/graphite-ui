import { CONDITION_OPERATORS, isAnswerEmpty, visibleQuestions } from "./conditions";
import {
  QUESTIONNAIRE_SCHEMA_VERSION,
  QUESTION_TYPES,
  isOtherChoice,
  type Answer,
  type Answers,
  type Question,
  type Questionnaire,
} from "./types";

// ---------------------------------------------------------------------------
// Validation du document (contrat avec l'IA)
// ---------------------------------------------------------------------------

export interface SchemaError {
  /** Chemin dans le document, ex. `sections[0].questions[2].options`. */
  path: string;
  message: string;
}

export type QuestionnaireValidation =
  { ok: true; questionnaire: Questionnaire; errors: [] } | { ok: false; errors: SchemaError[] };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isDate = (v: unknown): v is string => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

const COMMON_KEYS = ["id", "type", "label", "help", "required", "showIf"];
const KEYS: Record<string, string[]> = {
  single: [...COMMON_KEYS, "options", "display", "allowOther"],
  multiple: [...COMMON_KEYS, "options", "display", "allowOther", "maxChoices"],
  scale: [...COMMON_KEYS, "min", "max", "minLabel", "maxLabel"],
  short: [...COMMON_KEYS, "placeholder", "maxLength"],
  long: [...COMMON_KEYS, "placeholder", "maxLength"],
  number: [...COMMON_KEYS, "min", "max", "step", "unit", "placeholder"],
  date: [...COMMON_KEYS, "min", "max"],
  ranking: [...COMMON_KEYS, "options"],
};
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const MAX_SCALE_POINTS = 11;

export const MAX_OPTIONS = 30;

export function validateQuestionnaire(input: unknown): QuestionnaireValidation {
  const errors: SchemaError[] = [];
  const err = (path: string, message: string) => errors.push({ path, message });
  const unknownKeys = (o: Obj, allowed: string[], path: string) => {
    for (const k of Object.keys(o))
      if (!allowed.includes(k))
        err(
          path ? `${path}.${k}` : k,
          `Propriété inconnue « ${k} » (autorisées ici : ${allowed.join(", ")}).`,
        );
  };
  const optStr = (o: Obj, k: string, path: string) => {
    if (o[k] !== undefined && !isStr(o[k])) err(`${path}.${k}`, "Doit être un texte non vide.");
  };

  if (!isObj(input)) {
    return { ok: false, errors: [{ path: "", message: "Le questionnaire doit être un objet JSON." }] };
  }
  unknownKeys(input, ["schemaVersion", "id", "title", "description", "sections"], "");
  if (input.schemaVersion !== QUESTIONNAIRE_SCHEMA_VERSION)
    err(
      "schemaVersion",
      `Doit valoir ${QUESTIONNAIRE_SCHEMA_VERSION} (reçu : ${JSON.stringify(input.schemaVersion)}).`,
    );
  if (!isStr(input.id) || !ID_RE.test(input.id)) err("id", "Identifiant requis (lettres, chiffres, - et _).");
  if (!isStr(input.title)) err("title", "Titre requis (texte non vide).");
  optStr(input, "description", "");

  // Premier passage : identifiants et ordre des questions (les conditions ne regardent qu'en arrière).
  const seen = new Map<string, { order: number; question: Obj }>();
  const sectionIds = new Set<string>();
  let order = 0;
  const sections = Array.isArray(input.sections) ? input.sections : null;
  if (!sections || sections.length === 0) err("sections", "Au moins une section est requise.");

  (sections ?? []).forEach((s, si) => {
    const sp = `sections[${si}]`;
    if (!isObj(s)) return err(sp, "Une section doit être un objet.");
    unknownKeys(s, ["id", "title", "description", "questions"], sp);
    if (!isStr(s.id) || !ID_RE.test(s.id))
      err(`${sp}.id`, "Identifiant de section requis (lettres, chiffres, - et _).");
    else if (sectionIds.has(s.id)) err(`${sp}.id`, `Identifiant de section « ${s.id} » déjà utilisé.`);
    else sectionIds.add(s.id);
    if (!isStr(s.title)) err(`${sp}.title`, "Titre de section requis.");
    optStr(s, "description", sp);
    if (!Array.isArray(s.questions) || s.questions.length === 0)
      return err(`${sp}.questions`, "Au moins une question par section.");
    s.questions.forEach((q, qi) => {
      if (isObj(q) && isStr(q.id)) {
        if (seen.has(q.id))
          err(
            `${sp}.questions[${qi}].id`,
            `Identifiant « ${q.id} » déjà utilisé (les identifiants sont uniques dans tout le questionnaire).`,
          );
        else seen.set(q.id, { order: order, question: q });
      }
      order += 1;
    });
  });
  for (const id of seen.keys())
    if (sectionIds.has(id))
      err("sections", `L'identifiant « ${id} » est utilisé à la fois par une section et une question.`);

  // Second passage : contenu des questions.
  let position = -1;
  (sections ?? []).forEach((s, si) => {
    if (!isObj(s) || !Array.isArray(s.questions)) return;
    s.questions.forEach((q, qi) => {
      position += 1;
      const path = `sections[${si}].questions[${qi}]`;
      if (!isObj(q)) return err(path, "Une question doit être un objet.");
      const type = q.type;
      if (typeof type !== "string" || !(QUESTION_TYPES as readonly string[]).includes(type)) {
        err(`${path}.type`, `Type inconnu ${JSON.stringify(type)} (types : ${QUESTION_TYPES.join(", ")}).`);
        return;
      }
      unknownKeys(q, KEYS[type]!, path);
      if (!isStr(q.id) || !ID_RE.test(q.id))
        err(`${path}.id`, "Identifiant requis (lettres, chiffres, - et _).");
      if (!isStr(q.label)) err(`${path}.label`, "Libellé requis (texte non vide).");
      optStr(q, "help", path);
      if (q.required !== undefined && typeof q.required !== "boolean")
        err(`${path}.required`, "Doit être true ou false.");

      if (type === "single" || type === "multiple" || type === "ranking") {
        const opts = q.options;
        if (!Array.isArray(opts) || opts.length < 2)
          err(`${path}.options`, "Au moins 2 options sont requises.");
        else {
          if (opts.length > MAX_OPTIONS) err(`${path}.options`, `Au plus ${MAX_OPTIONS} options.`);
          const values = new Set<string>();
          opts.forEach((o, oi) => {
            const op = `${path}.options[${oi}]`;
            if (!isObj(o)) return err(op, "Une option doit être un objet { value, label }.");
            unknownKeys(o, ["value", "label", "description", "icon"], op);
            if (!isStr(o.value)) err(`${op}.value`, "Valeur requise (texte non vide).");
            else if (values.has(o.value)) err(`${op}.value`, `Valeur « ${o.value} » en double.`);
            else values.add(o.value);
            if (!isStr(o.label)) err(`${op}.label`, "Libellé requis.");
            optStr(o, "description", op);
            optStr(o, "icon", op);
          });
        }
      }
      if (type === "single" || type === "multiple") {
        if (q.display !== undefined && q.display !== "chips" && q.display !== "cards")
          err(`${path}.display`, "Doit valoir « chips » ou « cards ».");
        const other = q.allowOther;
        if (other !== undefined && typeof other !== "boolean") {
          if (!isObj(other)) err(`${path}.allowOther`, "Doit être true, false ou { label?, placeholder? }.");
          else {
            unknownKeys(other, ["label", "placeholder"], `${path}.allowOther`);
            optStr(other, "label", `${path}.allowOther`);
            optStr(other, "placeholder", `${path}.allowOther`);
          }
        }
      }
      if (type === "multiple" && q.maxChoices !== undefined) {
        const n = Array.isArray(q.options) ? q.options.length + (q.allowOther ? 1 : 0) : Infinity;
        if (!isInt(q.maxChoices) || q.maxChoices < 1) err(`${path}.maxChoices`, "Doit être un entier ≥ 1.");
        else if (q.maxChoices > n)
          err(`${path}.maxChoices`, `Ne peut pas dépasser le nombre de choix (${n}).`);
      }
      if (type === "scale") {
        if (!isInt(q.min)) err(`${path}.min`, "Entier requis.");
        if (!isInt(q.max)) err(`${path}.max`, "Entier requis.");
        if (isInt(q.min) && isInt(q.max)) {
          if (q.min >= q.max) err(`${path}.max`, "max doit être strictement supérieur à min.");
          else if (q.max - q.min + 1 > MAX_SCALE_POINTS)
            err(`${path}.max`, `Une échelle compte au plus ${MAX_SCALE_POINTS} points.`);
        }
        optStr(q, "minLabel", path);
        optStr(q, "maxLabel", path);
      }
      if (type === "short" || type === "long") {
        optStr(q, "placeholder", path);
        if (q.maxLength !== undefined && (!isInt(q.maxLength) || q.maxLength < 1))
          err(`${path}.maxLength`, "Doit être un entier ≥ 1.");
      }
      if (type === "number") {
        for (const k of ["min", "max"])
          if (q[k] !== undefined && !isNum(q[k])) err(`${path}.${k}`, "Doit être un nombre.");
        if (isNum(q.min) && isNum(q.max) && q.min > q.max) err(`${path}.max`, "max doit être ≥ min.");
        if (q.step !== undefined && (!isNum(q.step) || q.step <= 0))
          err(`${path}.step`, "Doit être un nombre > 0.");
        optStr(q, "unit", path);
        optStr(q, "placeholder", path);
      }
      if (type === "date") {
        for (const k of ["min", "max"])
          if (q[k] !== undefined && !isDate(q[k])) err(`${path}.${k}`, "Date au format AAAA-MM-JJ requise.");
        if (isDate(q.min) && isDate(q.max) && q.min > q.max) err(`${path}.max`, "max doit être ≥ min.");
      }
      if (q.showIf !== undefined) checkCondition(q.showIf, `${path}.showIf`, position, seen, err);
    });
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, questionnaire: input as unknown as Questionnaire, errors: [] };
}

function checkCondition(
  c: unknown,
  path: string,
  position: number,
  seen: Map<string, { order: number; question: Obj }>,
  err: (path: string, message: string) => void,
  depth = 0,
): void {
  if (!isObj(c)) return err(path, "Une condition doit être un objet.");
  if (depth > 5) return err(path, "Conditions imbriquées sur plus de 5 niveaux.");
  const keys = Object.keys(c);
  if ("all" in c || "any" in c) {
    const op = "all" in c ? "all" : "any";
    if (keys.length !== 1) err(path, `« ${op} » ne se combine avec aucune autre propriété.`);
    const list = c[op];
    if (!Array.isArray(list) || list.length === 0)
      return err(`${path}.${op}`, "Liste de conditions non vide requise.");
    list.forEach((sub, i) => checkCondition(sub, `${path}.${op}[${i}]`, position, seen, err, depth + 1));
    return;
  }
  const ops = keys.filter((k) => (CONDITION_OPERATORS as readonly string[]).includes(k));
  for (const k of keys)
    if (k !== "question" && !ops.includes(k))
      err(
        `${path}.${k}`,
        `Propriété inconnue « ${k} » (question + un opérateur parmi ${CONDITION_OPERATORS.join(", ")}, ou all / any).`,
      );
  if (ops.length !== 1)
    err(path, `Exactement un opérateur requis (${CONDITION_OPERATORS.join(", ")}) ; trouvé : ${ops.length}.`);
  const target = isStr(c.question) ? seen.get(c.question) : undefined;
  if (!isStr(c.question)) err(`${path}.question`, "Identifiant de question requis.");
  else if (!target) err(`${path}.question`, `Question « ${c.question} » introuvable.`);
  else if (target.order >= position)
    err(
      `${path}.question`,
      `Question « ${c.question} » : une condition ne peut viser qu'une question placée AVANT (ni elle-même, ni après).`,
    );
  if (ops.length !== 1 || !target) return;
  const op = ops[0]!;
  const tq = target.question;
  const tType = tq.type;
  const value = c[op];
  const scalar = (v: unknown) => typeof v === "string" || isNum(v) || typeof v === "boolean";
  const optionValues = Array.isArray(tq.options) ? (tq.options as Obj[]).map((o) => o.value) : null;
  if (op === "equals" || op === "in") {
    const list = op === "in" ? value : [value];
    if (!Array.isArray(list) || list.length === 0 || !list.every(scalar))
      return err(
        `${path}.${op}`,
        op === "in"
          ? "Liste non vide de textes, nombres ou booléens requise."
          : "Texte, nombre ou booléen requis.",
      );
    if (tType === "single" && optionValues) {
      const unknown = list.filter((v) => !optionValues.includes(v));
      if (unknown.length)
        err(
          `${path}.${op}`,
          `Valeur(s) inconnue(s) pour « ${tq.id} » : ${unknown.join(", ")} (options : ${optionValues.join(", ")}).`,
        );
    } else if (tType === "scale" || tType === "number") {
      if (!list.every(isNum)) err(`${path}.${op}`, `« ${tq.id} » est numérique : valeur numérique requise.`);
    } else if (tType === "multiple" || tType === "ranking")
      err(`${path}.${op}`, `« ${tq.id} » est une liste : utiliser « contains » ou « notEmpty ».`);
  } else if (op === "notEmpty") {
    if (value !== true) err(`${path}.notEmpty`, "Doit valoir true.");
  } else if (op === "gt" || op === "lt") {
    if (!isNum(value)) err(`${path}.${op}`, "Nombre requis.");
    if (tType !== "scale" && tType !== "number")
      err(
        `${path}.${op}`,
        `« ${op} » ne s'applique qu'à une question « scale » ou « number » (« ${tq.id} » est de type ${String(tType)}).`,
      );
  } else if (op === "contains") {
    if (!isStr(value)) err(`${path}.contains`, "Valeur (texte) requise.");
    else if (tType !== "multiple")
      err(
        `${path}.contains`,
        `« contains » ne s'applique qu'à une question « multiple » (« ${tq.id} » est de type ${String(tType)}).`,
      );
    else if (optionValues && !optionValues.includes(value))
      err(
        `${path}.contains`,
        `Valeur inconnue pour « ${tq.id} » : ${value} (options : ${optionValues.join(", ")}).`,
      );
  }
}

/**
 * Valide la réponse brute d'une IA : accepte du JSON seul ou entouré d'une clôture ```json … ```, et
 * signale un JSON illisible comme une erreur de la racine (à renvoyer à l'IA comme les autres).
 */
export function validateQuestionnaireText(text: string): QuestionnaireValidation {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = (fenced ? fenced[1]! : text).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (e) {
    return {
      ok: false,
      errors: [
        {
          path: "",
          message: `JSON illisible : ${(e as Error).message}. Renvoyer uniquement le document JSON.`,
        },
      ],
    };
  }
  return validateQuestionnaire(parsed);
}

/** Erreurs mises en forme pour être renvoyées telles quelles à une IA (une par ligne). */
export function formatSchemaErrors(errors: readonly SchemaError[]): string {
  return errors.map((e) => `- ${e.path || "(racine)"} : ${e.message}`).join("\n");
}

// ---------------------------------------------------------------------------
// Validation des réponses
// ---------------------------------------------------------------------------

export interface QuestionnaireMessages {
  required: string;
  otherEmpty: string;
  tooMany: string;
  unknownOption: string;
  invalid: string;
  tooLong: string;
  notInteger: string;
  min: string;
  max: string;
  step: string;
  scaleRange: string;
  invalidDate: string;
  dateMin: string;
  dateMax: string;
  ranking: string;
}

export const defaultQuestionnaireMessages: QuestionnaireMessages = {
  required: "Cette réponse est obligatoire.",
  otherEmpty: "Précisez votre réponse.",
  tooMany: "Choisissez {max} réponse(s) au plus.",
  unknownOption: "Cette réponse ne fait pas partie des choix.",
  invalid: "Réponse invalide.",
  tooLong: "{max} caractères au plus.",
  notInteger: "Saisissez un nombre entier.",
  min: "La valeur doit être d'au moins {min}.",
  max: "La valeur doit être d'au plus {max}.",
  step: "La valeur doit être un multiple de {step}.",
  scaleRange: "Choisissez une valeur entre {min} et {max}.",
  invalidDate: "Saisissez une date valide.",
  dateMin: "La date doit être le {min} ou après.",
  dateMax: "La date doit être le {max} ou avant.",
  ranking: "Classez toutes les options.",
};

export type AnswerErrorCode = keyof QuestionnaireMessages;
export interface AnswerError {
  code: AnswerErrorCode;
  message: string;
}
export interface AnswersValidation {
  ok: boolean;
  /** Par identifiant de question (visibles seulement). */
  errors: Record<string, AnswerError>;
}

const fmt = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

/** Valide UNE réponse ; `null` si elle est valide (ou vide et facultative). */
export function validateAnswer(
  question: Question,
  answer: Answer | undefined,
  messages: QuestionnaireMessages = defaultQuestionnaireMessages,
): AnswerError | null {
  const fail = (code: AnswerErrorCode, vars: Record<string, string | number> = {}): AnswerError => ({
    code,
    message: fmt(messages[code], vars),
  });
  // Une option « Autre » dont le texte est vide n'est pas « vide » : elle demande d'être précisée.
  if (answer === undefined || (!isOtherChoice(answer) && isAnswerEmpty(answer)))
    return question.required ? fail("required") : null;
  switch (question.type) {
    case "single": {
      if (isOtherChoice(answer)) {
        if (!question.allowOther) return fail("unknownOption");
        return answer.other.trim() === "" ? fail("otherEmpty") : null;
      }
      return typeof answer === "string" && question.options.some((o) => o.value === answer)
        ? null
        : fail("unknownOption");
    }
    case "multiple": {
      if (!Array.isArray(answer)) return fail("invalid");
      if (answer.length === 0) return question.required ? fail("required") : null;
      const values = new Set<string>();
      let others = 0;
      for (const item of answer) {
        if (isOtherChoice(item)) {
          if (!question.allowOther) return fail("unknownOption");
          if (item.other.trim() === "") return fail("otherEmpty");
          others += 1;
        } else if (
          typeof item === "string" &&
          question.options.some((o) => o.value === item) &&
          !values.has(item)
        )
          values.add(item);
        else return fail("unknownOption");
      }
      if (others > 1) return fail("invalid");
      if (question.maxChoices !== undefined && answer.length > question.maxChoices)
        return fail("tooMany", { max: question.maxChoices });
      return null;
    }
    case "ranking": {
      if (!Array.isArray(answer) || answer.length !== question.options.length) return fail("ranking");
      const expected = new Set(question.options.map((o) => o.value));
      return answer.every((v) => typeof v === "string" && expected.has(v)) &&
        new Set(answer).size === expected.size
        ? null
        : fail("ranking");
    }
    case "scale":
      if (
        typeof answer !== "number" ||
        !Number.isInteger(answer) ||
        answer < question.min ||
        answer > question.max
      )
        return fail("scaleRange", { min: question.min, max: question.max });
      return null;
    case "short":
    case "long":
      if (typeof answer !== "string") return fail("invalid");
      return question.maxLength !== undefined && answer.length > question.maxLength
        ? fail("tooLong", { max: question.maxLength })
        : null;
    case "number": {
      if (typeof answer !== "number" || !Number.isFinite(answer)) return fail("invalid");
      if (question.min !== undefined && answer < question.min) return fail("min", { min: question.min });
      if (question.max !== undefined && answer > question.max) return fail("max", { max: question.max });
      if (question.step !== undefined) {
        const ratio = (answer - (question.min ?? 0)) / question.step;
        if (Math.abs(ratio - Math.round(ratio)) > 1e-9)
          return question.step === 1 ? fail("notInteger") : fail("step", { step: question.step });
      }
      return null;
    }
    case "date": {
      if (typeof answer !== "string" || !isDate(answer)) return fail("invalidDate");
      if (question.min !== undefined && answer < question.min) return fail("dateMin", { min: question.min });
      if (question.max !== undefined && answer > question.max) return fail("dateMax", { max: question.max });
      return null;
    }
  }
}

/** Valide les réponses aux questions visibles (les réponses à des questions masquées sont ignorées). */
export function validateAnswers(
  q: Questionnaire,
  answers: Answers,
  messages: QuestionnaireMessages = defaultQuestionnaireMessages,
): AnswersValidation {
  const errors: Record<string, AnswerError> = {};
  for (const question of visibleQuestions(q, answers)) {
    const e = validateAnswer(question, answers[question.id], messages);
    if (e) errors[question.id] = e;
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
