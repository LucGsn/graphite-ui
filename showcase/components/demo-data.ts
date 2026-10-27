// Données factices génériques de la vitrine : aucune donnée métier.
export const MONTHS = ["Mai", "Juin", "Juil.", "Août", "Sept.", "Oct."];

export const LINE_DATA = [
  { mois: "Mai", a: 32, aLo: 28, aHi: 36, b: 21 },
  { mois: "Juin", a: 35, aLo: 31, aHi: 39, b: 24 },
  { mois: "Juil.", a: 38, aLo: 33, aHi: 43, b: 22 },
  { mois: "Août", a: 36, aLo: 31, aHi: 41, b: 27 },
  { mois: "Sept.", a: 41, aLo: 36, aHi: 46, b: 29 },
  { mois: "Oct.", a: 44, aLo: 39, aHi: 49, b: 31 },
];

export const BAR_DATA = [
  { label: "Recherche", value: 48, color: "green" as const },
  { label: "Direct", value: 31, color: "slate" as const },
  { label: "Réseaux", value: 14, color: "amber" as const },
  { label: "E-mail", value: 7, color: "gray" as const },
];

export const TREEMAP_ITEMS = [
  { id: "a", label: "Produits", value: 420, intensity: 0.15, detail: "420 recherches · 15 % couvert" },
  { id: "b", label: "Tarifs", value: 260, intensity: 0.7, detail: "260 recherches · 70 % couvert" },
  { id: "c", label: "Avis", value: 180, intensity: 0.4, detail: "180 recherches · 40 % couvert" },
  { id: "d", label: "Aide", value: 120, intensity: 0.9, detail: "120 recherches · 90 % couvert" },
  { id: "e", label: "Blog", value: 80, intensity: 0.25, detail: "80 recherches · 25 % couvert" },
  { id: "f", label: "Carrières", value: 45, intensity: 0.5, detail: "45 recherches · 50 % couvert" },
  { id: "g", label: "Presse", value: 30, intensity: 0.1, detail: "30 recherches · 10 % couvert" },
];

export type Account = {
  id: string;
  name: string;
  plan: string;
  users: number;
  status: "ok" | "late" | "off";
};
export const ACCOUNTS: Account[] = [
  { id: "ac-101", name: "Atelier Nord", plan: "Pro", users: 128, status: "ok" },
  { id: "ac-102", name: "Brasserie du Port", plan: "Équipe", users: 42, status: "late" },
  { id: "ac-103", name: "Cabinet Lemaire", plan: "Pro", users: 87, status: "ok" },
  { id: "ac-104", name: "Domaine des Pins", plan: "Solo", users: 6, status: "off" },
  { id: "ac-105", name: "Éditions Horizon", plan: "Équipe", users: 54, status: "ok" },
];
