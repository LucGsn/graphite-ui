export interface TreemapInput {
  id: string;
  value: number;
}

/** Rectangle en pourcentage du conteneur (0–100). */
export interface TreemapRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

type Cell = { id: string; area: number };
type Box = { x: number; y: number; w: number; h: number };

/** Pire rapport d'aspect d'une rangée posée sur le petit côté `side` (critère de la méthode « squarified »). */
function worst(row: Cell[], side: number) {
  const sum = row.reduce((s, c) => s + c.area, 0);
  const areas = row.map((c) => c.area);
  return Math.max(
    (side * side * Math.max(...areas)) / (sum * sum),
    (sum * sum) / (side * side * Math.min(...areas)),
  );
}

function placeRow(row: Cell[], box: Box, out: Box[] & { id?: string }[]): Box {
  const sum = row.reduce((s, c) => s + c.area, 0);
  if (box.w >= box.h) {
    const width = sum / box.h;
    let y = box.y;
    for (const c of row) {
      const h = c.area / width;
      out.push({ id: c.id, x: box.x, y, w: width, h } as Box);
      y += h;
    }
    return { x: box.x + width, y: box.y, w: box.w - width, h: box.h };
  }
  const height = sum / box.w;
  let x = box.x;
  for (const c of row) {
    const w = c.area / height;
    out.push({ id: c.id, x, y: box.y, w, h: height } as Box);
    x += w;
  }
  return { x: box.x, y: box.y + height, w: box.w, h: box.h - height };
}

/**
 * Carte proportionnelle « squarified » : la SURFACE de chaque rectangle est proportionnelle à `value`.
 * `ratio` = largeur / hauteur du conteneur. Les valeurs ≤ 0 sont ignorées.
 */
export function layoutTreemap(items: TreemapInput[], ratio = 2): TreemapRect[] {
  const kept = items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  const total = kept.reduce((s, i) => s + i.value, 0);
  if (total === 0) return [];
  const queue: Cell[] = kept.map((i) => ({ id: i.id, area: (i.value / total) * ratio }));
  const out: (Box & { id: string })[] = [];
  let box: Box = { x: 0, y: 0, w: ratio, h: 1 };
  let row: Cell[] = [];
  while (queue.length) {
    const side = Math.min(box.w, box.h);
    const next = queue[0];
    if (row.length === 0 || worst([...row, next], side) <= worst(row, side)) row.push(queue.shift()!);
    else {
      box = placeRow(row, box, out);
      row = [];
    }
  }
  if (row.length) placeRow(row, box, out);
  return out.map((r) => ({
    id: r.id,
    x: (r.x / ratio) * 100,
    y: r.y * 100,
    w: (r.w / ratio) * 100,
    h: r.h * 100,
  }));
}
