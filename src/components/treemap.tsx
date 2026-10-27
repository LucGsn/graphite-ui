"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import { layoutTreemap } from "../lib/treemap";

export interface TreemapItem {
  id: string;
  label: string;
  /** Détermine la SURFACE du bloc. */
  value: number;
  /** Détermine l'INTENSITÉ de la teinte, de 0 (pâle) à 1 (pleine). */
  intensity: number;
  /** Texte secondaire (affiché quand le bloc est assez grand, toujours dans l'infobulle). */
  detail?: string;
  href?: string;
}

export interface TreemapProps {
  items: TreemapItem[];
  /** Largeur / hauteur du conteneur. */
  ratio?: number;
  /** Étiquette accessible de la carte entière. */
  label: string;
  /** Composant de lien (ex. `next/link`) pour les blocs avec `href`. */
  linkComponent?: React.ElementType;
  className?: string;
}

/** Opacité (en %) de la teinte d'un bloc : 5 % (pâle) à 50 % (dense) ; plafonnée pour que le texte reste lisible (≥ 4,5:1, testé). */
export const treemapOpacity = (i: number) => Math.round(5 + Math.min(1, Math.max(0, i)) * 45);

/** Teinte d'un bloc : la couleur « série verte », plus ou moins dense selon l'intensité. */
const tint = (i: number) => `color-mix(in oklab, var(--chart-green) ${treemapOpacity(i)}%, transparent)`;

/**
 * Carte proportionnelle : SURFACE = une grandeur (ex. la demande), INTENSITÉ = une autre (ex. la couverture).
 * Un grand bloc pâle = beaucoup de volume, peu de couverture : une opportunité. Les textes n'apparaissent
 * que si le bloc est assez grand ; l'infobulle native donne toujours le détail.
 */
export function Treemap({ items, ratio = 2, label, linkComponent: Link = "a", className }: TreemapProps) {
  const box = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rects = layoutTreemap(items, ratio);
  const byId = new Map(items.map((i) => [i.id, i]));

  return (
    <div
      ref={box}
      role="group"
      aria-label={label}
      className={cn("relative w-full", className)}
      style={{ aspectRatio: `${ratio} / 1` }}
    >
      {rects.map((r) => {
        const it = byId.get(r.id)!;
        const pxW = (r.w / 100) * width;
        const pxH = (r.h / 100) * (width / ratio);
        const showName = pxW >= 90 && pxH >= 34;
        const showDetail = pxW >= 150 && pxH >= 80 && it.detail;
        const title = it.detail ? `${it.label} — ${it.detail}` : it.label;
        const inner = (
          <div
            className="flex h-full flex-col justify-between overflow-hidden rounded-md border p-2"
            style={{ background: tint(it.intensity) }}
          >
            {showName && <p className="text-xs font-medium leading-tight">{it.label}</p>}
            {showDetail && <p className="text-micro text-foreground">{it.detail}</p>}
          </div>
        );
        const pos = { left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` };
        return it.href ? (
          <Link
            key={r.id}
            href={it.href}
            title={title}
            aria-label={title}
            style={pos}
            className="absolute p-px outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
          >
            {inner}
          </Link>
        ) : (
          <div key={r.id} title={title} aria-label={title} role="img" style={pos} className="absolute p-px">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
