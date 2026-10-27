// Utilitaires de couleur pour les tests : analyse oklch / oklab / hex, mélange alpha en sRGB, contraste WCAG.

export type Rgba = { r: number; g: number; b: number; a: number };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const toSrgb = (c: number) => {
  const v = clamp01(c);
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
};
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

function oklabToRgb(L: number, a: number, b: number, alpha: number): Rgba {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return {
    r: toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    a: alpha,
  };
}

function parseAlpha(s: string | undefined) {
  if (!s) return 1;
  const v = s.trim();
  return v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v);
}

/** Analyse une couleur de token (`oklch(…)`, `oklab(…)` ou `#rrggbb`). */
export function parseColor(input: string): Rgba {
  const v = input.trim();
  if (v.startsWith("#")) {
    const h = v.slice(1);
    return {
      r: parseInt(h.slice(0, 2), 16) / 255,
      g: parseInt(h.slice(2, 4), 16) / 255,
      b: parseInt(h.slice(4, 6), 16) / 255,
      a: 1,
    };
  }
  const m = v.match(/^(oklch|oklab)\(([^)]+)\)$/);
  if (!m) throw new Error(`Couleur non reconnue : ${input}`);
  const [body, alpha] = m[2].split("/");
  const parts = body.trim().split(/\s+/);
  const L = parts[0].endsWith("%") ? parseFloat(parts[0]) / 100 : parseFloat(parts[0]);
  if (m[1] === "oklab") return oklabToRgb(L, parseFloat(parts[1]), parseFloat(parts[2]), parseAlpha(alpha));
  const C = parseFloat(parts[1]);
  const H = (parseFloat(parts[2]) * Math.PI) / 180;
  return oklabToRgb(L, C * Math.cos(H), C * Math.sin(H), parseAlpha(alpha));
}

/** Pose `fg` (avec son alpha) sur `bg` opaque, en sRGB comme le fait un navigateur. */
export function over(fg: Rgba, bg: Rgba): Rgba {
  const mix = (f: number, b: number) => f * fg.a + b * (1 - fg.a);
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), a: 1 };
}

const luminance = ({ r, g, b }: Rgba) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

/** Rapport de contraste WCAG entre un texte (alpha possible) et un fond opaque. */
export function contrast(fg: string, bg: string, under?: string): number {
  const back = under ? over(parseColor(bg), parseColor(under)) : parseColor(bg);
  const front = over(parseColor(fg), back);
  const [hi, lo] = [luminance(front), luminance(back)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}
