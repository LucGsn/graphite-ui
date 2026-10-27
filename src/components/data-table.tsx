"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "../lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  /** Rendu de la cellule ; par défaut `row[key]`. */
  cell?: (row: T) => React.ReactNode;
  /** Valeur de tri ; fournir pour rendre la colonne triable. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  /** Chiffres alignés (tabular-nums) : à activer pour les colonnes numériques. */
  numeric?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Légende accessible du tableau (lue par les lecteurs d'écran, non affichée). */
  caption: string;
  /** Rendu quand `rows` est vide (ex. un `EmptyState`). */
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

type Sort = { key: string; dir: "asc" | "desc" } | null;

/**
 * Tableau de données : en-têtes 12/500 gris, lignes séparées par un filet, tri au clic sur les colonnes
 * qui fournissent `sortValue` (`aria-sort` tenu à jour). Défile horizontalement sur mobile.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  empty,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<Sort>(null);

  const sorted = React.useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!sort || !col?.sortValue) return rows;
    const get = col.sortValue;
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const [x, y] = [get(a), get(b)];
      return (
        (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "fr")) *
        sign
      );
    });
  }, [rows, columns, sort]);

  if (rows.length === 0 && empty) return <>{empty}</>;

  const nextSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));

  return (
    <div className={cn("overflow-x-auto rounded-lg border", className)}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b">
            {columns.map((c) => {
              const active = sort?.key === c.key ? sort.dir : null;
              const right = c.align === "right" || c.numeric;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={
                    active
                      ? active === "asc"
                        ? "ascending"
                        : "descending"
                      : c.sortValue
                        ? "none"
                        : undefined
                  }
                  className={cn(
                    "px-4 py-2.5 text-xs font-medium text-muted",
                    right ? "text-right" : "text-left",
                  )}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => nextSort(c.key)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/30",
                        right && "flex-row-reverse",
                      )}
                    >
                      {c.header}
                      {active === "asc" ? (
                        <ArrowUp className="size-3" aria-hidden="true" />
                      ) : active === "desc" ? (
                        <ArrowDown className="size-3" aria-hidden="true" />
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-60" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              className={cn(
                onRowClick &&
                  "cursor-pointer outline-none hover:bg-foreground/5 focus-visible:bg-foreground/10",
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "px-4 py-3",
                    (c.align === "right" || c.numeric) && "text-right",
                    c.numeric && "tabular-nums",
                  )}
                >
                  {c.cell ? c.cell(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
