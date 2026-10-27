import * as React from "react";
import { cn } from "../lib/cn";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
}

export interface SidebarSection {
  /** Titre de groupe (10 px majuscules). Omis : liste sans titre. */
  title?: string;
  items: SidebarItem[];
}

export interface SidebarProps {
  /** Logo ou nom de l'app, en haut. */
  brand?: React.ReactNode;
  sections: SidebarSection[];
  /** Pied de barre (compte, version…). */
  footer?: React.ReactNode;
  /** Composant de lien (ex. `next/link`). Par défaut, `<a>`. */
  linkComponent?: React.ElementType;
  className?: string;
}

/**
 * Barre latérale : fond « sidebar », entrées de 32 px, entrée active sur fond « accent ». Les groupes
 * répondent à une question (« Où en est-on ? »), pas à une catégorie technique.
 */
export function Sidebar({ brand, sections, footer, linkComponent: Link = "a", className }: SidebarProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-sidebar", className)}>
      {brand && <div className="flex h-[60px] shrink-0 items-center border-b px-4">{brand}</div>}
      <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto py-2">
        {sections.map((s, i) => (
          <div key={s.title ?? i}>
            {s.title && (
              <p className="px-4 pt-3 pb-1 text-micro font-medium uppercase tracking-[1px] text-faint-side">
                {s.title}
              </p>
            )}
            <ul className="flex flex-col">
              {s.items.map((it) => (
                <li key={it.href + it.label}>
                  <Link
                    href={it.href}
                    aria-current={it.active ? "page" : undefined}
                    className={cn(
                      "mx-2 my-[3px] flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 [&_svg]:size-4 [&_svg]:shrink-0",
                      it.active
                        ? "bg-accent text-foreground"
                        : "text-foreground/80 hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    {it.icon}
                    <span className="flex-1 truncate">{it.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {footer && <div className="shrink-0 border-t p-3 text-xs text-muted">{footer}</div>}
    </div>
  );
}
