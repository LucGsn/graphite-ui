"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../lib/cn";
import { resolveLabels, type OnboardingLabels } from "../lib/questionnaire";

export interface CompletionScreenProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Remplace la coche par défaut. */
  icon?: React.ReactNode;
  /** Contenu libre sous le texte (récapitulatif, prochaine étape…). */
  children?: React.ReactNode;
  /** Boutons d'action (ex. « Aller au tableau de bord »). */
  actions?: React.ReactNode;
  /** Déplace le focus sur le titre à l'affichage (défaut : oui) pour l'annoncer aux lecteurs d'écran. */
  autoFocus?: boolean;
  labels?: Partial<OnboardingLabels>;
  className?: string;
}

/** Écran de fin : confirmation centrée, annoncée au lecteur d'écran. */
export function CompletionScreen({
  title,
  description,
  icon,
  children,
  actions,
  autoFocus = true,
  labels,
  className,
}: CompletionScreenProps) {
  const l = resolveLabels(labels);
  const heading = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    if (autoFocus) heading.current?.focus();
  }, [autoFocus]);
  return (
    <div
      className={cn("mx-auto flex w-full max-w-md flex-col items-center px-4 py-16 text-center", className)}
    >
      <div
        aria-hidden="true"
        className="mb-5 flex size-14 items-center justify-center rounded-full border bg-accent text-foreground [&_svg]:size-6"
      >
        {icon ?? <Check strokeWidth={2.5} />}
      </div>
      <h1 ref={heading} tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">
        {title ?? l.completionTitle}
      </h1>
      <p className="mt-2 text-sm text-muted">{description ?? l.completionDescription}</p>
      {children ? <div className="mt-6 w-full text-left">{children}</div> : null}
      {actions ? (
        <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">{actions}</div>
      ) : null}
    </div>
  );
}
