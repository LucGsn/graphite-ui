"use client";

import { useState } from "react";
import {
  BookOpen,
  Inbox,
  List as ListIcon,
  Plus,
  Settings,
  SlidersHorizontal,
  Trash2,
  LayoutGrid,
} from "lucide-react";
import {
  Badge,
  BarChart,
  Button,
  ChartCard,
  DataTable,
  Drawer,
  EmptyState,
  FilterSelect,
  GroupDivider,
  IconButton,
  InfoTooltip,
  LineChart,
  List,
  ListRow,
  ModeSwitch,
  PageHeader,
  SectionTitle,
  Tabs,
  ToggleGroup,
  Treemap,
  type Column,
} from "graphite-ui";
import { Section, Variant } from "./section";
import { ACCOUNTS, BAR_DATA, LINE_DATA, TREEMAP_ITEMS, type Account } from "./demo-data";

const columns: Column<Account>[] = [
  { key: "name", header: "Compte", sortValue: (r) => r.name },
  { key: "plan", header: "Offre", sortValue: (r) => r.plan },
  { key: "users", header: "Utilisateurs", numeric: true, sortValue: (r) => r.users },
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

export function MoreDemos() {
  const [tab, setTab] = useState("a");
  const [view, setView] = useState("grid");
  const [multi, setMulti] = useState(["web"]);
  const [mode, setMode] = useState("lecture");
  const [filter, setFilter] = useState("30");
  const [drawer, setDrawer] = useState(false);

  return (
    <>
      <Section
        id="app-shell"
        title="AppShell et Sidebar"
        description="Barre latérale de 240 px dès 768 px ; en dessous, une barre de 52 px ouvre la navigation en panneau. Voir les pages d'exemple pour la coque en situation."
      >
        <a href="/exemples/tableau-de-bord" className="text-sm underline underline-offset-4">
          Ouvrir l'exemple « tableau de bord »
        </a>
      </Section>

      <Section
        id="page-header"
        title="PageHeader, SectionTitle, GroupDivider"
        description="Titre seul à gauche (14/600 majuscules), actions à droite, filet bas."
      >
        <div className="space-y-2 rounded-lg border px-4">
          <PageHeader title="Vue globale" actions={<Button size="sm">Action</Button>} className="mb-0" />
          <div className="pb-4">
            <SectionTitle>Titre de section</SectionTitle>
            <GroupDivider>Groupe</GroupDivider>
          </div>
        </div>
      </Section>

      <Section id="tabs" title="Tabs" description="Flèches, Début et Fin déplacent la sélection.">
        <Tabs
          label="Démo"
          value={tab}
          onValueChange={setTab}
          items={[
            { value: "a", label: "Aperçu" },
            { value: "b", label: "Détails" },
            { value: "c", label: "Historique" },
          ]}
        />
      </Section>

      <Section id="buttons-groups" title="IconButton, ToggleGroup, ModeSwitch, FilterSelect">
        <div className="grid gap-6 sm:grid-cols-2">
          <Variant name="IconButton (ghost · default)">
            <div className="flex gap-2">
              <IconButton label="Réglages">
                <Settings />
              </IconButton>
              <IconButton label="Supprimer" variant="default">
                <Trash2 />
              </IconButton>
              <IconButton label="Ajouter" variant="primary">
                <Plus />
              </IconButton>
            </div>
          </Variant>
          <Variant name="ToggleGroup single">
            <ToggleGroup
              label="Vue"
              value={view}
              onValueChange={setView}
              options={[
                { value: "grid", label: "Grille", icon: <LayoutGrid /> },
                { value: "list", label: "Liste", icon: <ListIcon /> },
              ]}
            />
          </Variant>
          <Variant name="ToggleGroup multiple">
            <ToggleGroup
              type="multiple"
              label="Canaux"
              value={multi}
              onValueChange={setMulti}
              options={[
                { value: "web", label: "Web" },
                { value: "app", label: "App" },
                { value: "mail", label: "E-mail" },
              ]}
            />
          </Variant>
          <Variant name="ModeSwitch">
            <ModeSwitch
              value={mode}
              onValueChange={setMode}
              modes={[
                { value: "lecture", label: "Lecture", icon: <BookOpen /> },
                { value: "expert", label: "Expert", icon: <SlidersHorizontal /> },
              ]}
            />
          </Variant>
          <Variant name="FilterSelect">
            <FilterSelect
              label="Période"
              value={filter}
              onValueChange={setFilter}
              options={[
                { value: "30", label: "30 jours" },
                { value: "90", label: "90 jours" },
                { value: "365", label: "12 mois" },
              ]}
            />
          </Variant>
        </div>
      </Section>

      <Section id="list-row" title="ListRow">
        <List className="rounded-lg border">
          <ListRow
            initials="AN"
            tone="success"
            title="Atelier Nord a invité 4 utilisateurs"
            detail="Offre Pro"
            meta="il y a 2 h"
          />
          <ListRow
            initials="BP"
            tone="warning"
            title="Paiement en retard"
            detail="Relance envoyée"
            meta="il y a 1 j"
          />
          <ListRow initials="DP" title="Compte désactivé" meta="il y a 3 j" />
        </List>
      </Section>

      <Section
        id="data-table"
        title="DataTable"
        description="Tri au clic sur les colonnes triables ; ligne cliquable ouvre le tiroir."
      >
        <DataTable
          caption="Comptes"
          columns={columns}
          rows={ACCOUNTS}
          rowKey={(r) => r.id}
          onRowClick={() => setDrawer(true)}
        />
        <Drawer open={drawer} onClose={() => setDrawer(false)} title="Détail du compte" description="ac-101">
          <p className="text-sm text-muted">Contenu du tiroir : formulaire, détail, historique.</p>
        </Drawer>
      </Section>

      <Section
        id="drawer"
        title="Drawer"
        description="Dialogue modal : Échap et clic sur le fond ferment, le focus est piégé puis rendu."
      >
        <Button onClick={() => setDrawer(true)}>Ouvrir le tiroir</Button>
      </Section>

      <Section id="empty-state" title="EmptyState">
        <EmptyState
          icon={<Inbox />}
          title="Aucune alerte sur cette sélection"
          description="Les alertes apparaissent ici dès qu'un seuil est dépassé."
          action={<Button>Créer une règle</Button>}
        />
      </Section>

      <Section
        id="charts"
        title="ChartCard, BarChart, LineChart"
        description="Couleur fixée par série, jamais par rang. Légende écrite, valeurs en infobulle, tableau masqué pour les lecteurs d'écran."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="LineChart avec bande d'incertitude"
            subtitle="Bande = intervalle de confiance"
            legend={[
              { label: "Offre Pro", color: "green" },
              { label: "Offre Solo", color: "slate" },
            ]}
            footnote="Méthode v1 · base 31 200 comptes."
            actions={
              <InfoTooltip text="La bande grise montre l'incertitude de la mesure ; plus elle est large, moins le chiffre est solide." />
            }
          >
            <LineChart
              hideLegend
              label="Taux par mois"
              xKey="mois"
              data={LINE_DATA}
              unit="%"
              series={[
                { key: "a", label: "Offre Pro", color: "green", band: { lower: "aLo", upper: "aHi" } },
                { key: "b", label: "Offre Solo", color: "slate" },
              ]}
            />
          </ChartCard>
          <ChartCard title="BarChart horizontal" subtitle="Part des visites">
            <BarChart label="Origine du trafic" data={BAR_DATA} unit="%" />
          </ChartCard>
          <ChartCard title="BarChart vertical" subtitle="Part des visites" className="lg:col-span-2">
            <BarChart
              orientation="vertical"
              height={220}
              label="Origine du trafic (vertical)"
              data={BAR_DATA}
              unit="%"
            />
          </ChartCard>
        </div>
      </Section>

      <Section
        id="treemap"
        title="Treemap"
        description="Surface = une grandeur, intensité = une autre. Un grand bloc pâle est une opportunité."
      >
        <Treemap label="Demande et couverture" items={TREEMAP_ITEMS} />
      </Section>
    </>
  );
}
