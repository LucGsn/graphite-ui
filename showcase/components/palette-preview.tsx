"use client";

import { Gauge, LayoutDashboard, List as ListIcon, Plus, Users } from "lucide-react";
import {
  Badge,
  Button,
  ChartCard,
  DataTable,
  KpiGrid,
  KpiStat,
  LineChart,
  ModeSwitch,
  Sidebar,
  Treemap,
  type Column,
} from "graphite-ui";
import { ACCOUNTS, LINE_DATA, TREEMAP_ITEMS, type Account } from "./demo-data";

const columns: Column<Account>[] = [
  { key: "name", header: "Compte", sortValue: (r) => r.name },
  { key: "plan", header: "Offre" },
  { key: "users", header: "Utilisateurs", numeric: true },
  {
    key: "status",
    header: "Statut",
    cell: (r) => (
      <Badge tone={r.status === "ok" ? "success" : r.status === "late" ? "warning" : "neutral"}>
        {r.status === "ok" ? "Actif" : r.status === "late" ? "En retard" : "Inactif"}
      </Badge>
    ),
  },
];

/** Aperçu d'une palette claire : mini-app complète, thème et palette posés sur le conteneur. */
export function PalettePreview({ palette, title }: { palette: string; title: string }) {
  return (
    <section aria-label={title} className="min-w-0">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.35px]">{title}</h2>
      <div
        data-theme="light"
        data-palette={palette}
        className="overflow-hidden rounded-lg border bg-background text-foreground md:grid md:grid-cols-[200px_1fr]"
      >
        <aside className="hidden border-r md:block">
          <Sidebar
            brand={<span className="text-sm font-semibold tracking-[0.7px]">GRAPHITE</span>}
            sections={[
              {
                title: "Où en est-on ?",
                items: [
                  { label: "Tableau de bord", href: "#", icon: <LayoutDashboard />, active: true },
                  { label: "Liste", href: "#", icon: <ListIcon /> },
                ],
              },
            ]}
          />
        </aside>
        <div className="min-w-0 px-4 pb-6 sm:px-6">
          <header className="-mx-4 mb-4 flex h-[60px] items-center justify-between gap-3 border-b px-4 sm:-mx-6 sm:px-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.7px]">Vue globale</h3>
            <div className="flex items-center gap-2">
              <ModeSwitch
                value="lecture"
                onValueChange={() => {}}
                modes={[
                  { value: "lecture", label: "Lecture" },
                  { value: "expert", label: "Expert" },
                ]}
              />
              <Button variant="primary">
                <Plus /> Ajouter
              </Button>
            </div>
          </header>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button>Par défaut</Button>
            <Button variant="ghost">Ghost</Button>
            <Badge tone="success">Solide</Badge>
            <Badge tone="warning">Indicatif</Badge>
            <Badge tone="danger">À traiter</Badge>
            <Badge tone="neutral">Fragile</Badge>
          </div>
          <KpiGrid className="my-4">
            <KpiStat
              label="Taux d'activation"
              value="44"
              unit="%"
              caption="vs 41 le mois dernier"
              icon={<Gauge className="size-3.5" />}
              info="Explication au survol."
            />
            <KpiStat
              label="Comptes actifs"
              value="12 480"
              caption="base : 31 200"
              icon={<Users className="size-3.5" />}
            />
            <KpiStat
              label="Délai médian"
              value="3,2"
              unit="j"
              badge={<Badge tone="warning">Indicatif</Badge>}
            />
            <KpiStat label="Incidents" value="2" badge={<Badge tone="danger">À traiter</Badge>} />
          </KpiGrid>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Évolution"
              subtitle="Bande = incertitude"
              legend={[
                { label: "Offre Pro", color: "green" },
                { label: "Offre Solo", color: "slate" },
                { label: "Autre", color: "amber" },
              ]}
            >
              <LineChart
                hideLegend
                height={200}
                label={`Évolution (${title})`}
                xKey="mois"
                unit="%"
                data={LINE_DATA.map((r) => ({ ...r, c: r.b - 8 }))}
                series={[
                  { key: "a", label: "Offre Pro", color: "green", band: { lower: "aLo", upper: "aHi" } },
                  { key: "b", label: "Offre Solo", color: "slate" },
                  { key: "c", label: "Autre", color: "amber" },
                ]}
              />
            </ChartCard>
            <ChartCard title="Demande et couverture" subtitle="Une seule teinte">
              <Treemap label={`Treemap (${title})`} items={TREEMAP_ITEMS} ratio={1.6} />
            </ChartCard>
          </div>
          <div className="mt-4">
            <DataTable
              caption={`Comptes (${title})`}
              columns={columns}
              rows={ACCOUNTS.slice(0, 4)}
              rowKey={(r) => r.id}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
