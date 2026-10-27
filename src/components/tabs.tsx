"use client";

import * as React from "react";
import { cn } from "../lib/cn";

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  /** Étiquette accessible de la liste d'onglets. */
  label: string;
  /** Préfixe des identifiants, pour relier onglet et panneau (`<id>-tab-<value>` / `<id>-panel-<value>`). */
  idPrefix?: string;
  className?: string;
}

/**
 * Onglets : 14/500, actif en blanc souligné, inactifs en gris. Flèches gauche/droite, Début et Fin
 * déplacent la sélection. Le panneau est rendu par l'appelant (`role="tabpanel"`).
 */
export function Tabs({ items, value, onValueChange, label, idPrefix = "tabs", className }: TabsProps) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = items.length - 1;
    const next =
      e.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : e.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    onValueChange(items[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("mb-4 flex gap-5 overflow-x-auto border-b", className)}
    >
      {items.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${t.value}`}
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${t.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(t.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "-mb-px shrink-0 border-b-2 pb-2 text-sm font-medium outline-none focus-visible:text-foreground",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
