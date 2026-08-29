"use client";

import { useState } from "react";
import type { SessionQuestion } from "@/lib/questions";
import type { Bewertung } from "@/lib/bewertung-types";
import { FeedbackForm } from "@/components/feedback-form";
import { AntwortKommentare } from "@/components/antwort-kommentare";
import { MusterantwortText } from "@/components/musterantwort-text";
import { FrageMenu } from "@/components/frage-menu";

type MusterantwortResult = {
  musterantwort: string;
  bildAntwortUrl: string | null;
};

const BEWERTUNG_OPTIONEN: { wert: Bewertung; label: string; className: string }[] = [
  { wert: "richtig", label: "Richtig", className: "bg-green-100 text-green-800 hover:bg-green-200" },
  { wert: "teilweise", label: "Teilweise", className: "bg-amber-100 text-amber-800 hover:bg-amber-200" },
  { wert: "falsch", label: "Falsch", className: "bg-red-100 text-red-800 hover:bg-red-200" },
];

export function QuestionScreen({
  question,
  index,
  gesamt,
  sessionId,
  istAdmin,
  ungeleseneNachrichten,
  onNext,
  onAbbrechen,
}: {
  question: SessionQuestion;
  index: number;
  gesamt: number;
  sessionId: string;
  istAdmin: boolean;
  ungeleseneNachrichten: number;
  onNext: (result: { antwort: string; bewertung: Bewertung | null }) => void;
  onAbbrechen: () => void;
}) {
  const [antwort, setAntwort] = useState("");
  const [feedbackOffen, setFeedbackOffen] = useState(false);
  const [hilfeOffen, setHilfeOffen] = useState(false);
  const [status, setStatus] = useState<"eingabe" | "laden" | "musterantwort" | "fehler">(
    "eingabe"
  );
  const [musterantwortErgebnis, setMusterantwortErgebnis] = useState<MusterantwortResult | null>(
    null
  );
  const [ausgewaehlteBewertung, setAusgewaehlteBewertung] = useState<Bewertung | null>(null);
  const [speichertBewertung, setSpeichertBewertung] = useState(false);

  async function antwortAbschicken() {
    setStatus("laden");
    try {
      const res = await fetch("/api/musterantwort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id }),
      });
      if (!res.ok) throw new Error("Musterantwort konnte nicht geladen werden");
      const data: MusterantwortResult = await res.json();
      setMusterantwortErgebnis(data);
      setStatus("musterantwort");
    } catch {
      setStatus("fehler");
    }
  }

  async function weiterKlick() {
    if (!ausgewaehlteBewertung) return;
    setSpeichertBewertung(true);
    try {
      const res = await fetch("/api/selbstbewertung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          antwort,
          sessionId,
          bewertung: ausgewaehlteBewertung,
        }),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      onNext({ antwort, bewertung: ausgewaehlteBewertung });
    } catch {
      setSpeichertBewertung(false);
    }
  }

  function abbrechenKlick() {
    if (confirm("Session wirklich abbrechen? Dein bisheriger Fortschritt wird gespeichert.")) {
      onAbbrechen();
    }
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-6 pb-10">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <FrageMenu istAdmin={istAdmin} ungeleseneNachrichten={ungeleseneNachrichten} />
          <span className="text-sm text-zinc-500">
            Frage {index + 1} von {gesamt} · {question.modul} / {question.kurs} · Teil{" "}
            {question.teil}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Problem melden"
            onClick={() => setFeedbackOffen(true)}
            className="text-lg"
          >
            ⚠️
          </button>
          <button
            type="button"
            onClick={abbrechenKlick}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Abbrechen
          </button>
        </div>
      </div>

      <div className="kp-card flex flex-col gap-4">
        <p className="text-lg leading-relaxed">{question.frage}</p>
        {question.bild_frage_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.bild_frage_url}
            alt="Bild zur Frage"
            className="max-w-full rounded-xl"
          />
        )}
      </div>

      {status === "eingabe" && question.hilfe_hinweis && (
        <div>
          <button
            type="button"
            onClick={() => setHilfeOffen((v) => !v)}
            className="text-sm text-amber-700 hover:underline"
          >
            💡 Hilfe
          </button>
          {hilfeOffen && (
            <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              {question.hilfe_hinweis}
            </p>
          )}
        </div>
      )}

      <textarea
        value={antwort}
        onChange={(e) => setAntwort(e.target.value)}
        readOnly={status !== "eingabe"}
        placeholder="Deine Antwort…"
        rows={8}
        className="kp-input w-full resize-y p-4 leading-relaxed disabled:opacity-60"
      />

      {status === "eingabe" && (
        <button
          type="button"
          disabled={antwort.trim() === ""}
          onClick={antwortAbschicken}
          className="kp-btn-primary py-3.5"
        >
          Musterantwort anzeigen
        </button>
      )}

      {status === "laden" && (
        <div className="kp-card text-center text-sm text-zinc-500">Musterantwort wird geladen…</div>
      )}

      {status === "fehler" && (
        <div className="flex flex-col gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>Das hat nicht geklappt. Bitte versuch es nochmal.</span>
          <button
            type="button"
            onClick={antwortAbschicken}
            className="self-start rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {status === "musterantwort" && musterantwortErgebnis && (
        <div className="flex flex-col gap-4">
          <div className="kp-card flex flex-col gap-2">
            <h3 className="text-sm font-medium text-zinc-500">Musterantwort</h3>
            <MusterantwortText
              text={musterantwortErgebnis.musterantwort}
              className="text-sm leading-relaxed"
            />
            {musterantwortErgebnis.bildAntwortUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={musterantwortErgebnis.bildAntwortUrl}
                alt="Bild zur Musterantwort"
                className="max-w-full rounded-xl"
              />
            )}
          </div>

          <div className="kp-card flex flex-col gap-3">
            <h3 className="text-sm font-medium text-zinc-500">
              Wie hast du im Vergleich zur Musterantwort abgeschnitten?
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {BEWERTUNG_OPTIONEN.map((opt) => (
                <button
                  key={opt.wert}
                  type="button"
                  disabled={speichertBewertung}
                  onClick={() => setAusgewaehlteBewertung(opt.wert)}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
                    ausgewaehlteBewertung === opt.wert
                      ? `${opt.className} ring-2 ring-offset-1 ring-current`
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <AntwortKommentare questionId={question.id} />

          <button
            type="button"
            disabled={!ausgewaehlteBewertung || speichertBewertung}
            onClick={weiterKlick}
            className="kp-btn-primary py-3.5"
          >
            Nächste Frage
          </button>
        </div>
      )}

      {feedbackOffen && (
        <FeedbackForm questionId={question.id} onClose={() => setFeedbackOffen(false)} />
      )}
    </div>
  );
}
