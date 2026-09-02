import type { AngebotKategorie } from "@/lib/marktplatz-types";

// Klar gekennzeichnete Beispiel-Angebote - KEINE echten Inserate, keine echten
// Nutzerkonten. Sie zeigen neuen Nutzern nur, wie der Marktplatz gedacht ist,
// solange es wenige echte Angebote gibt. Rendern ueber
// components/marktplatz/beispiel-angebote.tsx (nicht klickbar, ohne Kontakt).

export type BeispielAngebot = {
  kategorie: AngebotKategorie;
  titel: string;
  beschreibung: string;
  preis?: string;
};

export const MARKTPLATZ_BEISPIELE: BeispielAngebot[] = [
  {
    kategorie: "buch",
    titel: "Vorbereitungsbücher Innere abzugeben (80 Fälle, Step-by-Step)",
    beschreibung:
      "Nach bestandener KP gebe ich meine Bücher weiter: 80 Fälle Innere Medizin, Step-by-Step Innere und die M3-Lernkarten. Selbstabholung Heidelberg/Mannheim oder Versand gegen Porto.",
  },
  {
    kategorie: "buch",
    titel: "Staatsexamens-Sammlung (M3) komplett",
    beschreibung:
      "Kompletter Bücherstapel für die schriftliche Vorbereitung, u. a. Endspurt-Lernkarten und Kurzlehrbücher. Zusammen abzugeben, kostenlos.",
  },
  {
    kategorie: "simulation_kostenlos",
    titel: "Simulationspartner:in gesucht – UB Heidelberg",
    beschreibung:
      "Treffe mich regelmäßig in der Universitätsbibliothek Heidelberg, um Patientenvorstellungen und Teil-2-Fragen zu üben. Feste Termine legen wir per Nachricht fest.",
  },
  {
    kategorie: "simulation_kostenlos",
    titel: "Nur Kardiologie simulieren – online, abends",
    beschreibung:
      "Möchte gezielt Kardiologie durchgehen: EKG-Befundung, ACS-Vorgehen, Herzinsuffizienz, Vorhofflimmern. Online, ca. 45 Minuten pro Runde.",
  },
  {
    kategorie: "simulation_kostenlos",
    titel: "Lerngruppe Baden-Württemberg – 2× pro Woche",
    beschreibung:
      "Kleine feste Lerngruppe für die KP-Vorbereitung, gemischte Fächer. Zweimal pro Woche online, jede/r stellt reihum Fälle vor.",
  },
  {
    kategorie: "kurs_kostenpflichtig",
    titel: "1:1 KP-Simulation mit schriftlichem Feedback",
    beschreibung:
      "Biete nach bestandener KP strukturierte Prüfungssimulationen an: realistischer Ablauf, Fragen aus mehreren Fächern, danach schriftliches Feedback zu Stärken und Lücken.",
    preis: "25 €/Sitzung",
  },
  {
    kategorie: "sonstiges",
    titel: "Fragen zur KP-Vorbereitung? Ich helfe weiter",
    beschreibung:
      "Habe die KP hinter mir und beantworte Fragen zu Ablauf, Anmeldung, Wartezeiten und einzelnen Kursen (Innere, Chirurgie, Notfallmedizin, Pharmakologie). Einfach hier kommentieren.",
  },
  {
    kategorie: "sonstiges",
    titel: "Treffen zum Simulieren in Heidelberg – Termine im Kommentar",
    beschreibung:
      "Organisiere lockere Übungstreffen zum Simulieren (Uni-Campus / Bibliothek Heidelberg). Wer mitmachen will, schreibt einen Kommentar mit möglichen Terminen.",
  },
];
