"use client";

import { useRef, useState } from "react";
import type { SessionQuestion } from "@/lib/questions";
import type { Bewertung } from "@/lib/bewertung-types";
import { FeedbackForm } from "@/components/feedback-form";
import { AntwortKommentare } from "@/components/antwort-kommentare";
import { MusterantwortText } from "@/components/musterantwort-text";
import { StrukturierterText } from "@/components/strukturierter-text";
import { ZoombaresBild } from "@/components/zoombares-bild";
import { FrageMenu } from "@/components/frage-menu";
import { FavoritButton, useFavorit } from "@/components/favorit-button";
import { ErklaerAuswahl } from "@/components/erklaer-auswahl";
import { setGastBewertung } from "@/lib/gast-fortschritt";

type MusterantwortResult = {
  musterantwort: string;
  bildAntwortUrl: string | null;
};

const BEWERTUNG_OPTIONEN: { wert: Bewertung; label: string; icon: string; className: string }[] = [
  { wert: "richtig", label: "Richtig", icon: "✓", className: "bg-green-100 text-green-800 hover:bg-green-200" },
  { wert: "teilweise", label: "Teilweise", icon: "±", className: "bg-amber-100 text-amber-800 hover:bg-amber-200" },
  { wert: "falsch", label: "Falsch", icon: "✕", className: "bg-red-100 text-red-800 hover:bg-red-200" },
];

