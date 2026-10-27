import { cn } from "../lib/cn";
import { formatLabel, resolveLabels, type OnboardingLabels } from "../lib/questionnaire";

export interface ProgressDotsProps {
  /** Étape courante, à partir de 1. */
  current: number;
  total: number;
  labels?: Partial<OnboardingLabels>;
  className?: string;
}

/** Plus de points que cela : on affiche la pilule et « n / total » (une rangée de points ne tiendrait plus à 375 px). */
const MAX_DOTS = 12;

/** Progression : passé en points, étape courante en pilule, futur masqué. */
export function ProgressDots({ current, total, labels, className }: ProgressDotsProps) {
  const l = resolveLabels(labels);
  const past = Math.max(0, Math.min(current - 1, total - 1));
  const compact = total > MAX_DOTS;
  return (
    <div
      role="img"
      aria-label={formatLabel(l.progress, { current, total })}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      {compact
        ? null
        : Array.from({ length: past }, (_, i) => (
            <span key={i} className="size-1.5 rounded-full bg-primary" />
          ))}
      <span className="h-1.5 w-6 rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" />
      {compact ? (
        <span aria-hidden="true" className="ml-1 text-xs font-medium text-muted">
          {current} / {total}
        </span>
      ) : null}
    </div>
  );
}
