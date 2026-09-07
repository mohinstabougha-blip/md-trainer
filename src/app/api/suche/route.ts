import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Volltext-artige Suche über Frage + Musterantwort. questions ist öffentlich
// lesbar (RLS questions_select_all) -> funktioniert auch für Gäste.
export async function GET(request: Request) {
  const roh = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  const woerter = roh
    .toLowerCase()
    .replace(/[,()*%\\]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .slice(0, 6);

  if (woerter.length === 0) return NextResponse.json({ fragen: [] });

  const supabase = await createClient();
  let query = supabase
    .from("questions")
    .select("id, modul, kurs, teil, frage, musterantwort, hilfe_hinweis, bild_frage_url, bild_antwort_url");

  // Jedes Wort muss in Frage ODER Musterantwort vorkommen (mehrere .or()
  // werden von supabase-js mit UND verknüpft).
  for (const w of woerter) {
    query = query.or(`frage.ilike.%${w}%,musterantwort.ilike.%${w}%`);
  }

  const { data, error } = await query.limit(40);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Relevanz: Treffer im Fragetext zuerst, dann kürzere (= spezifischere) Fragen.
  const phrase = woerter.join(" ");
  const fragen = (data ?? []).sort((a, b) => {
    const af = a.frage.toLowerCase().includes(phrase) ? 0 : 1;
    const bf = b.frage.toLowerCase().includes(phrase) ? 0 : 1;
    if (af !== bf) return af - bf;
    return a.frage.length - b.frage.length;
  });

  return NextResponse.json({ fragen });
}
