"use client";

import { useEffect, useState } from "react";
import { Moon, Palette, Sun } from "lucide-react";
import { Button } from "graphite-ui";

type Theme = "dark" | "light";
type Brand = "neutral" | "omnes";

/** Bascule thème (sombre / clair) et marque (neutre / omnes) : pose data-theme et data-brand sur <html>. */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [brand, setBrand] = useState<Brand>("neutral");

  // Relit l'état posé sur <html> (il survit à la navigation entre pages).
  useEffect(() => {
    const d = document.documentElement.dataset;
    setTheme(d.theme === "light" ? "light" : "dark");
    setBrand(d.brand === "omnes" ? "omnes" : "neutral");
  }, []);

  const applyTheme = (t: Theme) => {
    document.documentElement.dataset.theme = t;
    setTheme(t);
  };
  const applyBrand = (b: Brand) => {
    if (b === "neutral") delete document.documentElement.dataset.brand;
    else document.documentElement.dataset.brand = b;
    setBrand(b);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        aria-pressed={theme === "light"}
        onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? <Moon /> : <Sun />}
        {theme === "dark" ? "Sombre" : "Clair"}
      </Button>
      <Button
        size="sm"
        aria-pressed={brand === "omnes"}
        onClick={() => applyBrand(brand === "neutral" ? "omnes" : "neutral")}
      >
        <Palette />
        {brand === "neutral" ? "Neutre" : "Omnes"}
      </Button>
    </div>
  );
}
