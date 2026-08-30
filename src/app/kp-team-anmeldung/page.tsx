"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTurnstile } from "@/components/turnstile-widget";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [sendet, setSendet] = useState(false);
  const { token, widget, reset, erforderlich } = useTurnstile();

  async function anmelden(e: React.FormEvent) {
    e.preventDefault();
    setSendet(true);
    setFehler(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, turnstileToken: token }),
    });
    setSendet(false);
    if (res.ok) {
      router.push("/admin/fragen");
      router.refresh();
    } else {
      reset();
      const data = await res.json().catch(() => null);
      setFehler(data?.error ?? "Anmeldung fehlgeschlagen");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 bg-zinc-50 p-6">
      <h1 className="text-xl font-semibold">Admin-Login</h1>
      <form onSubmit={anmelden} className="kp-card flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          autoFocus
          className="kp-input"
        />
        {widget}
        {fehler && <p className="text-sm text-red-600">{fehler}</p>}
        <button
          type="submit"
          disabled={sendet || password === "" || (erforderlich && !token)}
          className="kp-btn-primary"
        >
          Anmelden
        </button>
      </form>
    </div>
  );
}
