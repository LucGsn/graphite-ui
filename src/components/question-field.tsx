"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/cn";
import {
  formatLabel,
  isOtherChoice,
  resolveLabels,
  type Answer,
  type OnboardingLabels,
  type OtherChoice,
  type OtherOption,
  type Question,
  type QuestionOption,
} from "../lib/questionnaire";

/** Icônes d'options : la clé `icon` du schéma est résolue ici (le schéma ne porte jamais de code). */
export type IconMap = Record<string, React.ReactNode>;

export interface QuestionFieldProps {
  question: Question;
  value: Answer | undefined;
  onChange: (value: Answer | undefined) => void;
  /** Message d'erreur déjà prêt à afficher. */
  error?: string | null;
  labels?: Partial<OnboardingLabels>;
  iconMap?: IconMap;
  /** Locale des dates et des nombres (défaut : fr-FR). */
  locale?: string;
  /** `false` : pas d'intitulé propre (l'écran porte déjà le titre) ; `labelledBy` est alors requis. */
  showHeader?: boolean;
  labelledBy?: string;
  describedBy?: string;
  autoFocus?: boolean;
  /** Alignement des puces (défaut : start ; l'écran d'onboarding les centre). */
  align?: "start" | "center";
  className?: string;
  onBlur?: () => void;
}

const FOCUS = "focus-visible:ring-2 focus-visible:ring-foreground/30";
const INPUT =
  "w-full rounded-md border border-input bg-field px-3 text-base text-foreground outline-none placeholder:text-faint sm:text-sm " +
  FOCUS +
  " aria-[invalid=true]:border-danger disabled:opacity-50";

