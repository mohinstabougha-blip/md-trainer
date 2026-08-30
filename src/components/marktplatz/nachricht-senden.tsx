"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTurnstile } from "@/components/turnstile-widget";

export function NachrichtSenden({ angebotId, anUserId }: { angebotId: number; anUserId: string }) {
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const [text, setText] = useState("");
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const { token, widget, reset, erforderlich } = useTurnstile();

  async function absenden() {
    setSendet(true);
    setFehler(null);
    const res = await fetch("/api/marktplatz/nachrichten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ angebotId, anUserId, text, turnstileToken: token }),
    });
    setSendet(false);
    if (res.ok) {
      router.push(`/marktplatz/nachrichten/${angebotId}/${anUserId}`);
    } else {
      reset();
      const data = await res.json().catch(() => null);
      setFehler(data?.error ?? "Senden fehlgeschlagen");
    }
  }

  if (!offen) {
    return (
      <button type="button" onClick={() => setOffen(true)} className="kp-btn-primary w-fit">
        Nachricht senden
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Deine Nachricht…"
        rows={3}
        className="kp-input"
      />
      {fehler && <p className="text-sm text-red-600">{fehler}</p>}
      {widget}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={sendet || text.trim() === "" || (erforderlich && !token)}
          onClick={absenden}
          className="kp-btn-primary py-1.5"
        >
          Senden
        </button>
        <button
          type="button"
          onClick={() => setOffen(false)}
          className="rounded-full px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
