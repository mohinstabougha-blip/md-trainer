import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstile, clientIp } from "@/lib/turnstile";

function istGueltigesDatum(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const antragDatum = body?.antragDatum;
  const rechnungErhalten = Boolean(body?.rechnungErhalten);
  const rechnungDatum = body?.rechnungDatum;
  const terminErhalten = Boolean(body?.terminErhalten);
  const pruefungsdatum = body?.pruefungsdatum;

  if (!(await verifyTurnstile(body?.turnstileToken, clientIp(request)))) {
    return NextResponse.json({ error: "Bot-Schutz fehlgeschlagen" }, { status: 403 });
  }

  if (!istGueltigesDatum(antragDatum)) {
    return NextResponse.json({ error: "antragDatum fehlt oder ungültig" }, { status: 400 });
  }
  if (rechnungErhalten && !istGueltigesDatum(rechnungDatum)) {
    return NextResponse.json({ error: "rechnungDatum fehlt oder ungültig" }, { status: 400 });
  }
  if (terminErhalten && !istGueltigesDatum(pruefungsdatum)) {
    return NextResponse.json({ error: "pruefungsdatum fehlt oder ungültig" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const werte = {
    antrag_datum: antragDatum,
    rechnung_erhalten: rechnungErhalten,
    rechnung_datum: rechnungErhalten ? rechnungDatum : null,
    termin_erhalten: terminErhalten,
    pruefungsdatum: terminErhalten ? pruefungsdatum : null,
  };

  let data;
  let error;

  if (user) {
    // Eine Meldung pro Nutzer — bei erneutem Eintrag aktualisieren.
    ({ data, error } = await supabase
      .from("wartezeit_meldungen")
      .upsert({ user_id: user.id, ...werte }, { onConflict: "user_id" })
      .select()
      .single());
  } else {
    // Gast: anonyme Meldung (user_id NULL) über Service-Role, kann später nicht
    // mehr bearbeitet werden. Turnstile ist oben geprüft.
    ({ data, error } = await createAdminClient()
      .from("wartezeit_meldungen")
      .insert({ user_id: null, quelle_typ: "nutzer", ...werte })
      .select()
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // { expire: 0 }: Route Handler wird von außen (Client-Fetch) aufgerufen,
  // dort soll die neue Meldung sofort einfließen statt stale-while-revalidate.
  revalidateTag("wartezeit", { expire: 0 });

  return NextResponse.json(data);
}
