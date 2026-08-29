"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TurnstileWidget } from "@/components/turnstile-widget";

type Modus = "anmelden" | "registrieren";

export default function LoginPage() {
  const router = useRouter();
  const [modus, setModus] = useState<Modus>("anmelden");
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [anzeigename, setAnzeigename] = useState("");
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);

  const turnstileErforderlich = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setSendet(true);
    setFehler(null);
    setHinweis(null);

    const supabase = createClient();
    const captchaToken = turnstileToken ?? undefined;

    if (modus === "anmelden") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: passwort,
        options: { captchaToken },
      });
      setSendet(false);
      if (error) {
        setFehler(error.message);
        setTurnstileReset((n) => n + 1);
        return;
      }
      router.push("/");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: passwort,
        options: { data: { anzeigename: anzeigename.trim() }, captchaToken },
      });
      setSendet(false);
      if (error) {
        setFehler(error.message);
        setTurnstileReset((n) => n + 1);
        return;
      }
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setHinweis("Konto erstellt. Bitte bestätige deine E-Mail-Adresse und melde dich dann an.");
        setModus("anmelden");
      }
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 bg-zinc-50 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-accent">KP-Trainer</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {modus === "anmelden" ? "Melde dich an" : "Erstelle ein Konto"}
        </p>
      </div>

      <div className="kp-card grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setModus("anmelden")}
          className={`kp-pill ${modus === "anmelden" ? "kp-pill-aktiv" : "kp-pill-inaktiv"}`}
        >
          Anmelden
        </button>
        <button
          type="button"
          onClick={() => setModus("registrieren")}
          className={`kp-pill ${modus === "registrieren" ? "kp-pill-aktiv" : "kp-pill-inaktiv"}`}
        >
          Registrieren
        </button>
      </div>

      <form onSubmit={absenden} className="kp-card flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-Mail"
          required
          className="kp-input"
        />
        <input
          type="password"
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
          placeholder="Passwort"
          required
          minLength={6}
          className="kp-input"
        />
        {modus === "registrieren" && (
          <input
            value={anzeigename}
            onChange={(e) => setAnzeigename(e.target.value)}
            placeholder="Anzeigename"
            required
            className="kp-input"
          />
        )}

        <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileReset} />

        {hinweis && <p className="text-sm text-green-700">{hinweis}</p>}
        {fehler && <p className="text-sm text-red-600">{fehler}</p>}

        <button
          type="submit"
          disabled={sendet || (turnstileErforderlich && !turnstileToken)}
          className="kp-btn-primary mt-1"
        >
          {modus === "anmelden" ? "Anmelden" : "Konto erstellen"}
        </button>
      </form>
    </div>
  );
}
