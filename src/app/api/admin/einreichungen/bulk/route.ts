import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Sammel-Aktionen für die Einreichungs-Warteschlange:
//  - "modul":     Modul mehrerer Einreichungen auf einmal ändern
//  - "freigeben": mehrere Einreichungen mit ihren gespeicherten Werten in die
//                 Fragendatenbank übernehmen und auf status='freigegeben' setzen
//  - "ablehnen":  mehrere Einreichungen ablehnen (optional mit Kommentar)
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const aktion = body?.aktion;

  const ids: number[] = Array.isArray(body?.ids)
    ? body.ids.filter((x: unknown): x is number => Number.isInteger(x))
    : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "Keine Einreichungen ausgewählt" }, { status: 400 });
  }
  if (ids.length > 2000) {
    return NextResponse.json({ error: "Zu viele Einreichungen auf einmal (max. 2000)" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (aktion === "modul") {
    const modul = typeof body?.modul === "string" ? body.modul.trim() : "";
    if (!modul) {
      return NextResponse.json({ error: "Modulname fehlt" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("einreichungen")
      .update({ modul })
      .eq("status", "offen")
      .in("id", ids)
      .select("id");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ aktualisiert: data?.length ?? 0 });
  }

  if (aktion === "ablehnen") {
    const adminKommentar =
      typeof body?.adminKommentar === "string" ? body.adminKommentar.trim() || null : null;
    const { data, error } = await supabase
      .from("einreichungen")
      .update({ status: "abgelehnt", admin_kommentar: adminKommentar })
      .eq("status", "offen")
      .in("id", ids)
      .select("id");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ abgelehnt: data?.length ?? 0 });
  }

  if (aktion === "freigeben") {
    const { data: rows, error: ladeFehler } = await supabase
      .from("einreichungen")
      .select("id, modul, kurs, teil, frage, antwort_vorschlag, hilfe_hinweis, bild_frage_url, bild_antwort_url")
      .eq("status", "offen")
      .in("id", ids);
    if (ladeFehler) {
      return NextResponse.json({ error: ladeFehler.message }, { status: 500 });
    }

    const uebersprungen: { id: number; grund: string }[] = [];
    const fragen: Record<string, unknown>[] = [];
    const freizugebendeIds: number[] = [];

    for (const r of rows ?? []) {
      if (
        !r.modul ||
        !r.kurs ||
        ![1, 2, 3].includes(r.teil as number) ||
        !r.frage ||
        !r.antwort_vorschlag
      ) {
        uebersprungen.push({ id: r.id, grund: "Pflichtfelder fehlen (Modul/Kurs/Teil/Frage/Musterantwort)" });
        continue;
      }
      fragen.push({
        modul: String(r.modul).trim(),
        kurs: String(r.kurs).trim(),
        teil: r.teil,
        frage: String(r.frage).trim(),
        musterantwort: String(r.antwort_vorschlag).trim(),
        hilfe_hinweis: r.hilfe_hinweis ? String(r.hilfe_hinweis).trim() : null,
        bild_frage_url: r.bild_frage_url || null,
        bild_antwort_url: r.bild_antwort_url || null,
        quelle: "Nutzereinreichung",
      });
      freizugebendeIds.push(r.id);
    }

    if (fragen.length > 0) {
      const { error: insertFehler } = await supabase.from("questions").insert(fragen);
      if (insertFehler) {
        return NextResponse.json({ error: insertFehler.message }, { status: 500 });
      }
      const { error: updateFehler } = await supabase
        .from("einreichungen")
        .update({ status: "freigegeben" })
        .in("id", freizugebendeIds);
      if (updateFehler) {
        return NextResponse.json({ error: updateFehler.message }, { status: 500 });
      }
    }

    return NextResponse.json({ freigegeben: freizugebendeIds.length, uebersprungen });
  }

  return NextResponse.json({ error: "ungültige aktion" }, { status: 400 });
}
