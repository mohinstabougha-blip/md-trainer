import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ConsentBanner } from "@/components/consent-banner";
import { MetaPixel } from "@/components/meta-pixel";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KP Baden – Übungsfragen für die Kenntnisprüfung",
    template: "%s · KP Baden",
  },
  description:
    "Kostenloser Active-Recall-Trainer für die ärztliche Kenntnisprüfung: Prüfungsfragen aus echten Protokollen, Karteikarten, Fortschritt, Marktplatz für Simulationspartner.",
  applicationName: "KP Baden",
  keywords: [
    "Kenntnisprüfung",
    "KP",
    "Gleichwertigkeitsverfahren",
    "Approbation",
    "Prüfungsfragen",
    "Active Recall",
    "Karteikarten",
    "Fachsprachprüfung",
  ],
  openGraph: {
    type: "website",
    siteName: "KP Baden",
    title: "KP Baden – Übungsfragen für die Kenntnisprüfung",
    description:
      "Kostenloser Active-Recall-Trainer für die ärztliche Kenntnisprüfung. Von einem approbierten Arzt für die Community.",
    url: siteUrl,
    locale: "de_DE",
  },
  twitter: { card: "summary" },
  robots: { index: false, follow: false },
};

// Setzt die .dark-Klasse VOR dem ersten Rendern (blockierendes Inline-Script,
// kein next/script) – sonst blitzt bei Seitenaufruf kurz das helle Layout auf,
// bevor React den gespeicherten Nachtmodus anwenden könnte.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var gespeichert = localStorage.getItem("kp_theme");
    var dunkel = gespeichert
      ? gespeichert === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dunkel);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // Das Inline-Script unten setzt .dark auf diesem Element schon vor der
      // Hydration (siehe THEME_INIT_SCRIPT) – der dadurch entstehende, rein
      // kosmetische className-Unterschied zwischen Server- und Client-Render
      // ist beabsichtigt, React soll ihn nicht als Fehler melden/rückgängig machen.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
        <ConsentBanner />
        <MetaPixel />
      </body>
    </html>
  );
}
