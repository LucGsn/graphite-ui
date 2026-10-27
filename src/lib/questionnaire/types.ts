/**
 * Contrat du questionnaire (version 1) : ce que l'app affiche et ce qu'une IA doit produire.
 * Document JSON pur : aucune fonction, aucun JSX. Le schéma JSON correspondant est
 * `questionnaire.schema.json` ; `validateQuestionnaire` en est la référence exécutable.
 */
export const QUESTIONNAIRE_SCHEMA_VERSION = 1 as const;

export const QUESTION_TYPES = [
  "single",
  "multiple",
  "scale",
  "short",
  "long",
  "number",
  "date",
  "ranking",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export type OptionDisplay = "chips" | "cards";

export interface QuestionOption {
  /** Identifiant stable de l'option (stocké dans la réponse). */
  value: string;
  label: string;
  description?: string;
  /** Clé d'icône, résolue par l'app via la prop `iconMap` (jamais du code ni une URL). */
  icon?: string;
}

/** Option « Autre, préciser » : l'utilisateur saisit un texte libre. */
export interface OtherOption {
  label?: string;
  placeholder?: string;
}

/** Valeur d'une option « Autre » dans une réponse. */
export interface OtherChoice {
  other: string;
}

type Scalar = string | number | boolean;

/** Un seul opérateur par condition. */
export type LeafCondition =
  | { question: string; equals: Scalar }
  | { question: string; in: Scalar[] }
  | { question: string; notEmpty: true }
  | { question: string; gt: number }
  | { question: string; lt: number }
  | { question: string; contains: string };

export type Condition = LeafCondition | { all: Condition[] } | { any: Condition[] };

interface QuestionBase {
  /** Unique dans tout le questionnaire. */
  id: string;
  label: string;
  help?: string;
  /** Réponse obligatoire (défaut : false). */
  required?: boolean;
  /** Question affichée seulement si la condition est vraie (sur des questions placées avant). */
  showIf?: Condition;
}

export interface SingleQuestion extends QuestionBase {
  type: "single";
  options: QuestionOption[];
  display?: OptionDisplay;
  allowOther?: boolean | OtherOption;
}

export interface MultipleQuestion extends QuestionBase {
  type: "multiple";
  options: QuestionOption[];
  display?: OptionDisplay;
  allowOther?: boolean | OtherOption;
  /** Nombre maximal de choix (« Autre » compte pour un). */
  maxChoices?: number;
}

export interface ScaleQuestion extends QuestionBase {
  type: "scale";
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface ShortQuestion extends QuestionBase {
  type: "short";
  placeholder?: string;
  maxLength?: number;
}

export interface LongQuestion extends QuestionBase {
  type: "long";
  placeholder?: string;
  maxLength?: number;
}

export interface NumberQuestion extends QuestionBase {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}

export interface DateQuestion extends QuestionBase {
  type: "date";
  /** AAAA-MM-JJ. */
  min?: string;
  max?: string;
}

export interface RankingQuestion extends QuestionBase {
  type: "ranking";
  options: QuestionOption[];
}

export type Question =
  | SingleQuestion
  | MultipleQuestion
  | ScaleQuestion
  | ShortQuestion
  | LongQuestion
  | NumberQuestion
  | DateQuestion
  | RankingQuestion;

export interface Section {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface Questionnaire {
  schemaVersion: typeof QUESTIONNAIRE_SCHEMA_VERSION;
  id: string;
  title: string;
  description?: string;
  sections: Section[];
}

/** Réponse à une question : choix unique, nombre, texte/date, ou liste (multiple, classement). */
export type Answer = string | number | OtherChoice | (string | OtherChoice)[];
export type Answers = Record<string, Answer>;

export function isOtherChoice(value: unknown): value is OtherChoice {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as OtherChoice).other === "string"
  );
}

/** Toutes les questions, dans l'ordre du document. */
export function allQuestions(q: Questionnaire): Question[] {
  return q.sections.flatMap((s) => s.questions);
}
