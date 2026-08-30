import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, adminSessionToken } from "@/lib/admin-auth";
import { verifyTurnstile, clientIp } from "@/lib/turnstile";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = body?.password;

  if (!(await verifyTurnstile(body?.turnstileToken, clientIp(request)))) {
    return NextResponse.json({ error: "Bot-Schutz fehlgeschlagen" }, { status: 403 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "ADMIN_PASSWORD ist serverseitig nicht gesetzt" }, { status: 500 });
  }

  if (typeof password !== "string" || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Falsches Passwort" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, adminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
