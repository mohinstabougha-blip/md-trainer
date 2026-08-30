import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile, clientIp } from "@/lib/turnstile";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const angebotId = body?.angebotId;
  const text = body?.text;

  if (!(await verifyTurnstile(body?.turnstileToken, clientIp(request)))) {
    return NextResponse.json({ error: "Bot-Schutz fehlgeschlagen" }, { status: 403 });
  }

  if (!angebotId || typeof angebotId !== "number") {
    return NextResponse.json({ error: "angebotId fehlt" }, { status: 400 });
  }
  if (typeof text !== "string" || text.trim() === "") {
    return NextResponse.json({ error: "text fehlt" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("angebot_kommentare")
    .insert({ angebot_id: angebotId, user_id: user.id, text: text.trim() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
