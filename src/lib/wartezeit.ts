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

// ── Monatsverlauf (Balkendiagramm im Detail-Dialog) ──────────────────────────
// Statt eines Gesamtdurchschnitts über alle Meldungen: pro Kalendermonat der
// Durchschnitt genau der Meldungen dieses Monats. Bucket-Monat = Monat des
// jeweiligen Ereignisses (Rechnungsdatum bzw. Prüfungsdatum).

export type WartezeitMonat = {
  key: string; // "2026-08"
  label: string; // "8/26"
  antragBisRechnungTage: number | null;
  antragBisRechnungAnzahl: number;
  antragBisPruefungTage: number | null;
  antragBisPruefungAnzahl: number;
};

// Einzelne (anonyme) Meldung als Beispiel für die Zeitleiste – nur die drei
// Datumsangaben, kein Bezug zu einem Nutzer.
export type WartezeitBeispiel = {
  antrag: string; // ISO "YYYY-MM-DD"
  rechnung: string | null;
  pruefung: string | null;
};

export type WartezeitVerlauf = {
  monate: WartezeitMonat[]; // genau 3, alt → neu
  beispiele: WartezeitBeispiel[]; // bis zu 3, jüngste zuerst
  meldungenImZeitraum: number;
};

type WartezeitZeile = {
  antrag_datum: string;
  rechnung_datum: string | null;
  pruefungsdatum: string | null;
  rechnung_erhalten: boolean;
  termin_erhalten: boolean;
};

function monatsLabel(key: string): string {
  const [jahr, monat] = key.split("-");
  return `${Number(monat)}/${jahr.slice(2)}`;
}

function tageZwischen(vonIso: string, bisIso: string): number {
  return Math.round((Date.parse(bisIso) - Date.parse(vonIso)) / 86_400_000);
}

async function ladeWartezeitVerlauf(): Promise<WartezeitVerlauf> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wartezeit_meldungen")
    .select("antrag_datum, rechnung_datum, pruefungsdatum, rechnung_erhalten, termin_erhalten");
  if (error) throw error;
  const zeilen = (data ?? []) as WartezeitZeile[];

  const jetzt = new Date();
  const fenster = [2, 1, 0].map((zurueck) => {
    const d = new Date(jetzt.getFullYear(), jetzt.getMonth() - zurueck, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: monatsLabel(key) };
  });
  const fensterKeys = new Set(fenster.map((f) => f.key));

  type Summe = { summe: number; anzahl: number };
  const rechnung = new Map<string, Summe>();
  const pruefung = new Map<string, Summe>();
  const meldungsIndizes = new Set<number>();

  const addieren = (map: Map<string, Summe>, key: string, tage: number) => {
    const e = map.get(key) ?? { summe: 0, anzahl: 0 };
    e.summe += tage;
    e.anzahl += 1;
    map.set(key, e);
  };

  zeilen.forEach((z, i) => {
    if (z.rechnung_erhalten && z.rechnung_datum) {
      const key = z.rechnung_datum.slice(0, 7);
      if (fensterKeys.has(key)) {
        addieren(rechnung, key, tageZwischen(z.antrag_datum, z.rechnung_datum));
        meldungsIndizes.add(i);
      }
    }
    if (z.termin_erhalten && z.pruefungsdatum) {
      const key = z.pruefungsdatum.slice(0, 7);
      if (fensterKeys.has(key)) {
        addieren(pruefung, key, tageZwischen(z.antrag_datum, z.pruefungsdatum));
        meldungsIndizes.add(i);
      }
    }
  });

  const monate: WartezeitMonat[] = fenster.map((f) => {
    const r = rechnung.get(f.key);
    const p = pruefung.get(f.key);
    return {
      key: f.key,
      label: f.label,
      antragBisRechnungTage: r ? r.summe / r.anzahl : null,
      antragBisRechnungAnzahl: r?.anzahl ?? 0,
      antragBisPruefungTage: p ? p.summe / p.anzahl : null,
      antragBisPruefungAnzahl: p?.anzahl ?? 0,
    };
  });

  // Bis zu drei konkrete Beispiel-Meldungen aus dem Zeitfenster: Rechnung liegt
  // vor, Rechnungs- oder Prüfungsmonat fällt ins Fenster, jüngste zuerst.
  const beispiele: WartezeitBeispiel[] = zeilen
    .filter((z) => {
      if (!z.rechnung_erhalten || !z.rechnung_datum) return false;
      const rechnungImFenster = fensterKeys.has(z.rechnung_datum.slice(0, 7));
      const pruefungImFenster =
        z.termin_erhalten && z.pruefungsdatum && fensterKeys.has(z.pruefungsdatum.slice(0, 7));
      return rechnungImFenster || pruefungImFenster;
    })
    .sort((a, b) => {
      const aKey = a.pruefungsdatum ?? a.rechnung_datum ?? a.antrag_datum;
      const bKey = b.pruefungsdatum ?? b.rechnung_datum ?? b.antrag_datum;
      return bKey.localeCompare(aKey);
    })
    .slice(0, 3)
    .map((z) => ({
      antrag: z.antrag_datum,
      rechnung: z.rechnung_datum,
      pruefung: z.termin_erhalten ? z.pruefungsdatum : null,
    }));

  return { monate, beispiele, meldungenImZeitraum: meldungsIndizes.size };
}

export const getWartezeitVerlauf = unstable_cache(ladeWartezeitVerlauf, ["wartezeit-verlauf"], {
  revalidate: 3600,
  tags: ["wartezeit"],
});

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
