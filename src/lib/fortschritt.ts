import { createClient } from "@/lib/supabase/server";
import type { Bewertung } from "@/lib/bewertung-types";

export type ModulFortschritt = {
  modul: string;
  gesamt: number;
  bearbeitet: number;
  richtig: number;
  teilweise: number;
  falsch: number;
};

/** Letzte Bewertung je Frage des Nutzers (question_id -> Bewertung), nur die
 *  jüngste results-Zeile pro Frage zählt, ältere Versuche werden ignoriert. */
async function getLetzteBewertungenProFrage(userId: string): Promise<Map<number, Bewertung>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("results")
    .select("question_id, bewertung, erstellt_am")
    .eq("user_id", userId)
    .order("erstellt_am", { ascending: true });

  if (error) throw error;

  const map = new Map<number, Bewertung>();
  for (const r of data ?? []) {
    map.set(r.question_id, r.bewertung as Bewertung);
  }
  return map;
}

/** Für die Fortschritts-Kreisdiagramme auf der Hauptseite (E3). */
export async function getFortschrittProModul(userId: string): Promise<ModulFortschritt[]> {
  const supabase = await createClient();
  const [{ data: fragen, error }, letzteBewertung] = await Promise.all([
    supabase.from("questions").select("id, modul").order("modul", { ascending: true }),
    getLetzteBewertungenProFrage(userId),
  ]);
  if (error) throw error;

  const map = new Map<string, ModulFortschritt>();
  for (const f of fragen ?? []) {
    const stat = map.get(f.modul) ?? {
      modul: f.modul,
      gesamt: 0,
      bearbeitet: 0,
      richtig: 0,
      teilweise: 0,
      falsch: 0,
    };
    stat.gesamt += 1;
    const bewertung = letzteBewertung.get(f.id);
    if (bewertung) {
      stat.bearbeitet += 1;
      stat[bewertung] += 1;
    }
    map.set(f.modul, stat);
  }

  return [...map.values()].sort((a, b) => a.modul.localeCompare(b.modul, "de"));
}

/** Für die neuen Fortschritts-Filter im Start-Screen (E4): question_id -> Bewertung
 *  als einfaches Objekt, damit es an eine Client-Komponente übergeben werden kann. */
export async function getMeineLetzteBewertungen(
  userId: string
): Promise<Record<number, Bewertung>> {
  const map = await getLetzteBewertungenProFrage(userId);
  return Object.fromEntries(map);
}
