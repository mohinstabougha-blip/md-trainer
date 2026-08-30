import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Deckt die Musterantwort zu einer Frage auf, NACHDEM der Nutzer seine eigene
// Antwort abgeschickt hat — bewusst kein KI-Aufruf mehr (Selbstbewertung statt
// KI-Korrektur). Die eigentliche Bewertung trägt der Nutzer selbst über
// /api/selbstbewertung ein.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const questionId = body?.questionId;

  if (!questionId || typeof questionId !== "number") {
    return NextResponse.json({ error: "questionId fehlt" }, { status: 400 });
  }

  // Auch für Gäste zugänglich: questions ist ohnehin öffentlich lesbar (RLS
  // questions_select_all), die Musterantwort wird erst nach dem Umdrehen der
  // Karteikarte nachgeladen.
  const supabase = await createClient();

  const { data: question, error } = await supabase
    .from("questions")
    .select("musterantwort, bild_antwort_url")
    .eq("id", questionId)
    .single();

  if (error || !question) {
    return NextResponse.json({ error: "Frage nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    musterantwort: question.musterantwort,
    bildAntwortUrl: question.bild_antwort_url,
  });
}
