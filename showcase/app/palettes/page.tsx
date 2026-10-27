import { PalettePreview } from "../../components/palette-preview";

export const metadata = { title: "Palettes claires — proposition" };

/** Page de comparaison des trois propositions de thème clair (temporaire : supprimée après le choix). */
export default function Page() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <p className="max-w-2xl text-sm text-muted">
        Trois propositions de thème clair, sur la même mini-app. Seuls surfaces, textes, bordures, champs et
        bande d&apos;incertitude changent ; statuts et couleurs de données sont identiques.
      </p>
      <PalettePreview palette="a" title="A · thème clair d'origine (cartes blanches)" />
      <PalettePreview palette="b" title="B · neutre façon Paperclip / shadcn" />
      <PalettePreview palette="c" title="C · blanc chaud façon Notion" />
    </main>
  );
}
