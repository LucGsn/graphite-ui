import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  BarChart,
  ChartCard,
  DataTable,
  EmptyState,
  LineChart,
  List,
  ListRow,
  Treemap,
  layoutTreemap,
} from "../../index";

describe("List et ListRow", () => {
  it("rend initiales, titre, détail et méta", () => {
    render(
      <List>
        <ListRow initials="AB" tone="warning" title="Alerte" detail="Seuil dépassé" meta="a1b2c3" />
      </List>,
    );
    expect(screen.getByRole("listitem")).toBeInTheDocument();
    expect(screen.getByText("AB")).toBeInTheDocument();
    expect(screen.getByText("Seuil dépassé")).toBeInTheDocument();
    expect(screen.getByText("a1b2c3")).toHaveClass("mono");
  });
});

type Row = { id: string; nom: string; score: number };
const ROWS: Row[] = [
  { id: "1", nom: "Beta", score: 20 },
  { id: "2", nom: "Alpha", score: 75 },
  { id: "3", nom: "Gamma", score: 5 },
];

describe("DataTable", () => {
  const columns = [
    { key: "nom", header: "Nom", sortValue: (r: Row) => r.nom },
    { key: "score", header: "Score", numeric: true, sortValue: (r: Row) => r.score },
  ];
  const names = () =>
    screen
      .getAllByRole("row")
      .slice(1)
      .map((r) => within(r).getAllByRole("cell")[0].textContent);

  it("rend un tableau légendé avec ses lignes", () => {
    render(<DataTable caption="Écoles" columns={columns} rows={ROWS} rowKey={(r) => r.id} />);
    expect(screen.getByRole("table", { name: "Écoles" })).toBeInTheDocument();
    expect(names()).toEqual(["Beta", "Alpha", "Gamma"]);
  });

  it("trie au clic (asc, desc, retour) et met aria-sort à jour", async () => {
    const user = userEvent.setup();
    render(<DataTable caption="Écoles" columns={columns} rows={ROWS} rowKey={(r) => r.id} />);
    const header = screen.getByRole("columnheader", { name: /Score/ });
    expect(header).toHaveAttribute("aria-sort", "none");
    await user.click(within(header).getByRole("button"));
    expect(names()).toEqual(["Gamma", "Beta", "Alpha"]);
    expect(header).toHaveAttribute("aria-sort", "ascending");
    await user.click(within(header).getByRole("button"));
    expect(names()).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(header).toHaveAttribute("aria-sort", "descending");
    await user.click(within(header).getByRole("button"));
    expect(names()).toEqual(["Beta", "Alpha", "Gamma"]);
  });

  it("rend l'état vide quand il n'y a aucune ligne", () => {
    render(
      <DataTable
        caption="Vide"
        columns={columns}
        rows={[]}
        rowKey={(r: Row) => r.id}
        empty={<EmptyState title="Aucune ligne" />}
      />,
    );
    expect(screen.getByText("Aucune ligne")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("rend les lignes cliquables accessibles au clavier", async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        caption="Écoles"
        columns={columns}
        rows={ROWS}
        rowKey={(r) => r.id}
        onRowClick={onRowClick}
      />,
    );
    const row = screen.getAllByRole("row")[1];
    row.focus();
    await user.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenCalledWith(ROWS[0]);
  });
});

describe("layoutTreemap", () => {
  const items = [
    { id: "a", value: 50 },
    { id: "b", value: 25 },
    { id: "c", value: 15 },
    { id: "d", value: 10 },
    { id: "zero", value: 0 },
  ];
  const rects = layoutTreemap(items, 2);

  it("ignore les valeurs nulles et couvre tout le conteneur", () => {
    expect(rects.map((r) => r.id).sort()).toEqual(["a", "b", "c", "d"]);
    expect(rects.reduce((s, r) => s + (r.w * r.h) / 100, 0)).toBeCloseTo(100, 5);
  });

  it("donne à chaque bloc une surface proportionnelle à sa valeur", () => {
    for (const r of rects) {
      const expected = items.find((i) => i.id === r.id)!.value;
      expect((r.w * r.h) / 100).toBeCloseTo(expected, 5);
    }
  });

  it("reste dans les bornes et sans recouvrement", () => {
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(-1e-9);
      expect(r.y).toBeGreaterThanOrEqual(-1e-9);
      expect(r.x + r.w).toBeLessThanOrEqual(100 + 1e-9);
      expect(r.y + r.h).toBeLessThanOrEqual(100 + 1e-9);
    }
    for (const [i, a] of rects.entries())
      for (const b of rects.slice(i + 1)) {
        const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        expect(dx > 1e-9 && dy > 1e-9).toBe(false);
      }
  });

  it("renvoie une liste vide sans valeur positive", () => {
    expect(layoutTreemap([{ id: "x", value: 0 }])).toEqual([]);
  });
});

