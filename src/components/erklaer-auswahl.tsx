"use client";

import { useState } from "react";
import { musterantwortSaetze } from "@/lib/musterantwort-format";

// Google-KI-Modus (AI Mode) verträgt nur eine begrenzte Anfrage. Deshalb wählt
// der Nutzer, welchen Teil der Musterantwort er erklärt haben möchte.
const MAX_WOERTER = 180;

function begrenzeWoerter(text: string, max: number): string {
  const w = text.split(/\s+/).filter(Boolean);
  return w.length <= max ? text : w.slice(0, max).join(" ") + " …";
}

function suchUrl(kurs: string, frage: string, teil: string): string {
  const kopf = `${kurs} – ${frage}`.replace(/\s+/g, " ").trim();
  const roh = `${kopf}\n\n${teil}\n\nBitte diesen Punkt ausführlich und verständlich erklären.`;
  const begriff = begrenzeWoerter(roh.replace(/\s+/g, " ").trim(), MAX_WOERTER);
  return `https://www.google.com/search?udm=50&q=${encodeURIComponent(begriff)}`;
}

export function ErklaerAuswahl({
  kurs,
  frage,
  musterantwort,
  onClose,
}: {
  kurs: string;
  frage: string;
  musterantwort: string;
  onClose: () => void;
}) {
  const saetze = musterantwortSaetze(musterantwort);
  const [ausgewaehlt, setAusgewaehlt] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setAusgewaehlt((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function oeffnen(teilText: string) {
    window.open(suchUrl(kurs, frage, teilText), "_blank", "noopener,noreferrer");
    onClose();
  }

  const auswahlText = [...ausgewaehlt]
    .sort((a, b) => a - b)
    .map((i) => saetze[i])
    .join(" ");
  const auswahlWoerter = auswahlText ? auswahlText.split(/\s+/).filter(Boolean).length : 0;
  const zuViel = auswahlWoerter > MAX_WOERTER;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Welchen Teil erklären lassen?</h2>
          <button type="button" onClick={onClose} className="text-sm text-accent">
            Schließen
          </button>
        </div>
        <p className="mb-3 text-xs text-zinc-500">
          Punkte antippen und gemeinsam öffnen – oder einen einzelnen Punkt direkt.
          Max. {MAX_WOERTER} Wörter pro Anfrage.
        </p>

        <div className="flex flex-col gap-1 overflow-y-auto">
          {saetze.map((satz, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-xl border p-2 text-sm transition-colors ${
                ausgewaehlt.has(i) ? "border-accent bg-accent/5" : "border-zinc-100"
              }`}
            >
              <input
                type="checkbox"
                checked={ausgewaehlt.has(i)}
                onChange={() => toggle(i)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#3797f0]"
              />
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex-1 text-left leading-snug"
              >
                {satz}
              </button>
              <button
                type="button"
                onClick={() => oeffnen(satz)}
                className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-200"
              >
                Nur dies
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
          <span className={`text-xs ${zuViel ? "font-semibold text-red-600" : "text-zinc-400"}`}>
            {auswahlWoerter} / {MAX_WOERTER} Wörter
          </span>
          <button
            type="button"
            disabled={ausgewaehlt.size === 0 || zuViel}
            onClick={() => oeffnen(auswahlText)}
            className="kp-btn-primary px-4 py-2 text-sm disabled:opacity-40"
          >
            Auswahl erklären
          </button>
        </div>
      </div>
    </div>
  );
}
