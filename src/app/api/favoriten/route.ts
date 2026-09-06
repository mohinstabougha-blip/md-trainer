import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ids: [] });

  const { data, error } = await supabase
    .from("favoriten")
    .select("question_id")
    .eq("user_id", user.id)
    .order("erstellt_am", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ids: (data ?? []).map((r) => r.question_id) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const questionId = body?.questionId;
  const favorit = Boolean(body?.favorit);

  if (typeof questionId !== "number" || !Number.isInteger(questionId)) {
    return NextResponse.json({ error: "questionId fehlt" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
  }

  if (favorit) {
    const { error } = await supabase
      .from("favoriten")
      .upsert({ user_id: user.id, question_id: questionId }, { onConflict: "user_id,question_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("favoriten")
      .delete()
      .eq("user_id", user.id)
      .eq("question_id", questionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, favorit });
}
