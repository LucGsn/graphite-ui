import type { ReactNode } from "react";

/** Section de la vitrine : titre de section (14/600 majuscules, gris) + description + contenu. */
export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t py-10 first:border-t-0">
      <h2 className="text-sm font-semibold uppercase tracking-[0.35px] text-muted">{title}</h2>
      {description && <p className="mt-1 max-w-2xl text-xs text-faint">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Cadre d'une variante : libellé en monospace gris au-dessus de l'exemple. */
export function Variant({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mono mb-2 text-xs text-faint">{name}</p>
      {children}
    </div>
  );
}