export function QuestionScreen({
  question,
  index,
  gesamt,
  sessionId,
  istAdmin,
  istGast,
  initialFavorit,
  ungeleseneNachrichten,
  onNext,
  onAbbrechen,
}: {
  question: SessionQuestion;
  index: number;
  gesamt: number;
  sessionId: string;
  istAdmin: boolean;
  istGast: boolean;
  initialFavorit: boolean;
  ungeleseneNachrichten: number;
  onNext: (result: { antwort: string; bewertung: Bewertung | null }) => void;
  onAbbrechen: () => void;
}) {
  const [antwort, setAntwort] = useState("");
  const [feedbackOffen, setFeedbackOffen] = useState(false);
  const [hilfeOffen, setHilfeOffen] = useState(false);
  const [gedreht, setGedreht] = useState(false);
  const [status, setStatus] = useState<"eingabe" | "laden" | "musterantwort" | "fehler">(
    "eingabe"
  );
  const [musterantwortErgebnis, setMusterantwortErgebnis] = useState<MusterantwortResult | null>(
    null
  );
  const [ausgewaehlteBewertung, setAusgewaehlteBewertung] = useState<Bewertung | null>(null);
  const [speichertBewertung, setSpeichertBewertung] = useState(false);
  const [mussWaehlen, setMussWaehlen] = useState(false);
  const [erklaerOffen, setErklaerOffen] = useState(false);
  const bewertungRef = useRef<HTMLDivElement>(null);
  const { favorit, umschalten: favoritUmschalten } = useFavorit(
    question.id,
    istGast,
    initialFavorit
  );

  // Wisch-Navigation: nach links wischen springt zur nächsten Frage, auch ohne
  // Selbsteinschätzung (die bleibt der "Nächste Frage"-Taste vorbehalten).
  const [dragX, setDragX] = useState(0);
  const [ziehend, setZiehend] = useState(false);
  const zugStartRef = useRef<{ x: number; y: number } | null>(null);
  const wurdeGewischtRef = useRef(false);
  const navigiertRef = useRef(false);

  const aufgedeckt = status === "musterantwort";

  async function musterantwortLaden() {
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

  function karteDrehen() {
    if (status === "laden") return;
    const zeigeRueckseite = !gedreht;
    setGedreht(zeigeRueckseite);
    if (zeigeRueckseite && status === "eingabe") {
      void musterantwortLaden();
    }
  }

  async function weiterKlick() {
    if (!ausgewaehlteBewertung) {
      setMussWaehlen(true);
      bewertungRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSpeichertBewertung(true);

    // Gast: Selbsteinschätzung nur lokal im Browser merken, nichts an den Server.
    if (istGast) {
      setGastBewertung(question.id, ausgewaehlteBewertung);
      onNext({ antwort, bewertung: ausgewaehlteBewertung });
      return;
    }

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

  // Freies Weiter (Wischen): mit gewählter Bewertung wie die Taste "Nächste
  // Frage" speichern, sonst einfach überspringen – keine Pflicht zur
  // Selbsteinschätzung.
  function weiterOhneZwang() {
    if (speichertBewertung) return; // Speichern läuft schon (Taste oder vorheriger Wisch)
    if (ausgewaehlteBewertung) {
      void weiterKlick();
      return;
    }
    // Keine Bewertung gewählt -> nichts speichern, einfach überspringen.
    if (navigiertRef.current) return;
    navigiertRef.current = true;
    onNext({ antwort, bewertung: null });
  }

  function aufZugStart(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    zugStartRef.current = { x: e.clientX, y: e.clientY };
    wurdeGewischtRef.current = false;
    setZiehend(true);
  }

  function aufZugBewegung(e: React.PointerEvent) {
    if (!zugStartRef.current) return;
    const dx = e.clientX - zugStartRef.current.x;
    const dy = e.clientY - zugStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy)) setDragX(dx);
  }

  function aufZugEnde(e: React.PointerEvent) {
    if (!zugStartRef.current) return;
    const dx = e.clientX - zugStartRef.current.x;
    const dy = e.clientY - zugStartRef.current.y;
    zugStartRef.current = null;
    setZiehend(false);

    const istWisch = dx < -70 && Math.abs(dx) > Math.abs(dy) * 1.5;
    if (istWisch) {
      wurdeGewischtRef.current = true;
      setDragX(-500);
      window.setTimeout(weiterOhneZwang, 180);
    } else {
      setDragX(0);
    }
  }

  function aufZugAbbruch() {
    zugStartRef.current = null;
    setZiehend(false);
    setDragX(0);
  }

  // Nach einem erkannten Wisch soll der abschließende Klick die Karte nicht
  // zusätzlich umdrehen.
  function aufKarteKlick() {
    if (wurdeGewischtRef.current) {
      wurdeGewischtRef.current = false;
      return;
    }
    karteDrehen();
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-6 pb-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <FrageMenu
            istAdmin={istAdmin}
            istGast={istGast}
            ungeleseneNachrichten={ungeleseneNachrichten}
          />
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
              aria-label="Abbrechen"
              title="Abbrechen"
              onClick={abbrechenKlick}
              className="text-xl leading-none text-red-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-zinc-800">
              Frage <span className="text-accent">{index + 1}</span>
              <span className="font-medium text-zinc-400"> / {gesamt}</span>
            </h2>
            <span
              className="truncate text-xs text-zinc-500"
              title={`${question.modul} · ${question.kurs} · Teil ${question.teil}`}
            >
              {question.modul} · {question.kurs} · Teil {question.teil}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={gesamt}
              aria-valuenow={index + 1}
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${(Math.min(index + 1, gesamt) / Math.max(gesamt, 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Flashcard: Vorderseite = Frage, Rückseite = Musterantwort. Nach links
          wischen (überall auf der Karte) springt zur nächsten Frage. */}
      <div className="[perspective:1400px]">
        <div
          onPointerDown={aufZugStart}
          onPointerMove={aufZugBewegung}
          onPointerUp={aufZugEnde}
          onPointerCancel={aufZugAbbruch}
          className={`grid min-h-[19rem] touch-pan-y [transform-style:preserve-3d] ${
            ziehend ? "" : "transition duration-300 ease-out"
          }`}
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX / 28}deg) rotateY(${gedreht ? 180 : 0}deg)`,
            opacity: dragX <= -400 ? 0 : 1,
          }}
        >
          {/* Vorderseite */}
          <div
            role="button"
            tabIndex={gedreht ? -1 : 0}
            aria-hidden={gedreht}
            onClick={aufKarteKlick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                karteDrehen();
              }
            }}
            className="kp-card flex cursor-pointer flex-col gap-4 [backface-visibility:hidden] [grid-area:1/1]"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="inline-block rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
                Frage
              </span>
              <FavoritButton favorit={favorit} onToggle={favoritUmschalten} />
            </div>
            <StrukturierterText text={question.frage} className="text-lg" />
            {question.bild_frage_url && (
              <ZoombaresBild src={question.bild_frage_url} alt="Bild zur Frage" />
            )}
            <div className="mt-auto flex items-center justify-between pt-2 text-sm text-accent">
              <span>👆 Umdrehen</span>
              <span>Wischen ⟵</span>
            </div>
          </div>

          {/* Rückseite */}
          <div
            role="button"
            tabIndex={gedreht ? 0 : -1}
            aria-hidden={!gedreht}
            onClick={aufKarteKlick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                karteDrehen();
              }
            }}
            className="kp-card flex cursor-pointer flex-col gap-3 [backface-visibility:hidden] [grid-area:1/1] [transform:rotateY(180deg)]"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="inline-block rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-violet-700">
                Musterantwort
              </span>
              <FavoritButton favorit={favorit} onToggle={favoritUmschalten} />
            </div>
            {status === "laden" && (
              <p className="text-sm text-zinc-500">Musterantwort wird geladen…</p>
            )}
            {status === "fehler" && (
              <div className="flex flex-col items-start gap-2 text-sm text-red-700">
                <span>Das hat nicht geklappt. Bitte versuch es nochmal.</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void musterantwortLaden();
                  }}
                  className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
                >
                  Erneut versuchen
                </button>
              </div>
            )}
            {aufgedeckt && musterantwortErgebnis && (
              <>
                <MusterantwortText
                  text={musterantwortErgebnis.musterantwort}
                  className="text-sm leading-relaxed"
                />
                {musterantwortErgebnis.bildAntwortUrl && (
                  <ZoombaresBild
                    src={musterantwortErgebnis.bildAntwortUrl}
                    alt="Bild zur Musterantwort"
                  />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setErklaerOffen(true);
                  }}
                  className="inline-flex items-center gap-1.5 self-start rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:border-accent hover:text-accent"
                >
                  🔍 Mehr Erklärung (Google KI-Modus)
                </button>
              </>
            )}
            <div className="mt-auto flex items-center justify-between pt-2 text-sm text-accent">
              <span>↺ Zurück</span>
              <span>Wischen ⟵</span>
            </div>
          </div>
        </div>
      </div>

      {!gedreht && question.hilfe_hinweis && (
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

      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-500">Deine Antwort / Notizen (optional)</label>
        <textarea
          value={antwort}
          onChange={(e) => setAntwort(e.target.value)}
          placeholder="Kannst du nutzen, musst du aber nicht – die Selbsteinschätzung geht auch ohne."
          rows={6}
          className="kp-input w-full resize-y p-4 leading-relaxed"
        />
      </div>

      {!aufgedeckt && (
        <button
          type="button"
          onClick={karteDrehen}
          disabled={status === "laden"}
          className="kp-btn-primary py-3.5"
        >
          {status === "laden" ? "Musterantwort wird geladen…" : "👁️ Musterantwort aufdecken"}
        </button>
      )}

      {aufgedeckt && musterantwortErgebnis && (
        <div className="flex flex-col gap-4">
          <div
            ref={bewertungRef}
            className={`kp-card flex flex-col gap-3 transition-shadow ${
              mussWaehlen && !ausgewaehlteBewertung ? "ring-2 ring-amber-400" : ""
            }`}
          >
            <h3 className="text-sm font-medium text-zinc-500">
              Wie hast du im Vergleich zur Musterantwort abgeschnitten?
            </h3>
            {mussWaehlen && !ausgewaehlteBewertung && (
              <p className="text-sm font-medium text-amber-700">
                Bitte wähle eine Einschätzung, um zur nächsten Frage zu gehen.
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {BEWERTUNG_OPTIONEN.map((opt) => (
                <button
                  key={opt.wert}
                  type="button"
                  disabled={speichertBewertung}
                  onClick={() => {
                    setAusgewaehlteBewertung(opt.wert);
                    setMussWaehlen(false);
                  }}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
                    ausgewaehlteBewertung === opt.wert
                      ? `${opt.className} ring-2 ring-offset-1 ring-current`
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  <span aria-hidden>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          </div>

          <AntwortKommentare questionId={question.id} istGast={istGast} />

          <div className="sticky bottom-0 -mx-6 mt-1 border-t border-zinc-100 bg-zinc-50/95 px-6 pb-3 pt-3 backdrop-blur">
            <button
              type="button"
              disabled={speichertBewertung}
              onClick={weiterKlick}
              className="kp-btn-primary w-full py-3.5"
            >
              {speichertBewertung ? "…" : "Nächste Frage →"}
            </button>
            <p className="mt-1.5 text-center text-xs text-zinc-400">
              oder auf der Karte nach links wischen, um ohne Bewertung weiterzugehen
            </p>
          </div>
        </div>
      )}

      {feedbackOffen && (
        <FeedbackForm questionId={question.id} onClose={() => setFeedbackOffen(false)} />
      )}

      {erklaerOffen && musterantwortErgebnis && (
        <ErklaerAuswahl
          kurs={question.kurs}
          frage={question.frage}
          musterantwort={musterantwortErgebnis.musterantwort}
          onClose={() => setErklaerOffen(false)}
        />
      )}
    </div>
  );
}
