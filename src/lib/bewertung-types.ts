// Reine Typdefinitionen für die (Selbst-)Bewertung von Übungsantworten.
// Bewusst ohne jede Anthropic/KI-Abhängigkeit — die App bewertet Nutzerantworten
// nicht mehr per KI, sondern per Selbsteinschätzung des Nutzers.

export type Bewertung = "richtig" | "teilweise" | "falsch";

export type KursStat = {
  modul: string;
  kurs: string;
  richtig: number;
  teilweise: number;
  falsch: number;
};

export type KursEintrag = { modul: string; kurs: string; text: string };
