import * as React from "react";
import { cn } from "../lib/cn";

/** Carte : simple cadre (bordure blanc 10 %), fond transparent, arrondi 8 px, marge 16 px. */
export const Card = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <section ref={ref} className={cn("min-w-0 rounded-lg border bg-transparent p-4", className)} {...props} />
  ),
);
Card.displayName = "Card";

export interface CardHeaderProps {
  /** Titre de carte : 12/500 gris. */
  title: React.ReactNode;
  /** Sous-titre : 10 px, gris atténué. */
  subtitle?: React.ReactNode;
  /** Action ou information à droite (bascule, icône d'info…). */
  actions?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, actions, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-xs font-medium text-muted">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[10px] text-faint-60">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
