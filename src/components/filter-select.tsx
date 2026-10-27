"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSelectProps {
  /** Nom du filtre, affiché en gris devant la valeur (« École », « Période »…). */
  label: string;
  options: FilterOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/**
 * Filtre en puce : le libellé et la valeur tiennent dans un champ de 36 px. Basé sur un `<select>` natif
 * (clavier, lecteurs d'écran et sélecteur mobile gratuits) habillé aux tokens.
 */
export function FilterSelect({ label, options, value, onValueChange, className }: FilterSelectProps) {
  const id = React.useId();
  const current = options.find((o) => o.value === value);
  return (
    <div
      className={cn(
        "relative inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-field pr-2 pl-3 text-sm font-medium focus-within:ring-2 focus-within:ring-foreground/30 hover:bg-foreground/10",
        className,
      )}
    >
      <label htmlFor={id} className="text-muted">
        {label}
      </label>
      <span className="text-foreground">{current?.label}</span>
      <ChevronDown className="size-4 text-muted" aria-hidden="true" />
      <select
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="absolute inset-0 w-full cursor-pointer appearance-none rounded-md opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
