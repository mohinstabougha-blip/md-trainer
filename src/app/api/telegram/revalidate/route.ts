import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// Wird vom separaten Telegram-Import-Skript (telegram-import/import_telegram.py,
// eigener Python-Prozess, kein Next.js-Kontext) nach einem Lauf mit neuen
// Fragen aufgerufen, damit der "Laufend erweitert"-Banner sofort den
// aktuellen Stand zeigt statt bis zu 1h auf den Cache zu warten (siehe
// lib/updates.ts). Kein Admin-Cookie verfügbar -> eigener Shared-Secret-Check,
// deshalb absichtlich außerhalb von /api/admin (das per proxy.ts eine
// Admin-Session verlangt).
export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  const erwartet = process.env.TELEGRAM_REVALIDATE_SECRET;

  if (!erwartet || !secret || secret !== erwartet) {
    return NextResponse.json({ error: "nicht autorisiert" }, { status: 401 });
  }

  revalidateTag("updates", { expire: 0 });
  return NextResponse.json({ ok: true });
}
