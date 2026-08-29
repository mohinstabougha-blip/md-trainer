import { createClient } from "@/lib/supabase/server";

export type ModulKurs = {
  modul: string;
  kurs: string;
};

export type FrageMeta = {
  id: number;
  modul: string;
  kurs: string;
  teil: number;
};

/** Für den Start-Screen: Modul/Kurs/Teil aller Fragen, um Modul-Liste, Kurs-Liste
 *  und "X Fragen verfügbar"-Zähler client-seitig ohne weitere Anfragen zu bauen. */
export async function getAlleFragenMeta(): Promise<FrageMeta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, modul, kurs, teil")
    .order("modul", { ascending: true })
    .order("kurs", { ascending: true });

  if (error) throw error;
  return data;
}

export type Teil = "1" | "2" | "3" | "voll";
export type Sortierung = "zufaellig" | "neueste" | "aelteste" | "haeufigste";
export type FortschrittFilter = "alle" | "nie_gesehen" | "schon_gesehen" | "falsch_beantwortet";

export type SessionFilter =
  | { modus: "zufaellig" }
  | { modus: "modul"; module: string[] }
  | { modus: "kurs"; modul: string; kurs: string }
  | { modus: "kurse"; kurse: ModulKurs[] };

export type SessionQuestion = {
  id: number;
  modul: string;
  kurs: string;
  teil: number;
  frage: string;
  bild_frage_url: string | null;
  hilfe_hinweis: string | null;
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function getSessionQuestions(
  filter: SessionFilter,
  teil: Teil,
  sortierung: Sortierung = "zufaellig",
  fortschrittFilter: FortschrittFilter = "alle",
  userId?: string
): Promise<SessionQuestion[]> {
  const supabase = await createClient();
  let query = supabase
    .from("questions")
    .select(
      "id, modul, kurs, teil, frage, bild_frage_url, hilfe_hinweis, erstellt_am, haeufigkeit"
    );

  if (filter.modus === "modul") {
    query = query.in("modul", filter.module);
  } else if (filter.modus === "kurs") {
    query = query.eq("modul", filter.modul).eq("kurs", filter.kurs);
  }

  if (teil !== "voll") {
    query = query.eq("teil", Number(teil));
  }

  const { data, error } = await query;
  if (error) throw error;

  let pool = data ?? [];

  // Mehrere spezifische Kurse (z.B. "Diese Themen nochmal üben"): im JS statt
  // per PostgREST-.or() filtern, da Kursnamen Klammern/Slashes enthalten
  // können, die als Filter-Syntax escaped werden müssten.
  if (filter.modus === "kurse") {
    const zielSet = new Set(filter.kurse.map((k) => `${k.modul} ${k.kurs}`));
    pool = pool.filter((q) => zielSet.has(`${q.modul} ${q.kurs}`));
  }

  // E4: Filter nach eigenem Bearbeitungsstand, kombinierbar mit modus/teil.
  // Zählt nur der letzte results-Eintrag des Nutzers pro Frage.
  if (fortschrittFilter !== "alle" && userId) {
    const { data: ergebnisse, error: ergebnisFehler } = await supabase
      .from("results")
      .select("question_id, bewertung, erstellt_am")
      .eq("user_id", userId)
      .order("erstellt_am", { ascending: true });
    if (ergebnisFehler) throw ergebnisFehler;

    const letzteBewertung = new Map<number, string>();
    for (const r of ergebnisse ?? []) {
      letzteBewertung.set(r.question_id, r.bewertung);
    }

    pool = pool.filter((q) => {
      const bewertung = letzteBewertung.get(q.id);
      if (fortschrittFilter === "nie_gesehen") return !bewertung;
      if (fortschrittFilter === "schon_gesehen") return !!bewertung;
      if (fortschrittFilter === "falsch_beantwortet") {
        return bewertung === "falsch" || bewertung === "teilweise";
      }
      return true;
    });
  }

  let sortiert;
  switch (sortierung) {
    case "neueste":
      sortiert = [...pool].sort(
        (a, b) => new Date(b.erstellt_am).getTime() - new Date(a.erstellt_am).getTime()
      );
      break;
    case "aelteste":
      sortiert = [...pool].sort(
        (a, b) => new Date(a.erstellt_am).getTime() - new Date(b.erstellt_am).getTime()
      );
      break;
    case "haeufigste":
      sortiert = [...pool].sort((a, b) => b.haeufigkeit - a.haeufigkeit);
      break;
    default:
      sortiert = shuffle(pool);
  }

  // Vollsimulation: Teil 1, dann 2, dann 3 nacheinander (stabil, behält die
  // oben gewählte Sortierung innerhalb jedes Teils bei).
  if (teil === "voll") {
    sortiert.sort((a, b) => a.teil - b.teil);
  }

  return sortiert.map((q) => ({
    id: q.id,
    modul: q.modul,
    kurs: q.kurs,
    teil: q.teil,
    frage: q.frage,
    bild_frage_url: q.bild_frage_url,
    hilfe_hinweis: q.hilfe_hinweis,
  }));
}
