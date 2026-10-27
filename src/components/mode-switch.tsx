"use client";

import { ToggleGroup, type ToggleOption } from "./toggle-group";

export interface ModeSwitchProps {
  /** Exactement deux modes (ex. Lecture / Expert), chacun avec une icône. */
  modes: [ToggleOption, ToggleOption];
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
}

/**
 * Bascule de mode d'affichage à deux positions : le mode « Lecture » montre l'essentiel, le mode « Expert »
 * ajoute le détail. L'état doit vivre dans l'URL (`?mode=expert`) pour qu'un lien partage la même vue.
 */
export function ModeSwitch({
  modes,
  value,
  onValueChange,
  label = "Mode d'affichage",
  className,
}: ModeSwitchProps) {
  return (
    <ToggleGroup
      label={label}
      options={modes}
      value={value}
      onValueChange={onValueChange}
      className={className}
    />
  );
}
