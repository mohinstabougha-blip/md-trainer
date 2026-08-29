import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("wartezeit_meldungen").delete().eq("id", Number(id));
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Der Community-Durchschnitt auf der Hauptseite ist gecacht (siehe
  // getWartezeitDurchschnitt) und soll gelöschte Meldungen sofort nicht mehr
  // einrechnen.
  revalidateTag("wartezeit", { expire: 0 });

  return NextResponse.json({ ok: true });
}
