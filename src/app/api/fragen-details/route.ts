import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Liefert Frage + Musterantwort zu einer Liste von IDs – für die
// Favoriten-Ansicht "mit Antworten". questions ist öffentlich lesbar
// (RLS questions_select_all), funktioniert also auch für Gäste.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const ids: unknown = body?.ids;

  if (!Array.isArray(ids) || ids.some((x) => typeof x !== "number")) {
    return NextResponse.json({ error: "ids fehlt" }, { status: 400 });
  }
  const idListe = (ids as number[]).slice(0, 500);
  if (idListe.length === 0) return NextResponse.json({ fragen: [] });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, modul, kurs, teil, frage, musterantwort, hilfe_hinweis, bild_frage_url, bild_antwort_url"
    )
    .in("id", idListe);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Reihenfolge der übergebenen IDs beibehalten (zuletzt favorisiert zuerst).
  const rang = new Map(idListe.map((id, i) => [id, i]));
  const fragen = (data ?? []).sort(
    (a, b) => (rang.get(a.id) ?? 0) - (rang.get(b.id) ?? 0)
  );

  return NextResponse.json({ fragen });
}
