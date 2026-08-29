import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const {
    modul,
    kurs,
    teil,
    frage,
    musterantwort,
    bild_frage_url,
    bild_antwort_url,
    quelle,
    haeufigkeit,
    hilfe_hinweis,
  } = body ?? {};

  if (!modul || !kurs || ![1, 2, 3].includes(teil) || !frage || !musterantwort) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("questions")
    .insert({
      modul,
      kurs,
      teil,
      frage,
      musterantwort,
      bild_frage_url: bild_frage_url || null,
      bild_antwort_url: bild_antwort_url || null,
      quelle: quelle || null,
      haeufigkeit: Number.isFinite(haeufigkeit) ? haeufigkeit : 1,
      hilfe_hinweis: hilfe_hinweis || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
