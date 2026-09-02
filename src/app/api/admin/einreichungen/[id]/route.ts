import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const aktion = body?.aktion;

  const supabase = createAdminClient();

  if (aktion === "freigeben") {
    const { modul, kurs, teil, frage, musterantwort, hilfe_hinweis, bild_frage_url, bild_antwort_url } =
      body;
    if (!modul || !kurs || ![1, 2, 3].includes(teil) || !frage || !musterantwort) {
      return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }

    const { error: insertError } = await supabase.from("questions").insert({
      modul: String(modul).trim(),
      kurs: String(kurs).trim(),
      teil,
      frage: String(frage).trim(),
      musterantwort: String(musterantwort).trim(),
      hilfe_hinweis: hilfe_hinweis ? String(hilfe_hinweis).trim() : null,
      bild_frage_url: bild_frage_url || null,
      bild_antwort_url: bild_antwort_url || null,
      quelle: "Nutzereinreichung",
    });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("einreichungen")
      .update({ status: "freigegeben" })
      .eq("id", Number(id));
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    revalidateTag("updates", { expire: 0 });
    return NextResponse.json({ ok: true });
  }

  if (aktion === "ablehnen") {
    const adminKommentar = body?.adminKommentar;
    const { error } = await supabase
      .from("einreichungen")
      .update({
        status: "abgelehnt",
        admin_kommentar: typeof adminKommentar === "string" ? adminKommentar.trim() || null : null,
      })
      .eq("id", Number(id));
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "ungültige aktion" }, { status: 400 });
}
