import * as React from "react";
import { cn } from "../lib/cn";
import { InfoTooltip } from "./info-tooltip";

export interface KpiStatProps {
  /** Libellé : 2 à 4 mots. */
  label: string;
  /** UN grand chiffre (30/600, -0,75 px), déjà formaté. */
  value: string;
  unit?: string;
  /** Une seule ligne courte (valeur de comparaison, base du chiffre). */
  caption?: React.ReactNode;
  /** Badge discret sous la légende. */
  badge?: React.ReactNode;
  /** Explication au survol de l'icône en haut à droite : rien n'est écrit à l'écran. */
  info?: string;
  /** Petite icône grise illustrant le chiffre. */
  icon?: React.ReactNode;
  /** Emplacement réservé (chiffre pas encore disponible) : estompé. */
  placeholder?: boolean;
  className?: string;
}

/**
 * Chiffre clé SANS cadre ni fond : grand chiffre, libellé, légende courte. Toute explication (méthode,
 * intervalle, effectifs) est au survol de l'icône, jamais à l'écran. À poser dans `KpiGrid`.
 */
export function KpiStat({
  label,
  value,
  unit,
  caption,
  badge,
  info,
  icon,
  placeholder = false,
  className,
}: KpiStatProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", placeholder && "opacity-60", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-stat tabular-nums">
          {value}
          {unit && <span className="ml-1 text-base font-medium text-muted">{unit}</span>}
        </p>
        {info ? (
          <InfoTooltip text={info} icon={icon} />
        ) : (
          icon && <span className="shrink-0 text-faint">{icon}</span>
        )}
      </div>
      <h3 className="text-sm font-medium text-muted">{label}</h3>
      {caption && <p className="truncate text-xs text-faint">{caption}</p>}
      {badge && <div className="mt-0.5">{badge}</div>}
    </div>
  );
}

/** Rangée de chiffres clés : 4 de front dès 1024 px, 2 sur tablette, 1 sur téléphone. */
export function KpiGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("my-6 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4", className)}
      {...props}
    />
  );
}
