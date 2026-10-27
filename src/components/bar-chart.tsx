"use client";

import * as React from "react";
import { Bar, BarChart as RBarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "../lib/cn";
import { chartVar, makeFormatter, type ChartColor } from "./chart-card";
import { ChartTooltipBox } from "./chart-tooltip";

export interface BarDatum {
  label: string;
  value: number;
  /** Couleur fixée par catégorie ; par défaut gris. */
  color?: ChartColor;
}

export interface BarChartProps {
  data: BarDatum[];
  /** `horizontal` : barres couchées, libellés à gauche (lecture des classements). */
  orientation?: "horizontal" | "vertical";
  height?: number;
  /** Unité écrite après la valeur (« % », « pts »). Sérialisable : à préférer dans un composant serveur. */
  unit?: string;
  /** Formateur sur mesure (composants clients) ; l'emporte sur `unit`. */
  formatValue?: (v: number) => string;
  /** Étiquette accessible du graphique. */
  label: string;
  className?: string;
}

const TICK = { fill: "var(--muted)", fontSize: 12 };

/**
 * Diagramme en barres. Les valeurs sont toujours écrites (au bout des barres horizontales, dans l'infobulle
 * sinon) et un tableau masqué reprend les données pour les lecteurs d'écran.
 */
export function BarChart({
  data,
  orientation = "horizontal",
  height = 240,
  unit,
  formatValue: formatProp,
  label,
  className,
}: BarChartProps) {
  const formatValue = makeFormatter(unit, formatProp);
  const horizontal = orientation === "horizontal";
  return (
    <figure aria-label={label} className={cn("m-0", className)}>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 640, height }}>
          <RBarChart
            data={data}
            layout={horizontal ? "vertical" : "horizontal"}
            margin={{ top: 4, right: horizontal ? 48 : 8, bottom: 0, left: 0 }}
          >
            {horizontal ? (
              <>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={TICK}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
              </>
            ) : (
              <>
                <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                <YAxis tick={TICK} tickLine={false} axisLine={false} width={40} tickFormatter={formatValue} />
              </>
            )}
            <Tooltip
              cursor={{ fill: "var(--field)" }}
              isAnimationActive={false}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <ChartTooltipBox
                    title={payload[0].payload.label}
                    rows={[{ label: "Valeur", value: formatValue(payload[0].payload.value) }]}
                  />
                ) : null
              }
            />
            <Bar
              dataKey="value"
              radius={4}
              maxBarSize={horizontal ? 18 : 40}
              isAnimationActive={false}
              label={
                horizontal
                  ? {
                      position: "right",
                      fill: "var(--foreground)",
                      fontSize: 12,
                      formatter: (v: unknown) => formatValue(Number(v)),
                    }
                  : undefined
              }
            >
              {data.map((d) => (
                <Cell key={d.label} fill={chartVar(d.color ?? "gray")} />
              ))}
            </Bar>
          </RBarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{formatValue(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
