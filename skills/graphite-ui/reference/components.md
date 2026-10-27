# Référence des composants

Tous s'importent de `"graphite-ui"`. Les composants marqués (client) utilisent des hooks : ils fonctionnent dans une page serveur Next.js tant qu'on ne leur passe pas de fonction (voir « Frontière serveur/client »).

## Base

| Composant              | Props principales                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `Button`               | `variant` `default`\|`primary`\|`ghost` · `size` `md`\|`sm` · props de `<button>`  |
| `IconButton`           | `label` (obligatoire) · `variant` (défaut `ghost`)                                 |
| `Badge`                | `tone` `success`\|`warning`\|`danger`\|`neutral` · `dot` (défaut `true`)           |
| `StatusDot`            | `tone`                                                                             |
| `Card`, `CardHeader`   | `CardHeader` : `title` · `subtitle` · `actions`                                    |
| `KpiStat`              | `label` · `value` · `unit` · `caption` · `badge` · `info` · `icon` · `placeholder` |
| `KpiGrid`              | 4 colonnes dès 1024 px, 2 dès 640 px                                               |
| `InfoTooltip` (client) | `text` · `label` · `icon` · `align` `start`\|`end`                                 |

## Coque et navigation

| Composant                      | Props principales                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `AppShell` (client)            | `sidebar` · `mobileTitle` · `menuLabel` · `closeLabel`                                                                  |
| `Sidebar`                      | `brand` · `sections: {title?, items: {label, href, icon?, active?}[]}[]` · `footer` · `linkComponent` (ex. `next/link`) |
| `PageHeader`                   | `title` · `description` · `actions`                                                                                     |
| `SectionTitle`, `GroupDivider` | texte en enfants                                                                                                        |
| `Tabs` (client)                | `items: {value,label}[]` · `value` · `onValueChange` · `label` · `idPrefix`                                             |

## Contrôles

| Composant               | Props principales                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `ToggleGroup` (client)  | `options: {value,label,icon?}[]` · `label` · `type` `single`\|`multiple` · `value` · `onValueChange` |
| `ModeSwitch` (client)   | `modes: [opt, opt]` · `value` · `onValueChange` · `label`                                            |
| `FilterSelect` (client) | `label` · `options: {value,label}[]` · `value` · `onValueChange`                                     |

## Données

| Composant            | Props principales                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `List`, `ListRow`    | `ListRow` : `initials` · `tone` · `title` · `detail` · `meta`                                                            |
| `DataTable` (client) | `columns: {key, header, cell?, sortValue?, numeric?, align?}[]` · `rows` · `rowKey` · `caption` · `empty` · `onRowClick` |
| `Drawer` (client)    | `open` · `onClose` · `title` · `description` · `closeLabel`                                                              |
| `EmptyState`         | `icon` · `title` · `description` · `action`                                                                              |

## Graphiques (Recharts)

| Composant            | Props principales                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `ChartCard`          | `title` · `subtitle` · `actions` · `legend: {label,color}[]` · `footnote`                                                                    |
| `BarChart` (client)  | `data: {label,value,color?}[]` · `orientation` `horizontal`\|`vertical` · `unit` · `formatValue` · `height` · `label`                        |
| `LineChart` (client) | `data` · `xKey` · `series: {key,label,color,band?:{lower,upper}}[]` · `unit` · `formatValue` · `yDomain` · `hideLegend` · `height` · `label` |
| `Treemap` (client)   | `items: {id,label,value,intensity,detail?,href?}[]` · `ratio` · `label` · `linkComponent`                                                    |

`color` : `green` \| `amber` \| `slate` \| `gray` \| `red` \| `foreground` (les tokens `--chart-*`).

## Frontière serveur/client

Une page serveur ne peut pas passer une **fonction** à un composant client. Pour les graphiques, utiliser `unit="%"` (sérialisable) plutôt que `formatValue`. Pour `DataTable`, `columns` contient des fonctions (`cell`, `sortValue`) : placer le tableau dans un composant `"use client"`. `onClick`, `onValueChange` et `onClose` appartiennent aussi à un composant client.

## Dépannage

- **Aucun style / classes sans effet** : `@source "../node_modules/graphite-ui/src";` manque dans le CSS, ou son chemin relatif est faux.
- **Erreur « Unexpected token » sur du TypeScript** : `transpilePackages: ["graphite-ui"]` manque dans `next.config`.
- **Graphiques vides en test (jsdom)** : définir un `ResizeObserver` factice.
- **Mauvais paquet installé** : vérifier que `package.json` référence `github:LucGsn/graphite-ui#vX.Y.Z` et non `"graphite-ui": "^…"` (autre paquet sur le registre npm).
