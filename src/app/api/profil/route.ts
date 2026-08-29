import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const anzeigename = body?.anzeigename;

  if (typeof anzeigename !== "string" || anzeigename.trim() === "") {
    return NextResponse.json({ error: "Anzeigename fehlt" }, { status: 400 });
  }
  if (anzeigename.trim().length > 40) {
    return NextResponse.json({ error: "Anzeigename zu lang (max. 40 Zeichen)" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  }

  const { error } = await supabase
    .from("profile")
    .upsert({ user_id: user.id, anzeigename: anzeigename.trim() }, { onConflict: "user_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
