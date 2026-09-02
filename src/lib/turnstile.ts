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

export type TurnstileErgebnis = { ok: boolean; fehlercodes?: string[] };

/** Wie verifyTurnstile, gibt aber zusätzlich die Cloudflare-Fehlercodes zurück. */
export async function verifyTurnstileDetailliert(
  token: unknown,
  remoteip?: string | null
): Promise<TurnstileErgebnis> {
  // remoteip wird bewusst NICHT mehr an Cloudflare übergeben: hinter Vercel/
  // Cloudflare stimmt die weitergereichte IP häufig nicht mit der überein, die
  // die Challenge gelöst hat, was zu success:false führt. Der Parameter bleibt
  // aus Kompatibilität in der Signatur erhalten.
  void remoteip;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true }; // nicht konfiguriert -> kein Blockieren
  if (typeof token !== "string" || token.trim() === "") {
    return { ok: false, fehlercodes: ["missing-input-response"] };
  }

  const secretTrim = secret.trim();
  try {
    const form = new URLSearchParams({ secret: secretTrim, response: token.trim() });
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Turnstile siteverify HTTP", res.status, body.slice(0, 200));
      return {
        ok: false,
        fehlercodes: [`http-${res.status}`, `secretLen=${secretTrim.length}`, body.slice(0, 120)],
      };
    }
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success !== true) {
      console.error("Turnstile abgelehnt:", data["error-codes"]);
      return { ok: false, fehlercodes: data["error-codes"] ?? ["unknown"] };
    }
    return { ok: true };
  } catch (err) {
    console.error("Turnstile siteverify Fehler:", err);
    return { ok: false, fehlercodes: ["fetch-error"] };
  }
}

export async function verifyTurnstile(token: unknown, remoteip?: string | null): Promise<boolean> {
  return (await verifyTurnstileDetailliert(token, remoteip)).ok;
}
