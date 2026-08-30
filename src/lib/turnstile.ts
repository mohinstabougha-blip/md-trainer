// Serverseitige Verifikation eines Cloudflare-Turnstile-Tokens.
//
// Ist TURNSTILE_SECRET_KEY nicht gesetzt (lokale Entwicklung / Deployment ohne
// Turnstile-Setup), wird NICHT blockiert – die Funktion gibt dann true zurück.
// Sobald der Secret-Key hinterlegt ist, wird der Schutz für alle angebundenen
// Endpunkte automatisch aktiv.

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Ist der serverseitige Turnstile-Schutz konfiguriert (und damit aktiv)? */
export function turnstileAktiv(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/** Client-IP aus den üblichen Proxy-Headern (best effort). */
export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || null;
}

export async function verifyTurnstile(token: unknown, remoteip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // nicht konfiguriert -> kein Blockieren
  if (typeof token !== "string" || token.trim() === "") return false;

  try {
    const form = new URLSearchParams({ secret, response: token });
    if (remoteip) form.set("remoteip", remoteip);
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
