"use client";

import { useState } from "react";
import { Inbox, Plus } from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  EmptyState,
  FilterSelect,
  List,
  ListRow,
  PageHeader,
  SectionTitle,
  Tabs,
  type Column,
} from "graphite-ui";
import { ACCOUNTS, type Account } from "./demo-data";

const STATUS = {
  ok: { tone: "success", label: "Actif" },
  late: { tone: "warning", label: "En retard" },
  off: { tone: "neutral", label: "Inactif" },
} as const;

/** Exemple de page « liste » : onglets, filtre, tableau triable, tiroir de détail, état vide. */
export function ListExample() {
  const [tab, setTab] = useState("comptes");
  const [plan, setPlan] = useState("all");
  const [open, setOpen] = useState<Account | null>(null);

  const rows = ACCOUNTS.filter((a) => plan === "all" || a.plan === plan);
  const columns: Column<Account>[] = [
    { key: "name", header: "Compte", sortValue: (r) => r.name },
    { key: "plan", header: "Offre", sortValue: (r) => r.plan },
    { key: "users", header: "Utilisateurs", numeric: true, sortValue: (r) => r.users },
    {
      key: "status",
      header: "Statut",
      cell: (r) => <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Comptes"
        actions={
          <Button variant="primary">
            <Plus /> Ajouter
          </Button>
        }
      />
      <Tabs
        label="Sections"
        value={tab}
        onValueChange={setTab}
        items={[
          { value: "comptes", label: "Comptes" },
          { value: "activite", label: "Activité" },
        ]}
      />
      {tab === "comptes" ? (
        <div role="tabpanel" id="tabs-panel-comptes" aria-labelledby="tabs-tab-comptes">
          <div className="mb-3">
            <FilterSelect
              label="Offre"
              value={plan}
              onValueChange={setPlan}
              options={[
                { value: "all", label: "Toutes" },
                { value: "Pro", label: "Pro" },
                { value: "Équipe", label: "Équipe" },
                { value: "Solo", label: "Solo" },
              ]}
            />
          </div>
          <DataTable
            caption="Liste des comptes"
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={setOpen}
          />
        </div>
      ) : (
        <div role="tabpanel" id="tabs-panel-activite" aria-labelledby="tabs-tab-activite">
          <SectionTitle>Dernières activités</SectionTitle>
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
              title="Paiement en retard — Brasserie du Port"
              detail="Relance envoyée"
              meta="il y a 1 j"
            />
            <ListRow initials="DP" title="Domaine des Pins a désactivé son compte" meta="il y a 3 j" />
          </List>
          <div className="mt-6">
            <EmptyState
              icon={<Inbox />}
              title="Aucune alerte sur cette sélection"
              description="Les alertes apparaissent ici dès qu'un seuil est dépassé."
            />
          </div>
        </div>
      )}
      <Drawer
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.name ?? ""}
        description={open ? `${open.id} · offre ${open.plan}` : undefined}
      >
        {open && (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Utilisateurs</dt>
              <dd className="text-stat tabular-nums">{open.users}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Statut</dt>
              <dd className="mt-1">
                <Badge tone={STATUS[open.status].tone}>{STATUS[open.status].label}</Badge>
              </dd>
            </div>
          </dl>
        )}
      </Drawer>
    </>
  );
}
