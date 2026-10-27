import * as React from "react";

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

/** Infobulle des graphiques : carte aux tokens, une ligne par série. Utilisée via `content` de Recharts. */
export function ChartTooltipBox({ title, rows }: { title?: React.ReactNode; rows: TooltipRow[] }) {
  return (
    <div className="rounded-lg border bg-background p-2.5 text-xs shadow-xl shadow-black/40">
      {title && <p className="mb-1 font-medium">{title}</p>}
      <ul className="space-y-0.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2 text-muted">
            {r.color && (
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: r.color }} />
            )}
            <span>{r.label}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums text-foreground">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
