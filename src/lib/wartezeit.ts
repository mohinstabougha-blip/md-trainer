import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type WartezeitDurchschnitt = {
  antragBisRechnungTage: number | null;
  antragBisRechnungAnzahl: number;
  rechnungBisTerminTage: number | null;
  rechnungBisTerminAnzahl: number;
  gesamtMeldungen: number;
};

async function ladeWartezeitDurchschnitt(): Promise<WartezeitDurchschnitt> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("wartezeit_durchschnitt").select("*").single();
  if (error) throw error;

  return {
    antragBisRechnungTage: data.antrag_bis_rechnung_tage,
    antragBisRechnungAnzahl: data.antrag_bis_rechnung_anzahl ?? 0,
    rechnungBisTerminTage: data.rechnung_bis_termin_tage,
    rechnungBisTerminAnzahl: data.rechnung_bis_termin_anzahl ?? 0,
    gesamtMeldungen: data.gesamt_meldungen ?? 0,
  };
}

// Nicht bei jedem Seitenaufruf neu über alle Nutzer berechnen: 1x pro Stunde
// cachen, plus manuelles revalidateTag("wartezeit") nach einer neuen Meldung.
export const getWartezeitDurchschnitt = unstable_cache(
  ladeWartezeitDurchschnitt,
  ["wartezeit-durchschnitt"],
  { revalidate: 3600, tags: ["wartezeit"] }
);

function tageZuMonaten(tage: number): string {
  const monate = Math.round((tage / 30.44) * 10) / 10;
  return monate.toLocaleString("de-DE");
}

/** Kompakter Gesamtwert für das Badge in der oberen Leiste (z.B. "6,5 Mon."). */
export function formatiereWartezeitBadge(d: WartezeitDurchschnitt): string {
  if (d.antragBisRechnungTage === null && d.rechnungBisTerminTage === null) {
    return "–";
  }
  const gesamtTage = (d.antragBisRechnungTage ?? 0) + (d.rechnungBisTerminTage ?? 0);
  return `${tageZuMonaten(gesamtTage)} Mon.`;
}

export function formatiereWartezeitText(d: WartezeitDurchschnitt): string {
  if (d.gesamtMeldungen === 0) {
    return "Noch keine Wartezeit-Meldungen vorhanden.";
  }

  const teile: string[] = [];
  if (d.antragBisRechnungTage !== null) {
    teile.push(`Antrag → Rechnung ca. ${tageZuMonaten(d.antragBisRechnungTage)} Monate`);
  }
  if (d.rechnungBisTerminTage !== null) {
    teile.push(`Rechnung → Prüfungstermin ca. ${tageZuMonaten(d.rechnungBisTerminTage)} Monate`);
  }

  if (teile.length === 0) {
    return `Noch nicht genug Daten für eine Schätzung (${d.gesamtMeldungen} Meldung${d.gesamtMeldungen === 1 ? "" : "en"}).`;
  }

  return `Ø Wartezeit aktuell: ${teile.join(", ")} (basierend auf ${d.gesamtMeldungen} Meldung${d.gesamtMeldungen === 1 ? "" : "en"})`;
}
