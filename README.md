# graphite-ui

Design system neutre, inspiré de Paperclip : gris purs, couleur réservée aux statuts et aux données, peu de texte, gros chiffres, explications au survol.

**État : étape 1** — tokens (JSON → CSS, thèmes sombre / clair / marque) et 5 composants : `Button`, `Badge` (+ `StatusDot`), `Card`, `KpiStat`, `InfoTooltip`. Le reste (AppShell, graphiques, DataTable…), `DESIGN.md`, le skill et le guide d'installation suivent après validation.

## Développer

```bash
npm install
npm run dev      # vitrine sur http://localhost:3010
npm test         # rendu des composants, contraste ≥ 4,5:1, aucune couleur en dur
npm run lint && npm run typecheck && npm run build
npm run shots    # captures sombre/clair × 1440/375 dans docs/captures (après build)
```

## Tokens

Source unique : `tokens/tokens.json`. `npm run tokens` génère `src/styles/tokens.css` et `src/styles/themes/*.css` (un test échoue si les fichiers générés sont périmés).
Thème par défaut : sombre. Clair : `<html data-theme="light">`. Marque : `<html data-brand="omnes">` (exemple ; une marque ne change que quelques tokens).
