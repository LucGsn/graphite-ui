# DESIGN.md — principes du design graphite-ui

Ce document dit **comment** utiliser le design system. Les valeurs vivent dans `tokens/tokens.json`, les composants dans `src/components/`, tout est visible dans la vitrine (`npm run dev`).

## 1. Principes

1. **Gris neutres purs.** Surfaces et textes sont des gris à chroma 0. Aucune teinte bleue ou violette « de marque » dans l'interface.
2. **La couleur est réservée aux statuts et aux données.** Vert / ambre / rouge disent un état ; les teintes `--chart-*` distinguent des séries. Un bouton, un titre, un fond de carte ne sont jamais colorés.
3. **Peu de texte.** Un titre de page, un libellé de 2 à 4 mots, une légende d'une ligne. Pas de paragraphe d'explication sur l'écran.
4. **Gros chiffres.** Le chiffre clé est le héros : 30 px, graisse 600, interlettrage −0,75 px, chiffres tabulaires.
5. **Les explications sont au survol.** Méthode, intervalle, effectifs, définitions : dans un `InfoTooltip` (survol, clic, toucher, clavier). Rien d'essentiel n'est réservé à la souris.
6. **La couleur ne porte jamais seule le sens.** Un statut = un point coloré **et** un mot. Une série = une pastille **et** un libellé en légende.
7. **Sombre d'abord.** Le thème sombre est la référence ; le clair en est dérivé.
8. **Cadres légers.** Bordure blanc 10 %, fond transparent, pas d'ombre sur les cartes. L'ombre n'existe que sur ce qui flotte (infobulle, tiroir, menu).

## 2. Tokens

| Rôle             | Token                                                           | Sombre                   | Usage                                                      |
| ---------------- | --------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------- |
| Fond de page     | `--background`                                                  | `oklch(20.5% 0 0)`       | page, infobulles, tiroir                                   |
| Barre latérale   | `--sidebar`                                                     | `oklch(26.9% 0 0)`       | `Sidebar`                                                  |
| Entrée active    | `--accent`                                                      | `oklch(32% 0 0)`         | menu actif, bouton de bascule actif                        |
| Texte            | `--foreground`                                                  | `oklch(98.5% 0 0)`       | texte principal                                            |
| Texte secondaire | `--muted`                                                       | `oklch(70.8% 0 0)`       | libellés, titres de carte                                  |
| Gris atténués    | `--faint`, `--faint-60`, `--faint-side`                         | muted à 78–86 %          | légendes, sous-titres (≥ 4,5:1 testé)                      |
| Bordure          | `--border`                                                      | blanc 10 %               | cadres, filets                                             |
| Champ            | `--input` / `--field`                                           | blanc 15 % / 4,5 %       | bordure et fond des boutons et champs                      |
| Action           | `--primary`                                                     | `oklch(92.2% 0 0)`       | seul bouton plein                                          |
| Statuts          | `--success` `--warning` `--danger` `--neutral`                  | vert, ambre, rouge, gris | **points** de statut uniquement                            |
| Séries           | `--chart-green` `-amber` `-slate` `-gray` `-red` `--chart-band` | —                        | graphiques ; la bande d'incertitude est un gris très léger |
| Arrondi          | `--radius`                                                      | `0.5rem`                 | cartes ; boutons et champs `--radius-md` (6 px)            |

**Typographie** : Inter (repli `ui-sans-serif`), `ui-monospace` pour les identifiants et dates.

| Rôle                | Classe                                                | Style                                    |
| ------------------- | ----------------------------------------------------- | ---------------------------------------- |
| Grand chiffre       | `text-stat`                                           | 30 / 600 / −0,75 px                      |
| Titre de page       | —                                                     | 14 / 600, MAJUSCULES, +0,7 px            |
| Titre de section    | —                                                     | 14 / 600, MAJUSCULES, +0,35 px, **gris** |
| Libellé             | `text-sm font-medium text-muted`                      | 14 / 500 gris                            |
| Sous-libellé        | `text-xs text-faint`                                  | 12 / 400 atténué                         |
| Titre de carte      | `text-xs font-medium text-muted`                      | 12 / 500                                 |
| Sous-titre de carte | `text-[10px] text-faint-60`                           | 10                                       |
| Groupe de menu      | `text-micro uppercase tracking-[1px] text-faint-side` | 10                                       |
| Méta                | `mono text-xs text-muted`                             | 12 monospace                             |

Aucun texte sous 10 px (testé).

**Thème clair** (`data-theme="light"`) : mêmes rôles, luminances inversées, chroma 0. Fond `98,5 %`, texte `20,5 %`, gris secondaire relevé à `44 %` pour tenir 4,5:1 sur fond clair. Statuts et séries assombris (`#16a34a`, `#d97706`…) pour rester lisibles. Le test de contraste couvre les 4 thèmes.

**Thème de marque** : voir [docs/THEMING.md](docs/THEMING.md). Une marque ne change que quelques tokens (primaire, séries) ; elle ne touche jamais aux surfaces.

## 3. Règles d'usage

