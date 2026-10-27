"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "../lib/cn";
import { chartVar, ChartLegend, makeFormatter, type ChartColor } from "./chart-card";
import { ChartTooltipBox } from "./chart-tooltip";

export interface LineSeries {
  /** Clé de la valeur dans chaque ligne de `data`. */
  key: string;
  label: string;
  color: ChartColor;
  /** Bande d'incertitude (ex. intervalle de confiance) : clés des bornes basse et haute. */
  band?: { lower: string; upper: string };
}

export type LineRow = Record<string, string | number | null>;

export interface LineChartProps {
  data: LineRow[];
  /** Clé de l'axe horizontal (ex. la période). */
  xKey: string;
  series: LineSeries[];
  height?: number;
  /** Unité écrite après la valeur (« % », « pts »). Sérialisable : à préférer dans un composant serveur. */
  unit?: string;
  /** Formateur sur mesure (composants clients) ; l'emporte sur `unit`. */
  formatValue?: (v: number) => string;
  /** Bornes de l'axe vertical ; `["auto","auto"]` par défaut. */
  yDomain?: [number | "auto", number | "auto"];
  /** Étiquette accessible du graphique. */
  label: string;
  /** Masque la légende (quand la carte la porte déjà). */
  hideLegend?: boolean;
  className?: string;
}

const TICK = { fill: "var(--muted)", fontSize: 12 };
const bandKey = (k: string) => `${k}__band`;

/**
 * Courbes avec bande d'incertitude optionnelle (gris très léger sous la courbe). Légende écrite, valeurs dans
 * l'infobulle, tableau masqué pour les lecteurs d'écran. Les valeurs nulles interrompent la courbe.
 */
export function LineChart({
  data,
  xKey,
  series,
  height = 260,
  unit,
  formatValue: formatProp,
  yDomain = ["auto", "auto"],
  label,
  hideLegend = false,
  className,
}: LineChartProps) {
  const formatValue = makeFormatter(unit, formatProp);
  const rows = React.useMemo(
    () =>
      data.map((r) => {
        const out: Record<string, unknown> = { ...r };
        for (const s of series)
          if (s.band) {
            const [lo, hi] = [r[s.band.lower], r[s.band.upper]];
            out[bandKey(s.key)] = typeof lo === "number" && typeof hi === "number" ? [lo, hi] : null;
          }
        return out;
      }),
    [data, series],
  );

  return (
    <figure aria-label={label} className={cn("m-0", className)}>
      {!hideLegend && <ChartLegend items={series.map((s) => ({ label: s.label, color: s.color }))} />}
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 640, height }}>
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey={xKey} tick={TICK} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis
              tick={TICK}
              tickLine={false}
              axisLine={false}
              width={44}
              domain={yDomain}
              tickFormatter={formatValue}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: "var(--input)" }}
              content={({ active, payload, label: x }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as Record<string, unknown>;
                const rowsOut = series.flatMap((s) => {
                  const v = row[s.key];
                  if (typeof v !== "number") return [];
                  const b = s.band && row[bandKey(s.key)];
                  const range = Array.isArray(b) ? ` (${formatValue(b[0])} – ${formatValue(b[1])})` : "";
                  return [{ label: s.label, value: formatValue(v) + range, color: chartVar(s.color) }];
                });
                return <ChartTooltipBox title={String(x)} rows={rowsOut} />;
              }}
            />
            {series.map(
              (s) =>
                s.band && (
                  <Area
                    key={bandKey(s.key)}
                    dataKey={bandKey(s.key)}
                    stroke="none"
                    fill="var(--chart-band)"
                    fillOpacity={1}
                    activeDot={false}
                    isAnimationActive={false}
                    legendType="none"
                  />
                ),
            )}
            {series.map((s) => (
              <Line
                key={s.key}
                dataKey={s.key}
                type="monotone"
                stroke={chartVar(s.color)}
                strokeWidth={2}
                dot={{ r: 3, fill: chartVar(s.color), strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">{xKey}</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={String(r[xKey])}>
              <th scope="row">{String(r[xKey])}</th>
              {series.map((s) => (
                <td key={s.key}>{typeof r[s.key] === "number" ? formatValue(r[s.key] as number) : "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
