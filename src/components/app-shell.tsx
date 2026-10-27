"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";
import { cn } from "../lib/cn";
import { IconButton } from "./icon-button";

export interface AppShellProps {
  /** Typiquement un `<Sidebar />`. */
  sidebar: React.ReactNode;
  /** Titre affiché dans la barre mobile (< 768 px). */
  mobileTitle?: React.ReactNode;
  menuLabel?: string;
  closeLabel?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Coque d'app : barre latérale fixe de 240 px dès 768 px ; en dessous, une barre de 52 px ouvre la
 * navigation en panneau (Échap ou clic hors du panneau referme).
 */
export function AppShell({
  sidebar,
  mobileTitle,
  menuLabel = "Ouvrir le menu",
  closeLabel = "Fermer le menu",
  children,
  className,
}: AppShellProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      className={cn("min-h-screen bg-background text-foreground md:grid md:grid-cols-[240px_1fr]", className)}
    >
      <aside className="sticky top-0 hidden h-screen border-r md:block">{sidebar}</aside>

      <div className="sticky top-0 z-30 flex h-[52px] items-center gap-2 border-b bg-background px-3 md:hidden">
        <IconButton label={menuLabel} onClick={() => setOpen(true)} aria-expanded={open}>
          <Menu />
        </IconButton>
        <span className="truncate text-sm font-semibold uppercase tracking-[0.7px]">{mobileTitle}</span>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label={menuLabel}>
          <button
            type="button"
            aria-label={closeLabel}
            className="absolute inset-0 cursor-default bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[260px] max-w-[85vw] border-r shadow-2xl shadow-black/40">
            {sidebar}
            <IconButton label={closeLabel} className="absolute top-3 right-3" onClick={() => setOpen(false)}>
              <X />
            </IconButton>
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 pb-16 sm:px-6">{children}</main>
    </div>
  );
}