describe("Treemap", () => {
  it("rend un bloc par entrée avec son détail en infobulle ; les blocs avec href sont des liens", () => {
    render(
      <Treemap
        label="Opportunités"
        items={[
          { id: "a", label: "Alpha", value: 60, intensity: 0.2, detail: "60 recherches", href: "/a" },
          { id: "b", label: "Beta", value: 40, intensity: 0.9 },
        ]}
      />,
    );
    expect(screen.getByRole("group", { name: "Opportunités" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Alpha — 60 recherches" })).toHaveAttribute("href", "/a");
    expect(screen.getByRole("img", { name: "Beta" })).toBeInTheDocument();
  });
});

describe("BarChart", () => {
  it("expose les données dans un tableau masqué pour les lecteurs d'écran", () => {
    render(
      <BarChart
        label="Part par canal"
        formatValue={(v) => `${v} %`}
        data={[
          { label: "Web", value: 40, color: "green" },
          { label: "Mobile", value: 25 },
        ]}
      />,
    );
    const fig = screen.getByRole("figure", { name: "Part par canal" });
    const table = within(fig).getByRole("table", { name: "Part par canal" });
    expect(within(table).getByRole("row", { name: /Web.*40 %/ })).toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /Mobile.*25 %/ })).toBeInTheDocument();
  });
});

describe("LineChart", () => {
  const data = [
    { mois: "Août", a: 10, lo: 8, hi: 12 },
    { mois: "Sept.", a: 14, lo: 11, hi: 17 },
    { mois: "Oct.", a: null, lo: null, hi: null },
  ];

  it("affiche une légende écrite et un tableau masqué (— pour les valeurs absentes)", () => {
    render(
      <LineChart
        label="Évolution"
        xKey="mois"
        series={[{ key: "a", label: "Série A", color: "green", band: { lower: "lo", upper: "hi" } }]}
        data={data}
        formatValue={(v) => `${v} pts`}
      />,
    );
    const fig = screen.getByRole("figure", { name: "Évolution" });
    expect(within(fig).getByText("Série A", { selector: "li" })).toBeInTheDocument();
    const table = within(fig).getByRole("table");
    expect(within(table).getByRole("row", { name: /Sept\..*14 pts/ })).toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /Oct\..*—/ })).toBeInTheDocument();
  });

  it("peut masquer la légende quand la carte la porte", () => {
    render(
      <ChartCard title="Carte" legend={[{ label: "Série A", color: "green" }]} footnote="Méthode v1">
        <LineChart
          label="Évolution"
          xKey="mois"
          series={[{ key: "a", label: "Série A", color: "green" }]}
          data={data}
          hideLegend
        />
      </ChartCard>,
    );
    expect(screen.getAllByText("Série A", { selector: "li" })).toHaveLength(1);
    expect(screen.getByText("Méthode v1")).toBeInTheDocument();
  });
});

describe("unité sérialisable", () => {
  it("BarChart formate avec `unit` sans fonction (virgule décimale)", () => {
    render(<BarChart label="Taux" unit="%" data={[{ label: "A", value: 12.5 }]} />);
    expect(screen.getByRole("row", { name: /A.*12,5\s%/ })).toBeInTheDocument();
  });

  it("LineChart formate avec `unit`", () => {
    render(
      <LineChart
        label="Évol"
        unit="pts"
        xKey="m"
        series={[{ key: "v", label: "V", color: "green" }]}
        data={[{ m: "Mai", v: 3 }]}
      />,
    );
    expect(screen.getByRole("row", { name: /Mai.*3\spts/ })).toBeInTheDocument();
  });
});
