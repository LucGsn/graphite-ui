"use client";

import * as React from "react";
import { cn } from "../lib/cn";

export interface ToggleOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface BaseProps {
  options: ToggleOption[];
  /** Étiquette accessible du groupe. */
  label: string;
  className?: string;
}

export type ToggleGroupProps = BaseProps &
  (
    | { type?: "single"; value: string; onValueChange: (value: string) => void }
    | { type: "multiple"; value: string[]; onValueChange: (value: string[]) => void }
  );

/** Groupe de boutons accolés (bascule). `single` : un choix exclusif ; `multiple` : plusieurs actifs. */
export function ToggleGroup(props: ToggleGroupProps) {
  const { options, label, className } = props;
  const isOn = (v: string) => (props.type === "multiple" ? props.value.includes(v) : props.value === v);
  const toggle = (v: string) => {
    if (props.type === "multiple")
      props.onValueChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    else props.onValueChange(v);
  };
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex overflow-hidden rounded-md border border-input", className)}
    >
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={isOn(o.value)}
          onClick={() => toggle(o.value)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/30 [&_svg]:size-4",
            i > 0 && "border-l border-input",
            isOn(o.value) ? "bg-accent text-foreground" : "bg-field text-muted hover:text-foreground",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
