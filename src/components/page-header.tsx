import * as React from "react";
import { cn } from "../lib/cn";

export interface PageHeaderProps {
  /** Titre SEUL à gauche : 14/600 majuscules. */
  title: string;
  /** Une ligne courte sous l'en-tête. */
  description?: React.ReactNode;
  /** Actions à droite (bascule de mode, bouton…). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * En-tête de page : 60 px, filet bas d'un bord à l'autre du contenu (déborde des marges de `AppShell`),
 * titre seul à gauche, actions à droite.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <>
      <header
        className={cn(
          "-mx-4 mb-4 flex h-[60px] items-center justify-between gap-3 border-b px-4 sm:-mx-6 sm:px-6",
          className,
        )}
      >
        <h1 className="truncate text-sm font-semibold uppercase tracking-[0.7px]">{title}</h1>
        {actions}
      </header>
      {description && <p className="mb-4 text-xs text-faint">{description}</p>}
    </>
  );
}

/** Titre de section : 14/600 majuscules, espacement 0,35 px, GRIS. */
export function SectionTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("mb-3 text-sm font-semibold uppercase tracking-[0.35px] text-muted", className)}
      {...props}
    />
  );
}

/** Séparateur de groupe : libellé 10 px majuscules centré sur un filet. */
export function GroupDivider({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("my-4 flex items-center gap-3", className)} role="separator">
      <span className="h-px flex-1 bg-border" />
      <span className="text-micro font-medium uppercase tracking-[1px] text-faint-60">{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