/** Une question, quel que soit son type. Accessible au clavier et au lecteur d'écran (groupes natifs, erreurs liées). */
export function QuestionField({
  question,
  value,
  onChange,
  error,
  labels: labelOverrides,
  iconMap,
  locale = "fr-FR",
  showHeader = true,
  labelledBy,
  describedBy,
  autoFocus,
  align = "start",
  className,
  onBlur,
}: QuestionFieldProps) {
  const labels = resolveLabels(labelOverrides);
  const uid = React.useId();
  const labelId = `${uid}-label`;
  const helpId = `${uid}-help`;
  const errorId = `${uid}-error`;
  const grouped = ["single", "multiple", "scale", "ranking"].includes(question.type);
  const ariaLabelledBy = showHeader ? labelId : labelledBy;
  const ariaDescribedBy =
    [question.help && showHeader ? helpId : null, describedBy, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;
  const shared = {
    question,
    value,
    onChange,
    labels,
    iconMap,
    locale,
    uid,
    labelledBy: ariaLabelledBy,
    describedBy: ariaDescribedBy,
    invalid: Boolean(error),
    autoFocus,
    align,
  };

  // Le champ est « quitté » quand le focus sort du groupe, pas quand il passe d'une option à l'autre.
  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onBlur?.();
  };

  const header = showHeader ? (
    <div className="mb-3">
      {grouped ? (
        <legend id={labelId} className="float-left w-full p-0 text-base font-medium">
          {question.label}
        </legend>
      ) : (
        <label id={labelId} htmlFor={`${uid}-input`} className="block text-base font-medium">
          {question.label}
        </label>
      )}
      <div className="clear-both" />
      {question.required ? <span className="mt-0.5 block text-xs text-muted">{labels.required}</span> : null}
      {question.help ? (
        <p id={helpId} className="mt-1 text-sm text-muted">
          {question.help}
        </p>
      ) : null}
    </div>
  ) : null;

  const body = (
    <>
      {question.type === "single" || question.type === "multiple" ? (
        <ChoiceBody {...shared} question={question} />
      ) : null}
      {question.type === "scale" ? <ScaleBody {...shared} question={question} /> : null}
      {question.type === "ranking" ? <RankingBody {...shared} question={question} /> : null}
      {question.type === "short" || question.type === "long" ? (
        <TextBody {...shared} question={question} />
      ) : null}
      {question.type === "number" ? <NumberBody {...shared} question={question} /> : null}
      {question.type === "date" ? <DateBody {...shared} question={question} /> : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </>
  );

  return grouped ? (
    <fieldset
      className={cn("min-w-0 border-0 p-0", className)}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      onBlur={handleBlur}
    >
      {header}
      {body}
    </fieldset>
  ) : (
    <div className={cn("min-w-0", className)} onBlur={handleBlur}>
      {header}
      {body}
    </div>
  );
}

interface BodyProps<Q extends Question> {
  question: Q;
  value: Answer | undefined;
  onChange: (value: Answer | undefined) => void;
  labels: OnboardingLabels;
  iconMap?: IconMap;
  locale: string;
  uid: string;
  labelledBy?: string;
  describedBy?: string;
  invalid: boolean;
  autoFocus?: boolean;
  align: "start" | "center";
}

// ---------------------------------------------------------------------------
// Choix unique / multiple (puces ou cartes, « Autre », maximum de choix)
// ---------------------------------------------------------------------------

function otherConfig(allow: boolean | OtherOption | undefined, labels: OnboardingLabels) {
  if (!allow) return null;
  const o = allow === true ? {} : allow;
  return { label: o.label ?? labels.otherLabel, placeholder: o.placeholder ?? labels.otherPlaceholder };
}

function ChoiceBody({
  question,
  value,
  onChange,
  labels,
  iconMap,
  uid,
  describedBy,
  invalid,
  autoFocus,
  align,
}: BodyProps<Extract<Question, { type: "single" | "multiple" }>>) {
  const multiple = question.type === "multiple";
  const display = question.display ?? "chips";
  const other = otherConfig(question.allowOther, labels);
  const list: (string | OtherChoice)[] = multiple
    ? Array.isArray(value)
      ? value
      : []
    : value === undefined
      ? []
      : [value as string | OtherChoice];
  const selectedValues = list.filter((v): v is string => typeof v === "string");
  const otherChoice = list.find(isOtherChoice);
  const max = multiple ? question.maxChoices : undefined;
  const atMax = max !== undefined && list.length >= max;
  const otherInput = React.useRef<HTMLInputElement>(null);
  const focusOther = React.useRef(false);

  React.useEffect(() => {
    if (focusOther.current && otherChoice) {
      focusOther.current = false;
      otherInput.current?.focus();
    }
  });

  const toggle = (optionValue: string) => {
    if (!multiple) return onChange(optionValue);
    const next = selectedValues.includes(optionValue)
      ? list.filter((v) => v !== optionValue)
      : [...list, optionValue];
    onChange(next.length ? next : undefined);
  };
  const toggleOther = () => {
    if (!multiple) {
      focusOther.current = true;
      return onChange({ other: otherChoice?.other ?? "" });
    }
    if (otherChoice) {
      const next = list.filter((v) => !isOtherChoice(v));
      return onChange(next.length ? next : undefined);
    }
    focusOther.current = true;
    onChange([...list, { other: "" }]);
  };
  const setOtherText = (text: string) => {
    if (!multiple) return onChange({ other: text });
    onChange(list.map((v) => (isOtherChoice(v) ? { other: text } : v)));
  };

  const name = `${uid}-choice`;
  const choice = (
    key: string,
    checked: boolean,
    onToggle: () => void,
    content: { label: string; description?: string; icon?: React.ReactNode },
    disabled = false,
  ) => (
    <label
      key={key}
      className={cn(
        "group relative flex cursor-pointer border border-input bg-field text-foreground transition-colors hover:bg-foreground/10 has-[:checked]:border-foreground has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/30 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:disabled]:hover:bg-field",
        display === "cards"
          ? "w-full items-start gap-3 rounded-lg p-3.5"
          : "min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium",
      )}
    >
      <input
        type={multiple ? "checkbox" : "radio"}
        name={name}
        className="peer sr-only"
        checked={checked}
        disabled={disabled && !checked}
        onChange={onToggle}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoFocus={autoFocus && key === "opt-0"}
      />
      {display === "cards" ? (
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center border border-input bg-background text-background group-has-[:checked]:border-foreground group-has-[:checked]:bg-foreground",
            multiple ? "rounded-sm" : "rounded-full",
          )}
        >
          <Check className="size-3.5 opacity-0 group-has-[:checked]:opacity-100" strokeWidth={3} />
        </span>
      ) : (
        <Check
          aria-hidden="true"
          className="hidden size-4 shrink-0 group-has-[:checked]:block"
          strokeWidth={3}
        />
      )}
      {content.icon ? (
        <span
          aria-hidden="true"
          className="flex shrink-0 text-muted group-has-[:checked]:text-foreground [&_svg]:size-5"
        >
          {content.icon}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className={cn("block", display === "cards" && "text-sm font-medium")}>{content.label}</span>
        {content.description ? (
          <span className="mt-0.5 block text-sm font-normal text-muted">{content.description}</span>
        ) : null}
      </span>
    </label>
  );

  const optionNodes = question.options.map((o: QuestionOption, i) =>
    choice(
      `opt-${i}`,
      selectedValues.includes(o.value),
      () => toggle(o.value),
      { label: o.label, description: o.description, icon: o.icon ? iconMap?.[o.icon] : undefined },
      multiple && atMax,
    ),
  );
  if (other) {
    optionNodes.push(
      choice("other", Boolean(otherChoice), toggleOther, { label: other.label }, multiple && atMax),
    );
  }

  return (
    <div>
      <div
        className={cn(
          display === "cards" ? "flex flex-col gap-2.5" : "flex flex-wrap gap-2",
          align === "center" && "justify-center",
        )}
      >
        {optionNodes}
      </div>
      {other && otherChoice ? (
        <input
          ref={otherInput}
          type="text"
          value={otherChoice.other}
          onChange={(e) => setOtherText(e.target.value)}
          placeholder={other.placeholder}
          aria-label={other.label}
          aria-invalid={invalid || undefined}
          className={cn(INPUT, "mt-3 h-11")}
        />
      ) : null}
      {max !== undefined ? (
        <p className="mt-2 text-xs text-muted" aria-live="polite">
          {formatLabel(labels.selectedCount, { count: list.length, max })}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Échelle
// ---------------------------------------------------------------------------

function ScaleBody({
  question,
  value,
  onChange,
  uid,
  describedBy,
  invalid,
  autoFocus,
}: BodyProps<Extract<Question, { type: "scale" }>>) {
  const points = Array.from({ length: question.max - question.min + 1 }, (_, i) => question.min + i);
  return (
    <div>
      <div className="flex gap-1.5">
        {points.map((n, i) => (
          <label
            key={n}
            className="group flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-md border border-input bg-field text-sm font-medium transition-colors hover:bg-foreground/10 has-[:checked]:border-foreground has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/30"
          >
            <input
              type="radio"
              name={`${uid}-scale`}
              className="peer sr-only"
              checked={value === n}
              onChange={() => onChange(n)}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              autoFocus={autoFocus && i === 0}
            />
            {n}
            {n === question.min && question.minLabel ? (
              <span className="sr-only"> ({question.minLabel})</span>
            ) : null}
            {n === question.max && question.maxLabel ? (
              <span className="sr-only"> ({question.maxLabel})</span>
            ) : null}
          </label>
        ))}
      </div>
      {question.minLabel || question.maxLabel ? (
        <div aria-hidden="true" className="mt-1.5 flex justify-between gap-4 text-xs text-muted">
          <span>{question.minLabel}</span>
          <span className="text-right">{question.maxLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Classement (boutons monter / descendre : sans glisser-déposer, donc au clavier)
// ---------------------------------------------------------------------------

function RankingBody({
  question,
  value,
  onChange,
  labels,
  iconMap,
  uid,
  describedBy,
}: BodyProps<Extract<Question, { type: "ranking" }>>) {
  const byValue = new Map(question.options.map((o) => [o.value, o]));
  const given = Array.isArray(value)
    ? (value.filter((v): v is string => typeof v === "string") as string[])
    : null;
  const confirmed = given !== null && given.length === question.options.length;
  const order = confirmed ? given : question.options.map((o) => o.value);
  const [announcement, setAnnouncement] = React.useState("");
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
    setAnnouncement(
      formatLabel(labels.rankPosition, {
        label: byValue.get(item!)?.label ?? item!,
        position: to + 1,
        total: order.length,
      }),
    );
  };
  const btn =
    "inline-flex size-11 items-center justify-center rounded-md border border-input bg-field text-foreground outline-none hover:bg-foreground/10 disabled:pointer-events-none disabled:opacity-40 sm:size-9 " +
    FOCUS;
  return (
    <div>
      <p id={`${uid}-rank-hint`} className="mb-2 text-sm text-muted">
        {labels.rankHint}
      </p>
      <ol
        aria-describedby={`${uid}-rank-hint${describedBy ? ` ${describedBy}` : ""}`}
        className="flex flex-col gap-2"
      >
        {order.map((v, i) => {
          const o = byValue.get(v)!;
          const icon = o.icon ? iconMap?.[o.icon] : undefined;
          return (
            <li
              key={v}
              className="flex items-center gap-3 rounded-lg border border-input bg-field p-2.5 pl-3.5"
            >
              <span aria-hidden="true" className="w-5 shrink-0 text-sm font-medium text-muted">
                {i + 1}
              </span>
              {icon ? (
                <span aria-hidden="true" className="flex shrink-0 text-muted [&_svg]:size-5">
                  {icon}
                </span>
              ) : null}
              <span className="min-w-0 flex-1 text-sm font-medium">
                {o.label}
                {o.description ? (
                  <span className="mt-0.5 block font-normal text-muted">{o.description}</span>
                ) : null}
              </span>
              <button
                type="button"
                className={btn}
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                aria-label={formatLabel(labels.moveUp, { label: o.label })}
              >
                <ChevronUp className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => move(i, i + 1)}
                disabled={i === order.length - 1}
                aria-label={formatLabel(labels.moveDown, { label: o.label })}
              >
                <ChevronDown className="size-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ol>
      {!confirmed ? (
        <button
          type="button"
          className={cn(btn, "mt-3 h-11 w-auto px-3 text-sm font-medium sm:h-9")}
          onClick={() => onChange(order)}
        >
          {labels.rankKeep}
        </button>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Texte court / long, nombre, date
// ---------------------------------------------------------------------------

function TextBody({
  question,
  value,
  onChange,
  labels,
  uid,
  labelledBy,
  describedBy,
  invalid,
  autoFocus,
}: BodyProps<Extract<Question, { type: "short" | "long" }>>) {
  const text = typeof value === "string" ? value : "";
  const common = {
    id: `${uid}-input`,
    value: text,
    placeholder: question.placeholder,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
    "aria-invalid": invalid || undefined,
    autoFocus,
  };
  const set = (v: string) => onChange(v === "" ? undefined : v);
  return (
    <div>
      {question.type === "long" ? (
        <textarea
          {...common}
          rows={5}
          onChange={(e) => set(e.target.value)}
          className={cn(INPUT, "min-h-28 py-2")}
        />
      ) : (
        <input {...common} type="text" onChange={(e) => set(e.target.value)} className={cn(INPUT, "h-11")} />
      )}
      {question.maxLength !== undefined ? (
        <p
          className={cn(
            "mt-1 text-right text-xs",
            text.length > question.maxLength ? "font-medium text-danger" : "text-muted",
          )}
        >
          {formatLabel(labels.charCount, { count: text.length, max: question.maxLength })}
        </p>
      ) : null}
    </div>
  );
}

function NumberBody({
  question,
  value,
  onChange,
  uid,
  labelledBy,
  describedBy,
  invalid,
  autoFocus,
}: BodyProps<Extract<Question, { type: "number" }>>) {
  const current = typeof value === "number" ? value : undefined;
  const [text, setText] = React.useState(current === undefined ? "" : String(current));
  const emitted = React.useRef(current);
  React.useEffect(() => {
    if (current !== emitted.current) {
      emitted.current = current;
      setText(current === undefined ? "" : String(current));
    }
  }, [current]);
  return (
    <div className="flex items-center gap-2">
      <input
        id={`${uid}-input`}
        type="number"
        inputMode="decimal"
        value={text}
        min={question.min}
        max={question.max}
        step={question.step ?? "any"}
        placeholder={question.placeholder}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        autoFocus={autoFocus}
        onChange={(e) => {
          setText(e.target.value);
          const n = e.target.value.trim() === "" ? undefined : Number(e.target.value);
          const next = n !== undefined && Number.isFinite(n) ? n : undefined;
          emitted.current = next;
          onChange(next);
        }}
        className={cn(INPUT, "h-11 max-w-48")}
      />
      {question.unit ? <span className="text-sm text-muted">{question.unit}</span> : null}
    </div>
  );
}

function DateBody({
  question,
  value,
  onChange,
  uid,
  labelledBy,
  describedBy,
  invalid,
  autoFocus,
}: BodyProps<Extract<Question, { type: "date" }>>) {
  return (
    <input
      id={`${uid}-input`}
      type="date"
      value={typeof value === "string" ? value : ""}
      min={question.min}
      max={question.max}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
      className={cn(INPUT, "h-11 max-w-56")}
    />
  );
}
