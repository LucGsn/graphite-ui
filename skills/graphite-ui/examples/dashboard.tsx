"use client";

// Exemple « tableau de bord » : chiffres clés, courbe avec bande d'incertitude, classement, carte proportionnelle.
import { useState } from "react";
import { BookOpen, SlidersHorizontal } from "lucide-react";
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

const evolution = [
  { mois: "Août", pro: 36, proBas: 31, proHaut: 41, solo: 27 },
  { mois: "Sept.", pro: 41, proBas: 36, proHaut: 46, solo: 29 },
  { mois: "Oct.", pro: 44, proBas: 39, proHaut: 49, solo: 31 },
];

export default function Dashboard() {
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
      <FilterSelect
        label="Période"
        value={period}
        onValueChange={setPeriod}
        options={[
          { value: "6m", label: "6 mois" },
          { value: "12m", label: "12 mois" },
        ]}
      />
      <KpiGrid>
        <KpiStat
          label="Taux d'activation"
          value="44"
          unit="%"
          caption="vs 41 le mois dernier"
          info="Part des comptes créés qui ont réalisé une première action dans les 7 jours."
          badge={<Badge tone="success">Solide</Badge>}
        />
        <KpiStat label="Comptes actifs" value="12 480" caption="base : 31 200" />
        <KpiStat label="Délai médian" value="3,2" unit="j" badge={<Badge tone="warning">Indicatif</Badge>} />
        <KpiStat
          label="Incidents"
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
          footnote={mode === "expert" ? "Bande : intervalle de confiance à 90 %." : undefined}
        >
          <LineChart
            hideLegend
            label="Taux d'activation par mois"
            xKey="mois"
            unit="%"
            data={evolution}
            series={[
              { key: "pro", label: "Offre Pro", color: "green", band: { lower: "proBas", upper: "proHaut" } },
              { key: "solo", label: "Offre Solo", color: "slate" },
            ]}
          />
        </ChartCard>
        <ChartCard
          title="Origine du trafic"
          actions={<InfoTooltip text="Répartition des visites par canal d'acquisition." />}
        >
          <BarChart
            label="Origine du trafic"
            unit="%"
            data={[
              { label: "Recherche", value: 48, color: "green" },
              { label: "Direct", value: 31, color: "slate" },
              { label: "Réseaux", value: 14, color: "amber" },
            ]}
          />
        </ChartCard>
      </div>
      <GroupDivider>Opportunités</GroupDivider>
      <SectionTitle>Demande et couverture</SectionTitle>
      <Treemap
        label="Demande et couverture par thème"
        items={[
          {
            id: "a",
            label: "Produits",
            value: 420,
            intensity: 0.15,
            detail: "420 recherches · 15 % couvert",
          },
          { id: "b", label: "Tarifs", value: 260, intensity: 0.7, detail: "260 recherches · 70 % couvert" },
          { id: "c", label: "Aide", value: 120, intensity: 0.9, detail: "120 recherches · 90 % couvert" },
        ]}
      />
    </>
  );
}