| Composant                    | Règle                                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `Button`                     | Un seul `primary` par écran. Les autres : `default`. `ghost` pour les actions tertiaires. Verbe à l'infinitif (« Ajouter »). |
| `IconButton`                 | `label` obligatoire. Jamais d'icône seule sans libellé accessible.                                                           |
| `Badge`                      | Un mot. Le badge reste gris, la couleur est dans le point. Pas de badge décoratif.                                           |
| `StatusDot`                  | Toujours accompagné d'un texte.                                                                                              |
| `Card`                       | Cadre fin, pas de fond ni d'ombre. Ne pas imbriquer des cartes.                                                              |
| `KpiStat`                    | Pas de cadre. 4 de front au plus (`KpiGrid`). Une légende d'une ligne ; l'explication dans `info`.                           |
| `InfoTooltip`                | Une à trois phrases. Jamais pour une information indispensable à la décision.                                                |
| `AppShell` + `Sidebar`       | Groupes de navigation formulés comme des questions (« Où en est-on ? », « Pourquoi ? »). 4 groupes au plus.                  |
| `PageHeader`                 | Titre seul à gauche, actions à droite (bascule de mode, un bouton).                                                          |
| `Tabs`                       | Pour des vues d'un même objet. Pour changer de page, utiliser la navigation.                                                 |
| `ToggleGroup` / `ModeSwitch` | `ModeSwitch` : deux modes, **Lecture** (essentiel) et **Expert** (détail). L'état vit dans l'URL.                            |
| `FilterSelect`               | Libellé court (« Période »). Les filtres suivent l'utilisateur d'une page à l'autre via l'URL.                               |
| `DataTable`                  | Légende obligatoire (`caption`). Colonnes numériques `numeric`. Ligne cliquable → `Drawer`.                                  |
| `Drawer`                     | Détail d'une ligne, sans quitter la liste. Un seul niveau.                                                                   |
| `ListRow`                    | Pastille à initiales, titre, détail gris, méta à droite.                                                                     |
| `EmptyState`                 | Une phrase, une action au plus. Pas d'illustration.                                                                          |
| `BarChart`                   | Classements : barres horizontales avec valeurs écrites.                                                                      |
| `LineChart`                  | Évolutions. Bande d'incertitude seulement si la mesure est incertaine, et alors la dire dans `info` ou la note de méthode.   |
| `Treemap`                    | Deux grandeurs : surface et intensité. Sert à repérer des opportunités.                                                      |
| `ChartCard`                  | Légende écrite en tête, note de méthode en pied (12 px gris).                                                                |

**Graphiques** : une couleur est fixée **par série** (jamais par rang) : filtrer ne repeint pas les séries restantes. Les valeurs sont écrites, jamais seulement lues à la couleur. Chaque graphique a une `label` et un tableau masqué pour les lecteurs d'écran.

**Formats** : en français, virgule décimale, espace insécable avant `%` ; dans un composant serveur, passer `unit="%"` aux graphiques (une fonction ne traverse pas la frontière serveur/client).

## 4. À faire / à ne pas faire

| ✅ À faire                                                   | ❌ À ne pas faire                                         |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| Un grand chiffre, un libellé, une légende                    | Une carte pleine de texte autour du chiffre               |
| Statut = point coloré + mot                                  | Fond vert ou rouge sur toute une ligne ou un badge        |
| Explication dans `InfoTooltip`                               | Paragraphe de méthode sous chaque graphique               |
| Gris via les tokens (`text-muted`, `bg-field`)               | Valeur en dur (`#888`) ou classe brute (`text-slate-500`) |
| Couleur de série fixée par série                             | Palette qui change quand on filtre                        |
| Un seul `Button variant="primary"`                           | Plusieurs boutons pleins en concurrence                   |
| Thème de marque : 2 à 6 tokens                               | Redéfinir les surfaces, ajouter un bleu « de marque »     |
| Mode Lecture par défaut, Expert sur demande                  | Tout afficher en permanence                               |
| `label` sur chaque graphique et `IconButton`                 | Icône seule sans nom accessible                           |
| Contrôler le contraste (`npm test`) quand on touche un token | Éclaircir un gris « pour que ça respire »                 |

Ces règles sont vérifiées par les tests : aucune couleur en dur ni classe Tailwind de couleur brute dans `src/` et `showcase/`, aucun texte sous 10 px, contraste ≥ 4,5:1 sur 13 paires dans chaque thème.

## 5. Exemples de pages

Les trois pages existent en vrai dans la vitrine (`/exemples/…`) et en code dans `skills/graphite-ui/examples/`.

### Tableau de bord

```
┌ Sidebar ┬ PageHeader : VUE GLOBALE ………………………… [Lecture|Expert] ┐
│ groupes │ FilterSelect  FilterSelect                                   │
│ de      │ KpiGrid : 4 × KpiStat (chiffre, libellé, légende, badge)      │
│ questions│ ChartCard (LineChart + bande)      │ ChartCard (BarChart)    │
│         │ ── GroupDivider « Opportunités » ──                          │
│         │ SectionTitle + Treemap                                        │
└─────────┴──────────────────────────────────────────────────────────────┘
```

Lecture : chiffres, courbes, classement. Expert : notes de méthode, intervalles, effectifs.

### Liste

```
PageHeader : COMPTES ………………………… [Button primary « Ajouter »]
Tabs (Comptes | Activité)
FilterSelect
DataTable (tri sur colonnes, ligne cliquable) ──► Drawer (détail)
(vide → EmptyState)
```

### Détail

```
PageHeader : NOM ………… [Button « Exporter »] + ligne de description
Badges de statut
KpiGrid (3 × KpiStat)
Card (BarChart)  │  Card (informations clé / valeur)
── GroupDivider « Historique » ──
List de ListRow
```

## 6. Accessibilité

Navigation entière au clavier ; focus visible (anneau 2 px) ; `aria-current="page"` sur la page courante ; onglets avec flèches ; tiroir modal avec focus piégé puis restitué ; tableaux légendés avec `aria-sort` ; graphiques : `figure` étiqueté + tableau masqué ; infobulles reliées par `aria-describedby`.
