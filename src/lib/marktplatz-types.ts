// Reine Typen/Konstanten ohne serverseitige Abhängigkeiten (next/headers) —
// sicher auch in Client Components importierbar. Datenzugriffs-Funktionen
// liegen in lib/marktplatz.ts (server-only).

export type AngebotKategorie = "simulation_kostenlos" | "kurs_kostenpflichtig" | "buch" | "sonstiges";
export type AngebotStatus = "aktiv" | "inaktiv";

export const KATEGORIE_LABEL: Record<AngebotKategorie, string> = {
  simulation_kostenlos: "Simulationspartner (kostenlos)",
  kurs_kostenpflichtig: "Kurs (kostenpflichtig)",
  buch: "Buch",
  sonstiges: "Sonstiges",
};

export type Angebot = {
  id: number;
  user_id: string;
  kategorie: AngebotKategorie;
  titel: string;
  beschreibung: string;
  preis: string | null;
  status: AngebotStatus;
  erstellt_am: string;
};

export type Kommentar = {
  id: number;
  angebot_id: number;
  user_id: string;
  text: string;
  erstellt_am: string;
};

export type Nachricht = {
  id: number;
  angebot_id: number;
  user_id_von: string;
  user_id_an: string;
  text: string;
  gelesen: boolean;
  erstellt_am: string;
};
