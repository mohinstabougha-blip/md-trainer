import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (body?.status !== "erledigt") {
    return NextResponse.json({ error: "ungültiger status" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("feedback")
    .update({ status: "erledigt" })
    .eq("id", Number(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
