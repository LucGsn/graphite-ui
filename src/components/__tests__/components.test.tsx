import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Badge, Button, Card, CardHeader, InfoTooltip, KpiGrid, KpiStat, StatusDot } from "../../index";

describe("Button", () => {
  it("rend un bouton de type button par défaut et déclenche onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Exporter</Button>);
    const b = screen.getByRole("button", { name: "Exporter" });
    expect(b).toHaveAttribute("type", "button");
    await userEvent.click(b);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applique les variantes et ne réagit pas quand il est désactivé", async () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" size="sm" disabled onClick={onClick}>
        Valider
      </Button>,
    );
    const b = screen.getByRole("button", { name: "Valider" });
    expect(b.className).toContain("bg-primary");
    expect(b.className).toContain("h-8");
    await userEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Badge et StatusDot", () => {
  it("porte la couleur par le point seulement", () => {
    const { container } = render(<Badge tone="success">Solide</Badge>);
    expect(screen.getByText("Solide")).toBeInTheDocument();
    expect(container.querySelector(".bg-success")).not.toBeNull();
    expect(container.firstElementChild?.className).not.toContain("bg-success");
  });

  it("masque le point sur demande ; le point est décoratif", () => {
    const { container } = render(<Badge dot={false}>Texte</Badge>);
    expect(container.querySelector("[aria-hidden]")).toBeNull();
    render(<StatusDot tone="danger" data-testid="dot" />);
    expect(screen.getByTestId("dot")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("dot").className).toContain("bg-danger");
  });
});

describe("Card", () => {
  it("affiche titre, sous-titre, actions et contenu", () => {
    render(
      <Card>
        <CardHeader title="Évolution" subtitle="12 mois" actions={<span>actions</span>} />
        <p>Contenu</p>
      </Card>,
    );
    expect(screen.getByRole("heading", { name: "Évolution" })).toBeInTheDocument();
    expect(screen.getByText("12 mois")).toBeInTheDocument();
    expect(screen.getByText("actions")).toBeInTheDocument();
    expect(screen.getByText("Contenu")).toBeInTheDocument();
  });
});

describe("KpiStat", () => {
  it("rend le chiffre, l'unité, le libellé et la légende", () => {
    render(
      <KpiGrid>
        <KpiStat label="Taux de conversion" value="42,8" unit="%" caption="vs 40,1 le mois dernier" />
      </KpiGrid>,
    );
    expect(screen.getByRole("heading", { name: "Taux de conversion" })).toBeInTheDocument();
    expect(screen.getByText("42,8")).toHaveClass("text-stat");
    expect(screen.getByText("%")).toBeInTheDocument();
    expect(screen.getByText("vs 40,1 le mois dernier")).toBeInTheDocument();
  });

  it("n'affiche aucune explication à l'écran : elle est dans l'infobulle", () => {
    render(<KpiStat label="Délai" value="3" info="Médiane sur 30 jours." />);
    expect(screen.queryByText("Médiane sur 30 jours.")).toBeNull();
    expect(screen.getByRole("button", { name: "Explication" })).toBeInTheDocument();
  });

  it("estompe l'emplacement réservé", () => {
    const { container } = render(<KpiStat label="À venir" value="—" placeholder />);
    expect(container.firstElementChild?.className).toContain("opacity-60");
  });
});

describe("InfoTooltip", () => {
  it("s'ouvre au survol et se referme en sortant", () => {
    render(<InfoTooltip text="Explication longue" />);
    const b = screen.getByRole("button", { name: "Explication" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.mouseEnter(b.parentElement!);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Explication longue");
    expect(b).toHaveAttribute("aria-expanded", "true");
    fireEvent.mouseLeave(b.parentElement!);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("s'ouvre au clic / toucher, se referme au clic ailleurs", async () => {
    render(
      <div>
        <InfoTooltip text="Détail" />
        <p>ailleurs</p>
      </div>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Explication" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.click(screen.getByText("ailleurs"));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("fonctionne au clavier : Entrée ouvre, Échap referme", async () => {
    const user = userEvent.setup();
    render(<InfoTooltip text="Clavier" />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Explication" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("relie le bouton à l'infobulle (aria-describedby)", async () => {
    render(<InfoTooltip text="Lien" label="Aide" />);
    const b = screen.getByRole("button", { name: "Aide" });
    await userEvent.click(b);
    expect(b.getAttribute("aria-describedby")).toBe(screen.getByRole("tooltip").id);
  });
});
