// Fortschritt eines nicht angemeldeten Besuchers ("Gast"): lebt ausschließlich
// im localStorage des Browsers, geht nie an den Server. Angemeldete Nutzer
// nutzen stattdessen die results-Tabelle (siehe lib/fortschritt.ts).

import type { Bewertung } from "@/lib/bewertung-types";

const KEY = "kp_gast_fortschritt_v1";

type GastEintrag = { bewertung: Bewertung; ts: number };
type GastDaten = Record<number, GastEintrag>;

function lesen(): GastDaten {
  if (typeof window === "undefined") return {};
  try {
    const roh = window.localStorage.getItem(KEY);
    if (!roh) return {};
    const parsed = JSON.parse(roh);
    return parsed && typeof parsed === "object" ? (parsed as GastDaten) : {};
  } catch {
    return {};
  }
}

function schreiben(daten: GastDaten): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(daten));
  } catch {
    // Privater Modus / Speicher voll — Fortschritt ist für Gäste ohnehin
    // "best effort", also still schlucken.
  }
}

/** Letzte Selbsteinschätzung je Frage (frageId -> Bewertung). */
export function getGastBewertungen(): Record<number, Bewertung> {
  const daten = lesen();
  const map: Record<number, Bewertung> = {};
  for (const [id, eintrag] of Object.entries(daten)) {
    if (eintrag && typeof eintrag.bewertung === "string") {
      map[Number(id)] = eintrag.bewertung;
    }
  }
  return map;
}

/** Selbsteinschätzung des Gastes zu einer Frage merken (überschreibt die alte). */
export function setGastBewertung(frageId: number, bewertung: Bewertung): void {
  const daten = lesen();
  daten[frageId] = { bewertung, ts: Date.now() };
  schreiben(daten);
}
