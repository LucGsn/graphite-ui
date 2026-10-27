import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn } from "../lib/cn";
import { resolveLabels, type OnboardingLabels } from "../lib/questionnaire";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface SaveIndicatorProps {
  status: SaveStatus;
  labels?: Partial<OnboardingLabels>;
  /** N'affiche que l'icône (le texte reste lu par les lecteurs d'écran). */
  compact?: boolean;
  className?: string;
}

/** Indicateur d'enregistrement : annoncé poliment aux lecteurs d'écran, jamais par la seule couleur. */
export function SaveIndicator({ status, labels, compact = false, className }: SaveIndicatorProps) {
  const l = resolveLabels(labels);
  const text =
    status === "saving" ? l.saving : status === "saved" ? l.saved : status === "error" ? l.saveError : "";
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 text-xs",
        status === "error" ? "font-medium text-danger" : "text-muted",
        className,
      )}
    >
      {status === "saving" ? (
        <Loader2 aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" />
      ) : null}
      {status === "saved" ? <Check aria-hidden="true" className="size-3.5" /> : null}
      {status === "error" ? <AlertCircle aria-hidden="true" className="size-3.5" /> : null}
      {text ? <span className={cn(compact && "sr-only")}>{text}</span> : null}
    </span>
  );
}
