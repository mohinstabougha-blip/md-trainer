"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Kommentar } from "@/lib/marktplatz-types";
import { nutzerName } from "@/lib/pseudonym";
import { MeldenButton } from "@/components/melden-button";

export function Kommentare({
  angebotId,
  kommentare,
  aktuelleUserId,
  namen,
}: {
  angebotId: number;
  kommentare: Kommentar[];
  aktuelleUserId: string;
  namen: Record<string, string>;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sendet, setSendet] = useState(false);

  async function absenden() {
    if (text.trim() === "") return;
    setSendet(true);
    const res = await fetch("/api/marktplatz/kommentare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ angebotId, text }),
    });
    setSendet(false);
    if (res.ok) {
      setText("");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-zinc-500">
        Kommentare {kommentare.length > 0 && `(${kommentare.length})`}
      </h2>

      <div className="flex flex-col gap-2">
        {kommentare.map((k) => (
          <div key={k.id} className="rounded-xl bg-zinc-50 p-3 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{nutzerName(k.user_id, namen, aktuelleUserId)}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">
                  {new Date(k.erstellt_am).toLocaleString("de-DE")}
                </span>
                {k.user_id !== aktuelleUserId && (
                  <MeldenButton inhaltTyp="kommentar" inhaltId={k.id} klein />
                )}
              </div>
            </div>
            <p className="mt-1 text-zinc-700">{k.text}</p>
          </div>
        ))}
        {kommentare.length === 0 && (
          <p className="text-sm text-zinc-500">Noch keine Kommentare.</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Kommentar schreiben…"
          className="kp-input flex-1"
        />
        <button
          type="button"
          disabled={sendet || text.trim() === ""}
          onClick={absenden}
          className="kp-btn-primary"
        >
          Senden
        </button>
      </div>
    </div>
  );
}
