"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InhaltTyp = "angebot" | "nachricht" | "kommentar" | "antwort_kommentar";

const GRUND_LABEL: Record<string, string> = {
  spam: "Spam",
  betrug: "Betrug",
  unangemessen: "Unangemessener Inhalt",
  sonstiges: "Sonstiges",
};

export function MeldenButton({
  inhaltTyp,
  inhaltId,
  klein = false,
  onGemeldet,
}: {
  inhaltTyp: InhaltTyp;
  inhaltId: number;
  klein?: boolean;
  /** Für Client-seitig selbst geladene Listen (z.B. Antwort-Kommentare), die
   *  nicht über Server-Props aktualisiert werden und router.refresh() nicht
   *  mitbekommen. */
  onGemeldet?: () => void;
}) {
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const [grund, setGrund] = useState("spam");
  const [kommentar, setKommentar] = useState("");
  const [sendet, setSendet] = useState(false);
  const [fertig, setFertig] = useState(false);

  async function melden() {
    setSendet(true);
    const res = await fetch("/api/melden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inhaltTyp, inhaltId, grund, kommentar }),
    });
    setSendet(false);
    if (res.ok) {
      setFertig(true);
      setTimeout(() => {
        router.refresh();
        onGemeldet?.();
      }, 800);
    }
  }

  if (fertig) {
    return <span className="text-xs text-zinc-500">Gemeldet — wird geprüft.</span>;
  }

  if (!offen) {
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        className={klein ? "text-xs text-zinc-400 hover:underline" : "text-sm text-zinc-500 hover:underline"}
      >
        🚩 Melden
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-zinc-50 p-3 text-sm">
      <select
        value={grund}
        onChange={(e) => setGrund(e.target.value)}
        className="kp-input py-1"
      >
        {Object.entries(GRUND_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        value={kommentar}
        onChange={(e) => setKommentar(e.target.value)}
        placeholder="Kommentar (optional)"
        className="kp-input py-1"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={sendet}
          onClick={melden}
          className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          Melden
        </button>
        <button
          type="button"
          onClick={() => setOffen(false)}
          className="rounded-full px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
