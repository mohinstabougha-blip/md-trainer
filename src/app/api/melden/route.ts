import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GUELTIGE_TYPEN = ["angebot", "nachricht", "kommentar", "antwort_kommentar"] as const;
const GUELTIGE_GRUENDE = ["spam", "betrug", "unangemessen", "sonstiges"] as const;

const TABELLE: Record<(typeof GUELTIGE_TYPEN)[number], string> = {
  angebot: "angebote",
  nachricht: "angebot_nachrichten",
  kommentar: "angebot_kommentare",
  antwort_kommentar: "antwort_kommentare",
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const inhaltTyp = body?.inhaltTyp;
  const inhaltId = body?.inhaltId;
  const grund = body?.grund;
  const kommentar = body?.kommentar;

  if (!GUELTIGE_TYPEN.includes(inhaltTyp)) {
    return NextResponse.json({ error: "ungültiger inhaltTyp" }, { status: 400 });
  }
  if (!inhaltId || typeof inhaltId !== "number") {
    return NextResponse.json({ error: "inhaltId fehlt" }, { status: 400 });
  }
  if (!GUELTIGE_GRUENDE.includes(grund)) {
    return NextResponse.json({ error: "ungültiger grund" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  }

  const { error: insertError } = await supabase.from("meldungen").insert({
    inhalt_typ: inhaltTyp,
    inhalt_id: inhaltId,
    gemeldet_von: user.id,
    grund,
    kommentar: typeof kommentar === "string" && kommentar.trim() ? kommentar.trim() : null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Normale Nutzer dürfen fremde Inhalte nicht per RLS verstecken -> Service-Role.
  const admin = createAdminClient();
  const { error: hideError } = await admin
    .from(TABELLE[inhaltTyp as (typeof GUELTIGE_TYPEN)[number]])
    .update({ versteckt: true })
    .eq("id", inhaltId);

  if (hideError) {
    return NextResponse.json({ error: hideError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
