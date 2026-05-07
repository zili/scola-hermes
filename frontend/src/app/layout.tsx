import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scuila - Gestion Scolaire",
  description: "Système de Gestion Scolaire - Gestion des étudiants, enseignants, absences et résultats",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}