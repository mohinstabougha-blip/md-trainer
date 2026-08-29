"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EinstellungenForm({ initialAnzeigename }: { initialAnzeigename: string }) {
  const router = useRouter();
  const [anzeigename, setAnzeigename] = useState(initialAnzeigename);
  const [speichert, setSpeichert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState(false);

  async function speichern() {
    setSpeichert(true);
    setFehler(null);
    setGespeichert(false);
    const res = await fetch("/api/profil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anzeigename }),
    });
    setSpeichert(false);
    if (res.ok) {
      setGespeichert(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setFehler(data?.error ?? "Speichern fehlgeschlagen");
    }
  }

  return (
    <div className="kp-card flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Anzeigename
        <input
          value={anzeigename}
          onChange={(e) => setAnzeigename(e.target.value)}
          maxLength={40}
          className="kp-input"
        />
      </label>
      <p className="text-xs text-zinc-500">
        Wird bei deinen Angeboten, Nachrichten und Kommentaren im Marktplatz angezeigt.
      </p>
      {fehler && <p className="text-sm text-red-600">{fehler}</p>}
      {gespeichert && <p className="text-sm text-green-700">Gespeichert.</p>}
      <button
        type="button"
        disabled={speichert || anzeigename.trim() === ""}
        onClick={speichern}
        className="kp-btn-primary w-fit"
      >
        Speichern
      </button>
    </div>
  );
}
