import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GUELTIGE_BEWERTUNGEN = ["richtig", "teilweise", "falsch"];

// Speichert die Selbsteinschätzung des Nutzers zu seiner eigenen Antwort
// (kein KI-Aufruf — der Nutzer vergleicht selbst mit der Musterantwort und
// wählt richtig/teilweise/falsch).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const questionId = body?.questionId;
  const antwort = body?.antwort;
  const sessionId = body?.sessionId;
  const bewertung = body?.bewertung;

  if (!questionId || typeof questionId !== "number") {
    return NextResponse.json({ error: "questionId fehlt" }, { status: 400 });
  }
  if (typeof antwort !== "string" || antwort.trim() === "") {
    return NextResponse.json({ error: "antwort fehlt" }, { status: 400 });
  }
  if (typeof sessionId !== "string" || sessionId.trim() === "") {
    return NextResponse.json({ error: "sessionId fehlt" }, { status: 400 });
  }
  if (typeof bewertung !== "string" || !GUELTIGE_BEWERTUNGEN.includes(bewertung)) {
    return NextResponse.json({ error: "bewertung ungültig" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  }

  const { error } = await supabase.from("results").insert({
    user_id: user.id,
    question_id: questionId,
    bewertung,
    nutzer_antwort: antwort,
    session_id: sessionId,
  });

  if (error) {
    console.error("Speichern der Selbstbewertung fehlgeschlagen:", error);
    return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
