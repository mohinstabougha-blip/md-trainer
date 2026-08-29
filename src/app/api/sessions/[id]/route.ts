import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GUELTIGE_STATI = ["abgeschlossen", "abgebrochen"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (!GUELTIGE_STATI.includes(status)) {
    return NextResponse.json({ error: "ungültiger status" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  }

  const { error } = await supabase
    .from("sessions")
    .update({ status, beendet_am: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
