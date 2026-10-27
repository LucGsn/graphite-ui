import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "graphite-ui — vitrine",
  description: "Design system neutre : tokens, composants et variantes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
