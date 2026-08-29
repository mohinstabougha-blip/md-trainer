import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnzeigenamen } from "@/lib/profile";
import { kurzeUserKennung } from "@/lib/pseudonym";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const questionId = Number(searchParams.get("questionId"));

  if (!questionId) {
    return NextResponse.json({ error: "questionId fehlt" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  }

  const { data: kommentare, error } = await supabase
    .from("antwort_kommentare")
    .select("*")
    .eq("question_id", questionId)
    .order("erstellt_am", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const namen = await getAnzeigenamen(kommentare.map((k) => k.user_id));

  return NextResponse.json({
    aktuelleUserId: user.id,
    kommentare: kommentare.map((k) => ({
      id: k.id,
      text: k.text,
      erstelltAm: k.erstellt_am,
      userId: k.user_id,
      anzeigename:
        k.user_id === user.id ? "Du" : (namen[k.user_id] ?? kurzeUserKennung(k.user_id, user.id)),
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const questionId = body?.questionId;
  const text = body?.text;

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
  if (!user) {
    return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  }

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
