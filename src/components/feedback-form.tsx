"use client";

import { useState } from "react";
import { useTurnstile } from "@/components/turnstile-widget";

const TYPEN = [
  { value: "frage_fehlerhaft", label: "Frage fehlerhaft" },
  { value: "antwort_fehlerhaft", label: "Antwort fehlerhaft" },
  { value: "bild_fehlt_oder_falsch", label: "Bild fehlt oder falsch" },
  { value: "sonstiges", label: "Sonstiges" },
] as const;

export function FeedbackForm({
  questionId,
  onClose,
}: {
  questionId: number;
  onClose: () => void;
}) {
  const [typ, setTyp] = useState<(typeof TYPEN)[number]["value"]>("frage_fehlerhaft");
  const [kommentar, setKommentar] = useState("");
  const [status, setStatus] = useState<"idle" | "senden" | "gesendet" | "fehler">("idle");
  const { token, widget, reset, erforderlich } = useTurnstile();

  async function melden() {
    setStatus("senden");
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, typ, kommentar, turnstileToken: token }),
    });
    if (res.ok) {
      setStatus("gesendet");
      setTimeout(onClose, 1200);
    } else {
      setStatus("fehler");
      reset();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="text-sm font-semibold">Problem melden</h2>

        {status === "gesendet" ? (
          <p className="mt-3 text-sm text-zinc-600">Danke, dein Hinweis wurde gemeldet.</p>
        ) : (
          <>
            <div className="mt-3 flex flex-col gap-1.5">
              {TYPEN.map((t) => (
                <label key={t.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="feedback-typ"
                    value={t.value}
                    checked={typ === t.value}
                    onChange={() => setTyp(t.value)}
                    className="accent-[#3797f0]"
                  />
                  {t.label}
                </label>
              ))}
            </div>
            <textarea
              value={kommentar}
              onChange={(e) => setKommentar(e.target.value)}
              placeholder="Kommentar (optional)"
              rows={3}
              className="kp-input mt-3 w-full resize-none"
            />
            {status === "fehler" && (
              <p className="mt-2 text-sm text-red-600">
                Melden fehlgeschlagen. Bitte versuch es nochmal.
              </p>
            )}
            <div className="mt-3">{widget}</div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={melden}
                disabled={status === "senden" || (erforderlich && !token)}
                className="kp-btn-primary py-1.5"
              >
                Melden
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
