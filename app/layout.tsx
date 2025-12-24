// /app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Swap pour éviter le texte invisible au chargement
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Configuration Viewport pour mobile (essentiel pour les agents sur terrain avec tablette/téléphone)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Empêche le zoom accidentel sur les formulaires
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "La Poste RDC – Système de Gestion Intégré",
    template: "%s | La Poste RDC",
  },
  description: "Plateforme officielle de gestion des opérations postales, logistiques et financières de la République Démocratique du Congo.",
  applicationName: "Poste RDC ERP",
  authors: [{ name: "Direction Technique Poste RDC" }],
  keywords: ["Poste", "RDC", "Logistique", "Colis", "Suivi", "ERP"],
  robots: {
    index: false, // Sécurité: On ne veut pas que Google indexe le dashboard interne
    follow: false,
  },
  icons: {
    icon: "/favicon.ico", // Assure-toi d'avoir un favicon pro
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}