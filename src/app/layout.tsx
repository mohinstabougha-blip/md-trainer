import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
