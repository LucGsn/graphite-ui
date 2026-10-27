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

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    if (brand === "neutral") delete root.dataset.brand;
    else root.dataset.brand = brand;
  }, [theme, brand]);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        aria-pressed={theme === "light"}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? <Moon /> : <Sun />}
        {theme === "dark" ? "Sombre" : "Clair"}
      </Button>
      <Button
        size="sm"
        aria-pressed={brand === "omnes"}
        onClick={() => setBrand(brand === "neutral" ? "omnes" : "neutral")}
      >
        <Palette />
        {brand === "neutral" ? "Neutre" : "Omnes"}
      </Button>
    </div>
  );
}
