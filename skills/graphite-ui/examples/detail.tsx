// Exemple « détail » : composant serveur (aucun hook, aucune fonction passée à un composant client).
import {
  Badge,
  BarChart,
  Button,
  Card,
  CardHeader,
  GroupDivider,
  KpiGrid,
  KpiStat,
  List,
  ListRow,
  PageHeader,
} from "graphite-ui";

export default function Detail() {
  return (
    <>
      <PageHeader
        title="Atelier Nord"
        actions={<Button>Exporter</Button>}
        description="ac-101 · offre Pro · créé le 12/03/2025"
      />
      <Badge tone="success">Actif</Badge>
      <KpiGrid className="lg:grid-cols-3">
        <KpiStat
          label="Utilisateurs"
          value="128"
          caption="+6 ce mois"
          info="Comptes rattachés à cette organisation."
        />
        <KpiStat label="Temps de réponse" value="1,4" unit="s" caption="médiane 30 jours" />
        <KpiStat label="Satisfaction" value="87" unit="%" badge={<Badge tone="success">Solide</Badge>} />
      </KpiGrid>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Usage par fonctionnalité" subtitle="30 derniers jours" />
          {/* Composant serveur : `unit` (sérialisable) plutôt qu'une fonction `formatValue`. */}
          <BarChart
            label="Usage par fonctionnalité"
            unit="%"
            height={200}
            data={[
              { label: "Recherche", value: 48, color: "green" },
              { label: "Direct", value: 31, color: "slate" },
              { label: "Réseaux", value: 14, color: "amber" },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Informations" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted">Responsable</dt>
            <dd>Camille Durand</dd>
            <dt className="text-muted">Contrat</dt>
            <dd>Annuel</dd>
          </dl>
        </Card>
      </div>
      <GroupDivider>Historique</GroupDivider>
      <List className="rounded-lg border">
        <ListRow initials="CD" title="Camille Durand a mis à jour le contrat" meta="27/10" />
        <ListRow initials="SY" tone="warning" title="Quota atteint à 90 %" meta="21/10" />
      </List>
    </>
  );
}
