import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const typ = body?.typ;

  if (typ !== "einzelfrage" && typ !== "protokoll") {
    return NextResponse.json({ error: "ungültiger typ" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  }

  let insert: Record<string, unknown> = { user_id: user.id, typ };

  if (typ === "einzelfrage") {
    const { modul, kurs, teil, frage, antwortVorschlag } = body;
    if (!modul || !kurs || ![1, 2, 3].includes(teil) || !frage || !antwortVorschlag) {
      return NextResponse.json(
        { error: "Modul, Kurs, Teil, Frage und Antwort-Vorschlag sind Pflichtfelder" },
        { status: 400 }
      );
    }
    insert = {
      ...insert,
      modul: String(modul).trim(),
      kurs: String(kurs).trim(),
      teil,
      frage: String(frage).trim(),
      antwort_vorschlag: String(antwortVorschlag).trim(),
    };
  } else {
    const { protokollText } = body;
    if (typeof protokollText !== "string" || protokollText.trim() === "") {
      return NextResponse.json({ error: "Protokoll-Text fehlt" }, { status: 400 });
    }
    insert = { ...insert, protokoll_text: protokollText.trim() };
  }

  const { data, error } = await supabase.from("einreichungen").insert(insert).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
