import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile, clientIp } from "@/lib/turnstile";

const GUELTIGE_KATEGORIEN = ["simulation_kostenlos", "kurs_kostenpflichtig", "buch", "sonstiges"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const kategorie = body?.kategorie;
  const titel = body?.titel;
  const beschreibung = body?.beschreibung;
  const preis = body?.preis;

  if (!(await verifyTurnstile(body?.turnstileToken, clientIp(request)))) {
    return NextResponse.json({ error: "Bot-Schutz fehlgeschlagen" }, { status: 403 });
  }

  if (!GUELTIGE_KATEGORIEN.includes(kategorie)) {
    return NextResponse.json({ error: "ungültige Kategorie" }, { status: 400 });
  }
  if (typeof titel !== "string" || titel.trim() === "") {
    return NextResponse.json({ error: "Titel fehlt" }, { status: 400 });
  }
  if (typeof beschreibung !== "string" || beschreibung.trim() === "") {
    return NextResponse.json({ error: "Beschreibung fehlt" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("angebote")
    .insert({
      user_id: user.id,
      kategorie,
      titel: titel.trim(),
      beschreibung: beschreibung.trim(),
      preis: typeof preis === "string" && preis.trim() ? preis.trim() : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
