import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  AppShell,
  Drawer,
  EmptyState,
  FilterSelect,
  GroupDivider,
  IconButton,
  ModeSwitch,
  PageHeader,
  Sidebar,
  Tabs,
  ToggleGroup,
} from "../../index";

describe("AppShell + Sidebar", () => {
  const sidebar = (
    <Sidebar
      brand={<span>Marque</span>}
      sections={[
        {
          title: "Où en est-on ?",
          items: [
            { label: "Vue globale", href: "/a", active: true },
            { label: "Détail", href: "/b" },
          ],
        },
      ]}
      footer="v1"
    />
  );

  it("marque la page courante et affiche les titres de groupe", () => {
    render(<AppShell sidebar={sidebar}>contenu</AppShell>);
    const current = screen.getAllByRole("link", { name: "Vue globale" })[0];
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link", { name: "Détail" })[0]).not.toHaveAttribute("aria-current");
    expect(screen.getAllByText("Où en est-on ?").length).toBeGreaterThan(0);
    expect(screen.getByText("contenu")).toBeInTheDocument();
  });

  it("ouvre le menu mobile puis le ferme (Échap)", async () => {
    const user = userEvent.setup();
    render(
      <AppShell sidebar={sidebar} mobileTitle="App">
        x
      </AppShell>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Ouvrir le menu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("PageHeader et GroupDivider", () => {
  it("rend le titre en h1 et les actions", () => {
    render(
      <PageHeader title="Vue globale" actions={<button>Action</button>} description="Mise à jour 27/10" />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Vue globale" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(screen.getByText("Mise à jour 27/10")).toBeInTheDocument();
  });

  it("rend un séparateur étiqueté", () => {
    render(<GroupDivider>Groupe</GroupDivider>);
    expect(screen.getByRole("separator")).toHaveTextContent("Groupe");
  });
});

describe("IconButton", () => {
  it("porte son étiquette accessible", async () => {
    const onClick = vi.fn();
    render(
      <IconButton label="Supprimer" onClick={onClick}>
        ×
      </IconButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("Tabs", () => {
  function Demo() {
    const [v, setV] = useState("a");
    return (
      <Tabs
        label="Sections"
        value={v}
        onValueChange={setV}
        items={[
          { value: "a", label: "Un" },
          { value: "b", label: "Deux" },
          { value: "c", label: "Trois" },
        ]}
      />
    );
  }
  it("sélectionne au clic et déplace avec les flèches", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    expect(screen.getByRole("tab", { name: "Un" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: "Deux" }));
    expect(screen.getByRole("tab", { name: "Deux" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Trois" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Trois" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Un" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("ToggleGroup et ModeSwitch", () => {
  it("single : un seul bouton pressé", async () => {
    const onChange = vi.fn();
    render(
      <ToggleGroup
        label="Vue"
        value="a"
        onValueChange={onChange}
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "A" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "B" })).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(screen.getByRole("button", { name: "B" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("multiple : ajoute et retire des valeurs", async () => {
    const onChange = vi.fn();
    render(
      <ToggleGroup
        type="multiple"
        label="Canaux"
        value={["a"]}
        onValueChange={onChange}
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "B" }));
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);
    await userEvent.click(screen.getByRole("button", { name: "A" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("ModeSwitch : groupe étiqueté à deux modes", async () => {
    const onChange = vi.fn();
    render(
      <ModeSwitch
        value="lecture"
        onValueChange={onChange}
        modes={[
          { value: "lecture", label: "Lecture" },
          { value: "expert", label: "Expert" },
        ]}
      />,
    );
    expect(screen.getByRole("group", { name: "Mode d'affichage" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Expert" }));
    expect(onChange).toHaveBeenCalledWith("expert");
  });
});

describe("FilterSelect", () => {
  it("relie libellé et select, affiche la valeur, notifie le changement", () => {
    const onChange = vi.fn();
    render(
      <FilterSelect
        label="Période"
        value="30"
        onValueChange={onChange}
        options={[
          { value: "30", label: "30 jours" },
          { value: "90", label: "90 jours" },
        ]}
      />,
    );
    const select = screen.getByLabelText("Période");
    expect(select).toHaveValue("30");
    expect(screen.getAllByText("30 jours").length).toBeGreaterThan(0);
    fireEvent.change(select, { target: { value: "90" } });
    expect(onChange).toHaveBeenCalledWith("90");
  });
});

describe("Drawer", () => {
  function Demo({ onClose }: { onClose: () => void }) {
    return (
      <Drawer open onClose={onClose} title="Détail" description="Ligne 42">
        <button>Dans le tiroir</button>
      </Drawer>
    );
  }

  it("est un dialogue modal étiqueté et met le focus dedans", () => {
    render(<Demo onClose={() => {}} />);
    const dialog = screen.getByRole("dialog", { name: "Détail" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("se ferme avec Échap, le bouton et le fond", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Demo onClose={onClose} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Fermer" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("garde le focus dans le tiroir (Tab boucle)", async () => {
    const user = userEvent.setup();
    render(<Demo onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("ne rend rien quand il est fermé", () => {
    render(
      <Drawer open={false} onClose={() => {}} title="X">
        y
      </Drawer>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("EmptyState", () => {
  it("affiche titre, description et action", () => {
    render(<EmptyState title="Rien ici" description="Aucune donnée." action={<button>Créer</button>} />);
    expect(screen.getByText("Rien ici")).toBeInTheDocument();
    expect(screen.getByText("Aucune donnée.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Créer" })).toBeInTheDocument();
  });
});
