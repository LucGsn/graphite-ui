# Thèmes : sombre, clair et marque

## Mécanique

- **Thème** : attribut `data-theme` sur `<html>` — `dark` (défaut, référence) ou `light`.
- **Marque** : attribut `data-brand` sur `<html>` — absent = neutre ; `omnes` = thème de la charte « Business Review » (violet nuit `#120432`, bleu électrique `#0014D0`, vert menthe `#3BC2A2`, police Arial ; Inter reste la police par défaut du cœur).
- Les deux se combinent : `<html data-theme="light" data-brand="omnes">`.
- Les tokens sont des variables CSS ; Tailwind v4 les expose en classes (`bg-card`, `text-muted`…) via `src/styles/theme.css`.

## Créer le thème d'un nouveau projet

Une marque **ne change que quelques tokens** (≤ 6 par mode) : le primaire et, si besoin, 1 à 3 séries. Jamais les surfaces ni les gris de texte : le cœur reste neutre.

### Dans ce dépôt

1. Dans `tokens/tokens.json`, ajouter un bloc sous `brands` :

   ```json
   "monprojet": {
     "dark":  { "primary": "oklch(78% 0.13 160)", "primary-foreground": "oklch(20.5% 0 0)", "chart-green": "#2dd4bf" },
     "light": { "primary": "oklch(40% 0.12 160)", "primary-foreground": "oklch(98.5% 0 0)", "chart-green": "#0f766e" }
   }
   ```

2. `npm run tokens` — génère `src/styles/themes/monprojet.css`.
3. `npm test` — vérifie le contraste (≥ 4,5:1) des 13 paires de texte dans chaque combinaison, et que la marque ne dépasse pas 6 tokens.
4. Poser `data-brand="monprojet"` sur `<html>`.

Une marque peut aussi poser des variables indépendantes du mode (ex. la police) dans un bloc `static` : `"static": { "font-sans-stack": "Arial, sans-serif" }`.

### Dans une app qui consomme le paquet (sans toucher à ce dépôt)

Créer un fichier CSS dans l'app, importé après `graphite-ui/styles.css` :

```css
[data-brand="monprojet"] {
  --primary: oklch(78% 0.13 160);
  --primary-foreground: oklch(20.5% 0 0);
  --chart-green: #2dd4bf;
}
[data-brand="monprojet"][data-theme="light"] {
  --primary: oklch(40% 0.12 160);
  --primary-foreground: oklch(98.5% 0 0);
  --chart-green: #0f766e;
}
```

Vérifier le contraste de `--primary-foreground` sur `--primary` (≥ 4,5:1, par exemple avec la fonction `contrast` de `src/__tests__/color.ts`).

## Dériver un thème clair

Le thème clair est dérivé du sombre, rôle par rôle :

| Rôle                      | Règle de dérivation                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Fond, carte               | luminance 98,5 % (le texte sombre y tient largement)                                                            |
| Barre latérale, accent    | 96 % et 92 % (même écart relatif qu'en sombre)                                                                  |
| Texte                     | 20,5 % (l'ancien fond)                                                                                          |
| Gris secondaire (`muted`) | **44 %**, pas 29,2 % (l'inverse de 70,8 %) : le miroir exact ne tient pas 4,5:1 sur fond clair une fois mélangé |
| Gris atténués             | `muted` à 90–94 % d'opacité                                                                                     |
| Bordures, champs          | noir 10 % / 15 % / 4,5 % (l'inverse du blanc)                                                                   |
| Statuts, séries           | teintes assombries pour rester lisibles sur clair                                                               |

Toujours **mesurer** : `npm test` calcule le contraste réel (mélange alpha en sRGB, comme un navigateur).

## Ce que le thème de marque ne doit pas faire

- Colorer des surfaces, des bordures ou des textes courants.
- Remplacer les statuts (vert / ambre / rouge) : ils ont un sens universel.
- Introduire un deuxième accent. Un thème = un primaire.
