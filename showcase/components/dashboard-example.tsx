"use client";

import { useState } from "react";
import { BookOpen, Gauge, SlidersHorizontal, Users } from "lucide-react";
import {
  Badge,
  BarChart,
  ChartCard,
  FilterSelect,
  GroupDivider,
  InfoTooltip,
  KpiGrid,
  KpiStat,
  LineChart,
  ModeSwitch,
  PageHeader,
  SectionTitle,
  Treemap,
} from "graphite-ui";
import { BAR_DATA, LINE_DATA, TREEMAP_ITEMS } from "./demo-data";

/** Exemple de page « tableau de bord » : chiffres clés, courbe, classement, carte proportionnelle. */
export function DashboardExample() {
  const [mode, setMode] = useState("lecture");
  const [period, setPeriod] = useState("6m");
  return (
    <>
      <PageHeader
        title="Vue globale"
        actions={
          <ModeSwitch
            value={mode}
            onValueChange={setMode}
            modes={[
              { value: "lecture", label: "Lecture", icon: <BookOpen /> },
              { value: "expert", label: "Expert", icon: <SlidersHorizontal /> },
            ]}
          />
        }
      />
      <div className="mb-2 flex flex-wrap gap-2">
        <FilterSelect
          label="Période"
          value={period}
          onValueChange={setPeriod}
          options={[
            { value: "6m", label: "6 mois" },
            { value: "12m", label: "12 mois" },
          ]}
        />
        <FilterSelect
          label="Segment"
          value="all"
          onValueChange={() => {}}
          options={[
            { value: "all", label: "Tous" },
            { value: "pro", label: "Pro" },
          ]}
        />
      </div>

      <KpiGrid>
        <KpiStat
          label="Taux d'activation"
          value="44"
          unit="%"
          caption="vs 41 le mois dernier"
          icon={<Gauge className="size-3.5" strokeWidth={1.75} />}
          info="Part des comptes créés qui ont réalisé une première action dans les 7 jours."
          badge={<Badge tone="success">Solide</Badge>}
        />
        <KpiStat
          label="Comptes actifs"
          value="12 480"
          caption="base : 31 200"
          icon={<Users className="size-3.5" strokeWidth={1.75} />}
          info="Comptes avec au moins une session sur les 7 derniers jours."
        />
        <KpiStat
          label="Délai médian"
          value="3,2"
          unit="j"
          caption="indicatif"
          badge={<Badge tone="warning">Indicatif</Badge>}
        />
        <KpiStat
          label="Incidents ouverts"
          value="2"
          caption="dont 1 critique"
          badge={<Badge tone="danger">À traiter</Badge>}
        />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Évolution du taux d'activation"
          subtitle="6 derniers mois"
          legend={[
            { label: "Offre Pro", color: "green" },
            { label: "Offre Solo", color: "slate" },
          ]}
          footnote={
            mode === "expert"
              ? "Bande : intervalle de confiance à 90 %. Méthode v1, base 31 200 comptes."
              : undefined
          }
        >
          <LineChart
            hideLegend
            label="Taux d'activation par mois"
            xKey="mois"
            data={LINE_DATA}
            unit="%"
            series={[
              { key: "a", label: "Offre Pro", color: "green", band: { lower: "aLo", upper: "aHi" } },
              { key: "b", label: "Offre Solo", color: "slate" },
            ]}
          />
        </ChartCard>
        <ChartCard
          title="Origine du trafic"
          subtitle="Part des visites"
          actions={<InfoTooltip text="Répartition des visites par canal d'acquisition sur la période." />}
        >
          <BarChart label="Origine du trafic" data={BAR_DATA} unit="%" />
        </ChartCard>
      </div>

      <GroupDivider>Opportunités</GroupDivider>
      <section id="comparaison">
        <SectionTitle>Demande et couverture</SectionTitle>
        <p className="mb-3 max-w-2xl text-xs text-faint">
          Surface = volume de recherches. Intensité = part déjà couverte. Un grand bloc pâle est une
          opportunité.
        </p>
        <Treemap label="Demande et couverture par thème" items={TREEMAP_ITEMS} />
      </section>
    </>
  );
}
