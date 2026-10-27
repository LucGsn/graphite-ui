import { Clock, Users } from "lucide-react";
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
import { BAR_DATA } from "../../../components/demo-data";

export const metadata = { title: "Exemple · Détail" };

/** Exemple de page « détail » : en-tête, chiffres clés, deux cartes, historique. */
export default function Page() {
  return (
    <>
      <PageHeader
        title="Atelier Nord"
        actions={<Button>Exporter</Button>}
        description="ac-101 · offre Pro · créé le 12/03/2025"
      />
      <div className="flex items-center gap-2">
        <Badge tone="success">Actif</Badge>
        <Badge dot={false}>Pro</Badge>
      </div>
      <KpiGrid className="lg:grid-cols-3">
        <KpiStat
          label="Utilisateurs"
          value="128"
          caption="+6 ce mois"
          icon={<Users className="size-3.5" strokeWidth={1.75} />}
          info="Comptes utilisateurs rattachés à cette organisation."
        />
        <KpiStat
          label="Temps de réponse"
          value="1,4"
          unit="s"
          caption="médiane 30 jours"
          icon={<Clock className="size-3.5" strokeWidth={1.75} />}
          info="Médiane du temps de réponse de l'API pour ce compte."
        />
        <KpiStat
          label="Satisfaction"
          value="87"
          unit="%"
          caption="base : 214 réponses"
          badge={<Badge tone="success">Solide</Badge>}
        />
      </KpiGrid>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Usage par fonctionnalité" subtitle="30 derniers jours" />
          <BarChart label="Usage par fonctionnalité" data={BAR_DATA} unit="%" height={200} />
        </Card>
        <Card>
          <CardHeader title="Informations" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted">Responsable</dt>
            <dd>Camille Durand</dd>
            <dt className="text-muted">Contrat</dt>
            <dd>Annuel, renouvelé le 12/03</dd>
            <dt className="text-muted">Région</dt>
            <dd>Hauts-de-France</dd>
          </dl>
        </Card>
      </div>
      <GroupDivider>Historique</GroupDivider>
      <List className="rounded-lg border">
        <ListRow initials="CD" title="Camille Durand a mis à jour le contrat" meta="27/10" />
        <ListRow
          initials="SY"
          tone="warning"
          title="Quota atteint à 90 %"
          detail="Alerte envoyée au responsable"
          meta="21/10"
        />
        <ListRow initials="SY" title="Renouvellement automatique" meta="12/03" />
      </List>
    </>
  );
}
