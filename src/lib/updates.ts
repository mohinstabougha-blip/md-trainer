import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// „Laufend erweitert"-Banner: zeigt, wie viele freigegebene Nutzer-Einreichungen
// zuletzt in die Fragendatenbank übernommen wurden – gesamt, pro Modul und mit
// Datum der letzten Freigabe. Datenbasis sind questions-Zeilen mit
// quelle = 'Nutzereinreichung' (so werden freigegebene Einreichungen angelegt).

const FENSTER_TAGE = 30;
const MIN_FUERS_FENSTER = 5; // sonst auf „zuletzt N" ausweichen
const FALLBACK_ANZAHL = 20;

export type ModulZahl = { modul: string; anzahl: number };

export type UpdateInfo = {
  letzteFreigabe: string; // ISO-Zeitstempel der jüngsten Freigabe
  neuAnzahl: number; // Anzahl im ausgewerteten Zeitraum
  zeitraum: "fenster" | "zuletzt"; // fenster = letzte 30 Tage, zuletzt = jüngste N
  proModul: ModulZahl[]; // absteigend, alle Module mit Treffern
  gesamtFragen: number;
};

async function ladeUpdateInfo(): Promise<UpdateInfo | null> {
  const supabase = createAdminClient();

  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("questions")
      .select("modul, erstellt_am")
      .eq("quelle", "Nutzereinreichung")
      .order("erstellt_am", { ascending: false }),
    supabase.from("questions").select("*", { count: "exact", head: true }),
  ]);

  if (error) throw error;
  const zeilen = data ?? [];
  if (zeilen.length === 0) return null;

  const grenze = Date.now() - FENSTER_TAGE * 86_400_000;
  const imFenster = zeilen.filter((r) => Date.parse(r.erstellt_am) >= grenze);

  const [ausgewertet, zeitraum]: [typeof zeilen, "fenster" | "zuletzt"] =
    imFenster.length >= MIN_FUERS_FENSTER
      ? [imFenster, "fenster"]
      : [zeilen.slice(0, FALLBACK_ANZAHL), "zuletzt"];

  const proModulMap = new Map<string, number>();
  for (const r of ausgewertet) {
    proModulMap.set(r.modul, (proModulMap.get(r.modul) ?? 0) + 1);
  }

  return {
    letzteFreigabe: zeilen[0].erstellt_am,
    neuAnzahl: ausgewertet.length,
    zeitraum,
    proModul: [...proModulMap.entries()]
      .map(([modul, anzahl]) => ({ modul, anzahl }))
      .sort((a, b) => b.anzahl - a.anzahl || a.modul.localeCompare(b.modul, "de")),
    gesamtFragen: count ?? 0,
  };
}

// Stündlich cachen; nach einer Freigabe im Adminbereich per revalidateTag("updates")
// sofort auffrischen.
export const getUpdateInfo = unstable_cache(ladeUpdateInfo, ["update-info"], {
  revalidate: 3600,
  tags: ["updates"],
});
