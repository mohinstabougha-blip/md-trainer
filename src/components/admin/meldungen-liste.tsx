"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Meldung } from "@/lib/admin-data";

const TYP_LABEL: Record<string, string> = {
  angebot: "Angebot",
  nachricht: "Nachricht",
  kommentar: "Kommentar (Marktplatz)",
  antwort_kommentar: "Kommentar (Musterantwort)",
};

const GRUND_LABEL: Record<string, string> = {
  spam: "Spam",
  betrug: "Betrug",
  unangemessen: "Unangemessener Inhalt",
  sonstiges: "Sonstiges",
};

export function MeldungenListe({ meldungen }: { meldungen: Meldung[] }) {
  const router = useRouter();
  const [aendertId, setAendertId] = useState<number | null>(null);

  async function aktion(id: number, aktion: "freigeben" | "loeschen") {
    setAendertId(id);
    const res = await fetch(`/api/admin/meldungen/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktion }),
    });
    setAendertId(null);
    if (res.ok) router.refresh();
  }

  if (meldungen.length === 0) {
    return <p className="text-sm text-zinc-500">Keine offenen Meldungen.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {meldungen.map((m) => (
        <div key={m.id} className="kp-card">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {TYP_LABEL[m.inhaltTyp]} · {GRUND_LABEL[m.grund] ?? m.grund}
            </span>
            <span className="text-xs text-zinc-400">
              {new Date(m.erstelltAm).toLocaleString("de-DE")}
            </span>
          </div>
          <p className="mt-2 rounded-xl bg-zinc-50 p-2 text-sm">{m.inhaltVorschau}</p>
          {m.kommentar && (
            <p className="mt-1 text-sm text-zinc-600">Kommentar der Meldung: {m.kommentar}</p>
          )}
          <div className="mt-3 flex gap-3 text-sm">
            <button
              type="button"
              disabled={aendertId === m.id || !m.inhaltExistiert}
              onClick={() => aktion(m.id, "freigeben")}
              className="rounded-full border border-zinc-200 px-3 py-1 hover:bg-zinc-100 disabled:opacity-40"
            >
              Freigeben
            </button>
            <button
              type="button"
              disabled={aendertId === m.id}
              onClick={() => aktion(m.id, "loeschen")}
              className="rounded-full border border-red-300 px-3 py-1 text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              Löschen
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
