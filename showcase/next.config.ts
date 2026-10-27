import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  // Racine du dépôt : le showcase importe « graphite-ui » depuis ../src (alias tsconfig paths).
  turbopack: { root: path.join(__dirname, "..") },
};

export default config;
