import * as React from "react";
import { cn } from "../lib/cn";
import { StatusDot, type Tone } from "./badge";

export interface ListRowProps {
  /** Initiales (1 à 2 lettres) dans la pastille ronde. */
  initials: string;
  /** Point de statut sur la pastille, si la ligne porte un statut. */
  tone?: Tone;
  title: React.ReactNode;
  detail?: React.ReactNode;
  /** Identifiant ou date à droite, en gris monospace. */
  meta?: string;
  className?: string;
}

/** Ligne de liste : pastille, titre, détail gris, méta à droite. À poser dans `<List>`. */
export function ListRow({ initials, tone, title, detail, meta, className }: ListRowProps) {
  return (
    <li className={cn("flex items-start gap-3 px-4 py-3", className)}>
      <span className="relative mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-muted/48 bg-muted/22 text-xs font-medium">
        {initials}
        {tone && <StatusDot tone={tone} className="absolute -right-0.5 -bottom-0.5 ring-2 ring-background" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">{title}</p>
        {detail && <p className="mt-0.5 text-xs leading-snug text-muted">{detail}</p>}
      </div>
      {meta && <span className="mono shrink-0 text-xs tabular-nums text-muted">{meta}</span>}
    </li>
  );
}

/** Liste : lignes séparées par un filet. */
export function List({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("divide-y", className)} {...props} />;
}
