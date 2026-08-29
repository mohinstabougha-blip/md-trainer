import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TABELLE: Record<string, string> = {
  angebot: "angebote",
  nachricht: "angebot_nachrichten",
  kommentar: "angebot_kommentare",
  antwort_kommentar: "antwort_kommentare",
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const aktion = body?.aktion;

  if (aktion !== "freigeben" && aktion !== "loeschen") {
    return NextResponse.json({ error: "ungültige aktion" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: meldung, error: meldungError } = await supabase
    .from("meldungen")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (meldungError || !meldung) {
    return NextResponse.json({ error: "Meldung nicht gefunden" }, { status: 404 });
  }

  const tabelle = TABELLE[meldung.inhalt_typ];

  if (aktion === "freigeben") {
    const { error } = await supabase
      .from(tabelle)
      .update({ versteckt: false })
      .eq("id", meldung.inhalt_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from(tabelle).delete().eq("id", meldung.inhalt_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Alle offenen Meldungen zu genau diesem Inhalt zusammen abschließen
  // (mehrere Nutzer könnten dasselbe gemeldet haben).
  const { error: updateError } = await supabase
    .from("meldungen")
    .update({ status: "erledigt" })
    .eq("inhalt_typ", meldung.inhalt_typ)
    .eq("inhalt_id", meldung.inhalt_id)
    .eq("status", "offen");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
