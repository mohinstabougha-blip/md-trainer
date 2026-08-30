"use client";

import { useCallback, useEffect, useState } from "react";
import { MeldenButton } from "@/components/melden-button";
import { useTurnstile } from "@/components/turnstile-widget";

type KommentarMitName = {
  id: number;
  text: string;
  erstelltAm: string;
  userId: string;
  anzeigename: string;
};

export function AntwortKommentare({
  questionId,
  istGast = false,
}: {
  questionId: number;
  istGast?: boolean;
}) {
  const [kommentare, setKommentare] = useState<KommentarMitName[]>([]);
  const [aktuelleUserId, setAktuelleUserId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sendet, setSendet] = useState(false);
  const [geladen, setGeladen] = useState(false);
  const { token, widget, reset, erforderlich } = useTurnstile();

  const laden = useCallback(async () => {
    const res = await fetch(`/api/antwort-kommentare?questionId=${questionId}`);
    if (res.ok) {
      const data = await res.json();
      setKommentare(data.kommentare);
      setAktuelleUserId(data.aktuelleUserId);
    }
    setGeladen(true);
  }, [questionId]);

  useEffect(() => {
    // Datenladen beim Mounten/Wechsel der Frage ist ein legitimer Effect-Use-Case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    laden();
  }, [laden]);

  async function absenden() {
    if (text.trim() === "") return;
    setSendet(true);
    const res = await fetch("/api/antwort-kommentare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, text, turnstileToken: token }),
    });
    setSendet(false);
    if (res.ok) {
      setText("");
      laden();
    } else {
      reset();
    }
  }

  if (!geladen) return null;

  return (
    <div className="kp-card flex flex-col gap-3">
      <h3 className="text-sm font-medium text-zinc-500">
        Kommentare zur Musterantwort {kommentare.length > 0 && `(${kommentare.length})`}
      </h3>

      <div className="flex flex-col gap-2">
        {kommentare.map((k) => (
          <div key={k.id} className="rounded-xl bg-zinc-50 p-3 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{k.anzeigename}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">
                  {new Date(k.erstelltAm).toLocaleString("de-DE")}
                </span>
                {!istGast && k.userId !== aktuelleUserId && (
                  <MeldenButton
                    inhaltTyp="antwort_kommentar"
                    inhaltId={k.id}
                    klein
                    onGemeldet={laden}
                  />
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

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ergänzung/Anmerkung…"
            className="kp-input flex-1"
          />
          <button
            type="button"
            disabled={sendet || text.trim() === "" || (erforderlich && !token)}
            onClick={absenden}
            className="kp-btn-primary"
          >
            Senden
          </button>
        </div>
        {text.trim() !== "" && widget}
        {istGast && (
          <p className="text-xs text-zinc-400">
            Du kommentierst als Gast. Melde dich an, um unter deinem Namen zu schreiben.
          </p>
        )}
      </div>
    </div>
  );
}
