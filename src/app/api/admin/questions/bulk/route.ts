import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Sammel-Änderung mehrerer Fragen auf einmal. Aktuell nur das Modul-Feld
// (Fragen einem anderen Modul zuordnen bzw. ein Modul umbenennen).
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);

  const ids: number[] = Array.isArray(body?.ids)
    ? body.ids.filter((x: unknown): x is number => Number.isInteger(x))
    : [];
  const modul = typeof body?.modul === "string" ? body.modul.trim() : "";

  if (ids.length === 0) {
    return NextResponse.json({ error: "Keine Fragen ausgewählt" }, { status: 400 });
  }
  if (ids.length > 5000) {
    return NextResponse.json({ error: "Zu viele Fragen auf einmal (max. 5000)" }, { status: 400 });
  }
  if (!modul) {
    return NextResponse.json({ error: "Modulname fehlt" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("questions")
    .update({ modul })
    .in("id", ids)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ aktualisiert: data?.length ?? 0 });
}
