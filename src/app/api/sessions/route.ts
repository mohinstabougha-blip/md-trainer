import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id = body?.id;
  const modus = body?.modus;
  const filterWerte = body?.filterWerte;

  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "id fehlt" }, { status: 400 });
  }
  if (typeof modus !== "string" || !modus) {
    return NextResponse.json({ error: "modus fehlt" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  }

  const { error } = await supabase.from("sessions").insert({
    id,
    user_id: user.id,
    modus,
    filter_werte: filterWerte ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
