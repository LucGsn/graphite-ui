"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart3, LayoutDashboard, List as ListIcon, Package } from "lucide-react";
import { AppShell, Sidebar } from "graphite-ui";
import { ThemeSwitcher } from "./theme-switcher";

/** Coque des pages d'exemple : sidebar à trois entrées, bascule de thème en pied de barre. */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const item = (label: string, href: string, icon: React.ReactNode) => ({
    label,
    href,
    icon,
    active: path === href,
  });
  return (
    <AppShell
      mobileTitle="Exemple"
      sidebar={
        <Sidebar
          linkComponent={Link}
          brand={<span className="text-sm font-semibold tracking-[0.7px]">GRAPHITE</span>}
          sections={[
            {
              title: "Où en est-on ?",
              items: [
                item("Tableau de bord", "/exemples/tableau-de-bord", <LayoutDashboard />),
                item("Comparaison", "/exemples/tableau-de-bord#comparaison", <BarChart3 />),
              ],
            },
            {
              title: "Données",
              items: [
                item("Liste", "/exemples/liste", <ListIcon />),
                item("Détail", "/exemples/detail", <Package />),
              ],
            },
          ]}
          footer={<ThemeSwitcher />}
        />
      }
    >
      {children}
    </AppShell>
  );
}
