// Snapshot der gerade laufenden Übungs-Session im localStorage – damit ein
// Nutzer (angemeldet ODER Gast) nach "Zurück zur Hauptseite" oder Fenster-
// schließen genau dort weitermachen kann, wo er aufgehört hat.
//
// Für angemeldete Nutzer landet die eigentliche Selbsteinschätzung zusätzlich
// dauerhaft in der results-Tabelle; dieser Snapshot merkt sich nur Position
// und Fragen-Reihenfolge des aktuellen Durchgangs.

import type { Bewertung } from "@/lib/bewertung-types";

const KEY = "kp_aktive_session_v1";
// Snapshots, die älter sind, werden ignoriert (z.B. Prüfung längst vorbei).
const MAX_ALTER_MS = 1000 * 60 * 60 * 24 * 30;

export type AktiveSessionErgebnis = { modul: string; kurs: string; bewertung: Bewertung };

export type AktiveSession = {
  href: string; // vollständige /session?...-URL zum Fortsetzen (enthält resume=1)
  titel: string; // z.B. "Zufällig" oder "Kardiologie"
  frageIds: number[]; // exakte Reihenfolge dieses Durchgangs
  index: number; // nächste offene Frage (0-basiert)
  ergebnisse: AktiveSessionErgebnis[];
  gesamt: number;
  aktualisiert: number;
};

export function getAktiveSession(): AktiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const roh = window.localStorage.getItem(KEY);
    if (!roh) return null;
    const s = JSON.parse(roh) as AktiveSession;
    if (
      !s ||
      !Array.isArray(s.frageIds) ||
      typeof s.index !== "number" ||
      typeof s.gesamt !== "number" ||
      typeof s.href !== "string"
    ) {
      return null;
    }
    if (Date.now() - (s.aktualisiert ?? 0) > MAX_ALTER_MS) return null;
    return s;
  } catch {
    return null;
  }
}

export function setAktiveSession(s: AktiveSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // privater Modus / Speicher voll – "best effort"
  }
}

export function clearAktiveSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignorieren
  }
}
