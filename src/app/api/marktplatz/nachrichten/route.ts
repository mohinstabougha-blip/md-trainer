import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const angebotId = body?.angebotId;
  const anUserId = body?.anUserId;
  const text = body?.text;

  if (!angebotId || typeof angebotId !== "number") {
    return NextResponse.json({ error: "angebotId fehlt" }, { status: 400 });
  }
  if (typeof anUserId !== "string" || anUserId.trim() === "") {
    return NextResponse.json({ error: "anUserId fehlt" }, { status: 400 });
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
  if (user.id === anUserId) {
    return NextResponse.json({ error: "Nachricht an dich selbst nicht möglich" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("angebot_nachrichten")
    .insert({
      angebot_id: angebotId,
      user_id_von: user.id,
      user_id_an: anUserId,
      text: text.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
