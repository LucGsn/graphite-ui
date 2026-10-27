import * as React from "react";
import { cn } from "../lib/cn";

/**
 * La couleur est RÉSERVÉE aux statuts : elle ne se porte que par le point. Le badge lui-même reste gris
 * (fond gris 22 %, bordure 48 %, texte plein) : lisible quel que soit le statut, et le mot porte le sens.
 */
export type Tone = "success" | "warning" | "danger" | "neutral";

const DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-neutral",
};

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/** Point de statut seul (6 px). Décoratif : le sens est toujours écrit à côté. */
export function StatusDot({ tone = "neutral", className, ...props }: StatusDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-1.5 shrink-0 rounded-full", DOT[tone], className)}
      {...props}
    />
  );
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Masque le point (badge purement textuel). */
  dot?: boolean;
}

/** Badge : pastille ronde, point de statut + libellé court, 12/500. */
export function Badge({ tone = "neutral", dot = true, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-muted/48 bg-muted/22 px-2 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
      {...props}
    >
      {dot && <StatusDot tone={tone} />}
      {children}
    </span>
  );
}
