import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile, clientIp } from "@/lib/turnstile";

const GUELTIGE_TYPEN = [
  "frage_fehlerhaft",
  "antwort_fehlerhaft",
  "bild_fehlt_oder_falsch",
  "sonstiges",
] as const;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const questionId = body?.questionId;
  const typ = body?.typ;
  const kommentar = body?.kommentar;

  if (!(await verifyTurnstile(body?.turnstileToken, clientIp(request)))) {
    return NextResponse.json({ error: "Bot-Schutz fehlgeschlagen" }, { status: 403 });
  }

  if (!questionId || typeof questionId !== "number") {
    return NextResponse.json({ error: "questionId fehlt" }, { status: 400 });
  }
  if (!GUELTIGE_TYPEN.includes(typ)) {
    return NextResponse.json({ error: "ungültiger typ" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  }

  const { error } = await supabase.from("feedback").insert({
    question_id: questionId,
    user_id: user.id,
    typ,
    kommentar: typeof kommentar === "string" && kommentar.trim() ? kommentar.trim() : null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
