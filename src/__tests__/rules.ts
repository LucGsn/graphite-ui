// Règles de contraste du design system, appliquées à un jeu de tokens résolu (thème + marque).
//  - 4,5:1 pour TOUT texte, jetons de marque compris ;
//  - 3:1 pour les éléments graphiques non textuels (séries de graphique, points de statut, fond du bouton plein).
// Les bordures de cartes et de champs sont décoratives : le libellé identifie le contrôle (non couvertes).
import { treemapOpacity } from "../components/treemap";
import { contrast, withAlpha } from "./color";

export type Tokens = Record<string, string>;

/** Paires texte / fond (texte éventuellement translucide, fond éventuellement translucide posé sur `under`). */
export function textPairs(t: Tokens): { name: string; ratio: number }[] {
  const pairs: [string, string, string, string?][] = [
    // [nom, texte, fond, fond sous-jacent]
    ["foreground sur background", t.foreground, t.background],
    ["muted sur background", t.muted, t.background],
    ["faint sur background", t.faint, t.background],
    ["faint-60 sur background", t["faint-60"], t.background],
    ["foreground sur card", t.foreground, t.card],
    ["muted sur card", t.muted, t.card],
    ["faint sur card", t.faint, t.card],
    ["faint-60 sur card", t["faint-60"], t.card],
    ["foreground sur sidebar", t.foreground, t.sidebar],
    ["foreground/80 sur sidebar (menu inactif)", withAlpha(t.foreground, 0.8), t.sidebar],
    ["muted sur sidebar", t.muted, t.sidebar],
    ["faint-side sur sidebar", t["faint-side"], t.sidebar],
    ["foreground sur accent (menu actif)", t.foreground, t.accent],
    ["muted sur accent", t.muted, t.accent],
    ["primary-foreground sur primary (bouton plein)", t["primary-foreground"], t.primary],
    ["foreground sur field/background (bouton)", t.foreground, t.field, t.background],
    ["muted sur field/background", t.muted, t.field, t.background],
    ["foreground sur field/card", t.foreground, t.field, t.card],
    ["muted sur field/card", t.muted, t.field, t.card],
    ["foreground sur badge/background", t.foreground, withAlpha(t.muted, 0.22), t.background],
    ["foreground sur badge/card", t.foreground, withAlpha(t.muted, 0.22), t.card],
    ["foreground sur badge/sidebar", t.foreground, withAlpha(t.muted, 0.22), t.sidebar],
  ];
  return pairs.map(([name, fg, bg, under]) => ({ name, ratio: contrast(fg, bg, under) }));
}

/** Éléments graphiques : posés sur la page ET sur les cartes. */
export const GRAPHIC_TOKENS = [
  "primary",
  "success",
  "warning",
  "danger",
  "neutral",
  "chart-green",
  "chart-amber",
  "chart-slate",
  "chart-gray",
  "chart-red",
] as const;

export function graphicPairs(t: Tokens): { name: string; ratio: number }[] {
  return GRAPHIC_TOKENS.flatMap((k) =>
    (["background", "card"] as const).map((s) => ({ name: `${k} sur ${s}`, ratio: contrast(t[k], t[s]) })),
  );
}

/** Carte proportionnelle : une seule teinte (chart-green), opacité 5 % → 50 % selon l'intensité. */
export function treemapPairs(t: Tokens): { name: string; ratio: number }[] {
  const out: { name: string; ratio: number }[] = [];
  for (const i of [0, 0.25, 0.5, 0.75, 1]) {
    const alpha = treemapOpacity(i) / 100;
    const block = withAlpha(t["chart-green"], alpha);
    for (const s of ["background", "card"] as const) {
      out.push({
        name: `treemap ${i} : foreground sur bloc/${s}`,
        ratio: contrast(t.foreground, block, t[s]),
      });
    }
  }
  return out;
}

export const MIN_TEXT = 4.5;
export const MIN_GRAPHIC = 3;

/** Retourne la liste des paires qui ne tiennent pas leur seuil (vide = conforme). */
export function violations(t: Tokens): string[] {
  const bad = (rows: { name: string; ratio: number }[], min: number) =>
    rows.filter((r) => r.ratio < min).map((r) => `${r.name} = ${r.ratio.toFixed(2)} (< ${min})`);
  return [
    ...bad(textPairs(t), MIN_TEXT),
    ...bad(treemapPairs(t), MIN_TEXT),
    ...bad(graphicPairs(t), MIN_GRAPHIC),
  ];
}
