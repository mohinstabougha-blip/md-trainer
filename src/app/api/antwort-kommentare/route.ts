import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnzeigenamen } from "@/lib/profile";
import { kurzeUserKennung } from "@/lib/pseudonym";
import { verifyTurnstile, clientIp } from "@/lib/turnstile";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const questionId = Number(searchParams.get("questionId"));

  if (!questionId) {
    return NextResponse.json({ error: "questionId fehlt" }, { status: 400 });
  }

  // Auch für Gäste lesbar (RLS antwort_kommentare_select_sichtbar: not versteckt).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const aktuelleUserId = user?.id ?? null;

  const { data: kommentare, error } = await supabase
    .from("antwort_kommentare")
    .select("*")
    .eq("question_id", questionId)
    .order("erstellt_am", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const namen = await getAnzeigenamen(
    kommentare.map((k) => k.user_id).filter((id): id is string => Boolean(id))
  );

  return NextResponse.json({
    aktuelleUserId,
    kommentare: kommentare.map((k) => ({
      id: k.id,
      text: k.text,
      erstelltAm: k.erstellt_am,
      userId: k.user_id,
      anzeigename: !k.user_id
        ? "Gast"
        : k.user_id === aktuelleUserId
          ? "Du"
          : (namen[k.user_id] ?? kurzeUserKennung(k.user_id, aktuelleUserId)),
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const questionId = body?.questionId;
  const text = body?.text;

  if (!(await verifyTurnstile(body?.turnstileToken, clientIp(request)))) {
    return NextResponse.json({ error: "Bot-Schutz fehlgeschlagen" }, { status: 403 });
  }

  if (!questionId || typeof questionId !== "number") {
    return NextResponse.json({ error: "questionId fehlt" }, { status: 400 });
  }
  if (typeof text !== "string" || text.trim() === "") {
    return NextResponse.json({ error: "text fehlt" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data, error } = await supabase
      .from("antwort_kommentare")
      .insert({ question_id: questionId, user_id: user.id, text: text.trim() })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  // Gast: Insert über Service-Role (RLS-Insert-Policy verlangt auth.uid()),
  // user_id bleibt NULL. Turnstile ist oben bereits geprüft.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("antwort_kommentare")
    .insert({ question_id: questionId, user_id: null, text: text.trim(), quelle_typ: "gast" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
