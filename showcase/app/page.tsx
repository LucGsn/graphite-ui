import { Activity, Clock, Gauge, Plus, Users } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  InfoTooltip,
  KpiGrid,
  KpiStat,
  ProgressDots,
  SaveIndicator,
  StatusDot,
} from "graphite-ui";
import { Section, Variant } from "../components/section";
import { ThemeSwitcher } from "../components/theme-switcher";
import { MoreDemos } from "../components/more-demos";

const SURFACES = [
  ["background", "bg-background"],
  ["sidebar", "bg-sidebar"],
  ["accent", "bg-accent"],
  ["field", "bg-field"],
  ["primary", "bg-primary"],
] as const;

const STATUTS = [
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["danger", "bg-danger"],
  ["neutral", "bg-neutral"],
] as const;

const SERIES = [
  ["chart-green", "bg-chart-green"],
  ["chart-amber", "bg-chart-amber"],
  ["chart-slate", "bg-chart-slate"],
  ["chart-gray", "bg-chart-gray"],
  ["chart-red", "bg-chart-red"],
] as const;

function Swatches({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(([name, cls]) => (
        <div key={name} className="min-w-0">
          <div className={`h-14 rounded-lg border ${cls}`} />
          <p className="mono mt-1.5 truncate text-xs text-muted">--{name}</p>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <h1 className="truncate text-sm font-semibold uppercase tracking-[0.7px]">graphite-ui</h1>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <p className="max-w-2xl text-sm text-muted">
          Gris neutres purs. La couleur est réservée aux statuts et aux données. Peu de texte, gros chiffres,
          explications au survol.
        </p>

        <Section
          id="tokens"
          title="Tokens"
          description="Surfaces, statuts et séries. Le thème de marque ne change que quelques tokens (primaire, séries)."
        >
          <div className="space-y-6">
            <Variant name="surfaces">
              <Swatches items={SURFACES} />
            </Variant>
            <Variant name="statuts (couleur réservée)">
              <Swatches items={STATUTS} />
            </Variant>
            <Variant name="séries de graphique">
              <Swatches items={SERIES} />
            </Variant>
            <Variant name="échelle typographique">
              <div className="space-y-2">
                <p className="text-stat tabular-nums">1 284 — grand chiffre 30/600</p>
                <p className="text-sm font-semibold uppercase tracking-[0.35px] text-muted">
                  Titre de section 14/600
                </p>
                <p className="text-sm font-medium text-muted">Libellé 14/500</p>
                <p className="text-xs text-faint">Sous-libellé 12/400 atténué</p>
                <p className="mono text-xs text-muted">méta 12 monospace — a1b2c3 · 2026-10-27</p>
              </div>
            </Variant>
          </div>
        </Section>

        <Section id="button" title="Button" description="36 px. Un seul bouton plein (primary) par écran.">
          <div className="grid gap-6 sm:grid-cols-2">
            <Variant name="variant">
              <div className="flex flex-wrap items-center gap-2">
                <Button>Par défaut</Button>
                <Button variant="primary">Primary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button disabled>Désactivé</Button>
              </div>
            </Variant>
            <Variant name="size · avec icône">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Petit</Button>
                <Button>
                  <Plus /> Ajouter
                </Button>
                <Button variant="primary" size="sm">
                  <Plus /> Ajouter
                </Button>
              </div>
            </Variant>
          </div>
        </Section>

        <Section
          id="badge"
          title="Badge et StatusDot"
          description="Le badge reste gris : la couleur ne se porte que par le point, et le mot porte le sens."
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Variant name="Badge tone">
              <div className="flex flex-wrap gap-2">
                <Badge tone="success">Solide</Badge>
                <Badge tone="warning">Indicatif</Badge>
                <Badge tone="danger">Erreur</Badge>
                <Badge tone="neutral">Fragile</Badge>
                <Badge dot={false}>Sans point</Badge>
              </div>
            </Variant>
            <Variant name="StatusDot">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {(["success", "warning", "danger", "neutral"] as const).map((t) => (
                  <span key={t} className="inline-flex items-center gap-2">
                    <StatusDot tone={t} /> {t}
                  </span>
                ))}
              </div>
            </Variant>
          </div>
        </Section>

        <Section id="card" title="Card" description="Simple cadre à bordure fine, sans fond ni ombre.">
          <div className="grid gap-4 md:grid-cols-2">
            <Variant name="Card + CardHeader">
              <Card>
                <CardHeader title="Évolution mensuelle" subtitle="12 derniers mois" />
                <p className="text-sm">Contenu libre : graphique, liste, tableau.</p>
              </Card>
            </Variant>
            <Variant name="avec action et info">
              <Card>
                <CardHeader
                  title="Répartition"
                  subtitle="Par canal"
                  actions={
                    <InfoTooltip text="Part de chaque canal dans le total, sur la période affichée." />
                  }
                />
                <div className="flex items-center gap-2">
                  <Badge tone="success">+4 pts</Badge>
                  <span className="text-sm text-muted">vs période précédente</span>
                </div>
              </Card>
            </Variant>
          </div>
        </Section>

        <Section
          id="kpi-stat"
          title="KpiStat"
          description="Chiffre clé sans cadre : grand chiffre, libellé, légende. L'explication est au survol de l'icône."
        >
          <KpiGrid className="my-0">
            <KpiStat
              label="Taux de conversion"
              value="42,8"
              unit="%"
              caption="vs 40,1 le mois dernier"
              icon={<Gauge className="size-3.5" strokeWidth={1.75} />}
              info="Part des visites qui aboutissent à une inscription, sur 30 jours glissants."
            />
            <KpiStat
              label="Utilisateurs actifs"
              value="12 480"
              caption="base : 31 200 comptes"
              icon={<Users className="size-3.5" strokeWidth={1.75} />}
              info="Comptes ayant une session sur les 7 derniers jours."
              badge={<Badge tone="success">Solide</Badge>}
            />
            <KpiStat
              label="Délai médian"
              value="3,2"
              unit="j"
              caption="indicatif"
              icon={<Clock className="size-3.5" strokeWidth={1.75} />}
              info="Médiane du délai entre la demande et la première réponse."
              badge={<Badge tone="warning">Indicatif</Badge>}
            />
            <KpiStat
              label="À venir"
              value="—"
              caption="données en cours de collecte"
              placeholder
              icon={<Activity className="size-3.5" />}
            />
          </KpiGrid>
        </Section>

        <Section
          id="info-tooltip"
          title="InfoTooltip"
          description="S'ouvre au survol, au clic ou toucher et au clavier (Entrée ; Échap ou clic ailleurs referme)."
        >
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="inline-flex items-center gap-2">
              Aligné à droite (défaut) <InfoTooltip text="Explication alignée sur le bord droit du bouton." />
            </span>
            <span className="inline-flex items-center gap-2">
              Aligné à gauche{" "}
              <InfoTooltip align="start" text="Explication alignée sur le bord gauche du bouton." />
            </span>
          </div>
        </Section>
        <MoreDemos />

        <Section
          id="onboarding"
          title="Onboarding et questionnaires"
          description="Un questionnaire décrit en JSON (contrat versionné), affiché par OnboardingShell : une question ou une section par écran, écrans personnalisés, enregistrement et reprise, récapitulatif, écran de fin."
        >
          <div className="grid gap-6 sm:grid-cols-3">
            <Variant name="ProgressDots · étape 3 sur 6">
              <ProgressDots current={3} total={6} />
            </Variant>
            <Variant name="SaveIndicator">
              <div className="flex flex-col gap-1">
                <SaveIndicator status="saving" />
                <SaveIndicator status="saved" />
                <SaveIndicator status="error" />
              </div>
            </Variant>
            <Variant name="démonstration complète">
              <a href="/onboarding" className="text-sm underline underline-offset-4">
                Ouvrir l&apos;onboarding de démonstration
              </a>
            </Variant>
          </div>
        </Section>

        <Section
          id="exemples"
          title="Exemples de pages"
          description="Trois pages complètes dans la coque d'app."
        >
          <ul className="space-y-1 text-sm underline underline-offset-4">
            <li>
              <a href="/exemples/tableau-de-bord">Tableau de bord</a>
            </li>
            <li>
              <a href="/exemples/liste">Liste</a>
            </li>
            <li>
              <a href="/exemples/detail">Détail</a>
            </li>
          </ul>
        </Section>
      </main>
    </>
  );
}
