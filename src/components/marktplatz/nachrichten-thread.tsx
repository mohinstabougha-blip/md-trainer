"use client";

import { useState } from "react";
import type { Nachricht } from "@/lib/marktplatz-types";
import { MeldenButton } from "@/components/melden-button";

export function NachrichtenThread({
  angebotId,
  partnerId,
  aktuelleUserId,
  initial,
}: {
  angebotId: number;
  partnerId: string;
  aktuelleUserId: string;
  initial: Nachricht[];
}) {
  const [nachrichten, setNachrichten] = useState(initial);
  const [text, setText] = useState("");
  const [sendet, setSendet] = useState(false);

  async function absenden() {
    if (text.trim() === "") return;
    setSendet(true);
    const res = await fetch("/api/marktplatz/nachrichten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ angebotId, anUserId: partnerId, text }),
    });
    setSendet(false);
    if (res.ok) {
      const neue = await res.json();
      setNachrichten((prev) => [...prev, neue]);
      setText("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {nachrichten.map((n) => {
          const vonMir = n.user_id_von === aktuelleUserId;
          return (
            <div key={n.id} className={`flex max-w-[75%] flex-col gap-1 ${vonMir ? "self-end items-end" : "self-start items-start"}`}>
              <div
                className={`rounded-2xl px-3 py-2 text-sm ${
                  vonMir ? "bg-accent text-white" : "bg-zinc-100"
                }`}
              >
                {n.text}
                <div className={`mt-1 text-xs ${vonMir ? "text-blue-100" : "text-zinc-500"}`}>
                  {new Date(n.erstellt_am).toLocaleString("de-DE")}
                </div>
              </div>
              {!vonMir && <MeldenButton inhaltTyp="nachricht" inhaltId={n.id} klein />}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nachricht…"
          onKeyDown={(e) => {
            if (e.key === "Enter") absenden();
          }}
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
