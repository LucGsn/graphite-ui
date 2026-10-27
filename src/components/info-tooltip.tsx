"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "../lib/cn";

export interface InfoTooltipProps {
  /** Explication affichée dans l'infobulle ; sert aussi de description accessible. */
  text: string;
  /** Étiquette accessible du bouton. */
  label?: string;
  /** Icône à la place du « i » (l'explication s'ouvre alors à son survol). */
  icon?: React.ReactNode;
  /** Côté d'alignement de l'infobulle par rapport au bouton. */
  align?: "start" | "end";
  className?: string;
}

/**
 * Icône « i » : l'explication s'ouvre au SURVOL, au CLIC / toucher et au clavier (Entrée, Espace ; Échap ou un
 * clic ailleurs referme). L'écran reste léger, et rien d'essentiel n'est réservé à la souris.
 */
export function InfoTooltip({
  text,
  label = "Explication",
  icon,
  align = "end",
  className,
}: InfoTooltipProps) {
  const [pinned, setPinned] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const root = React.useRef<HTMLSpanElement>(null);
  const id = React.useId();
  const open = pinned || hovered;

  React.useEffect(() => {
    if (!pinned) return;
    const outside = (e: MouseEvent | TouchEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setPinned(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setPinned(false);
    document.addEventListener("mousedown", outside);
    document.addEventListener("touchstart", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("touchstart", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [pinned]);

  return (
    <span
      ref={root}
      className={cn("relative inline-flex shrink-0", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setPinned((v) => !v)}
        className="inline-flex cursor-pointer rounded-full text-faint hover:text-foreground focus-visible:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary"
      >
        {icon ?? <Info className="size-3.5" strokeWidth={1.75} />}
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "absolute top-full z-30 mt-1.5 w-64 max-w-[80vw] rounded-lg border bg-background p-2.5 text-left text-xs font-normal normal-case leading-snug tracking-normal text-foreground shadow-xl shadow-black/40",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {text}
        </span>
      )}
    </span>
  );
}
