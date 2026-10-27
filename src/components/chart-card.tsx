import * as React from "react";
import { cn } from "../lib/cn";
import { Card, CardHeader } from "./card";

/** Couleurs de série : les tokens `--chart-*`. Une couleur est fixée par série, jamais par rang. */
export type ChartColor = "green" | "amber" | "slate" | "gray" | "red" | "foreground";

export const chartVar = (c: ChartColor) => (c === "foreground" ? "var(--foreground)" : `var(--chart-${c})`);

export interface LegendItem {
  label: string;
  color: ChartColor;
}

/** Légende : pastille ronde + libellé écrit. La couleur ne porte jamais seule le sens. */
export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn("mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted", className)}>
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{ background: chartVar(i.color) }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export interface ChartCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Action ou information à droite du titre (bascule, `InfoTooltip`). */
  actions?: React.ReactNode;
  legend?: LegendItem[];
  /** Note de méthode sous le graphique (12 px gris). */
  footnote?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Carte de graphique : titre, légende écrite, graphique, note de méthode. */
export function ChartCard({
  title,
  subtitle,
  actions,
  legend,
  footnote,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} actions={actions} />
      {legend && <ChartLegend items={legend} />}
      {children}
      {footnote && <p className="mt-3 border-t pt-2 text-xs leading-relaxed text-faint">{footnote}</p>}
    </Card>
  );
}

/**
 * Formateur de valeurs des graphiques. `unit` (ex. « % », « pts ») est sérialisable : à préférer dans un
 * composant serveur, qui ne peut pas passer de fonction à un composant client. `format` l'emporte si fourni.
 */
export function makeFormatter(unit?: string, format?: (v: number) => string) {
  if (format) return format;
  const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
  return (v: number) => (unit ? `${nf.format(v)} ${unit}` : nf.format(v));
}
