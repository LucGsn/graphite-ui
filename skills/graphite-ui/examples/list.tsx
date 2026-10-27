"use client";

// Exemple « liste » : onglets, filtre, tableau triable, tiroir de détail, état vide.
import { useState } from "react";
import { Inbox, Plus } from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  EmptyState,
  FilterSelect,
  PageHeader,
  Tabs,
  type Column,
} from "graphite-ui";

type Account = { id: string; name: string; plan: string; users: number; late: boolean };

const ACCOUNTS: Account[] = [
  { id: "ac-101", name: "Atelier Nord", plan: "Pro", users: 128, late: false },
  { id: "ac-102", name: "Brasserie du Port", plan: "Équipe", users: 42, late: true },
];

const columns: Column<Account>[] = [
  { key: "name", header: "Compte", sortValue: (r) => r.name },
  { key: "plan", header: "Offre", sortValue: (r) => r.plan },
  { key: "users", header: "Utilisateurs", numeric: true, sortValue: (r) => r.users },
  {
    key: "status",
    header: "Statut",
    cell: (r) => <Badge tone={r.late ? "warning" : "success"}>{r.late ? "En retard" : "Actif"}</Badge>,
  },
];

export default function List() {
  const [tab, setTab] = useState("comptes");
  const [plan, setPlan] = useState("all");
  const [open, setOpen] = useState<Account | null>(null);
  const rows = ACCOUNTS.filter((a) => plan === "all" || a.plan === plan);

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
      <div className="mb-3">
        <FilterSelect
          label="Offre"
          value={plan}
          onValueChange={setPlan}
          options={[
            { value: "all", label: "Toutes" },
            { value: "Pro", label: "Pro" },
            { value: "Équipe", label: "Équipe" },
          ]}
        />
      </div>
      <DataTable
        caption="Liste des comptes"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={setOpen}
        empty={<EmptyState icon={<Inbox />} title="Aucun compte sur cette sélection" />}
      />
      <Drawer
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.name ?? ""}
        description={open ? `${open.id} · offre ${open.plan}` : undefined}
      >
        {open && <p className="text-stat tabular-nums">{open.users}</p>}
      </Drawer>
    </>
  );
}
