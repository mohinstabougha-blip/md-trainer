"use client";

import { useState } from "react";
import { WartezeitGraph } from "@/components/wartezeit-graph";
import { useTurnstile } from "@/components/turnstile-widget";
import type { WartezeitVerlauf } from "@/lib/wartezeit";

type Meldung = {
  antrag_datum: string;
  rechnung_erhalten: boolean;
  rechnung_datum: string | null;
  termin_erhalten: boolean;
  pruefungsdatum: string | null;
} | null;

export function WartezeitBadge({
  badgeText,
  verlauf,
  initial,
  istGast = false,
}: {
  badgeText: string;
  verlauf: WartezeitVerlauf;
  initial: Meldung;
  istGast?: boolean;
}) {
  const { token, widget, reset, erforderlich } = useTurnstile();
  const [detailOffen, setDetailOffen] = useState(false);
  const [formularOffen, setFormularOffen] = useState(false);
  const [antragDatum, setAntragDatum] = useState(initial?.antrag_datum ?? "");
  const [rechnungErhalten, setRechnungErhalten] = useState(initial?.rechnung_erhalten ?? false);
  const [rechnungDatum, setRechnungDatum] = useState(initial?.rechnung_datum ?? "");
  const [terminErhalten, setTerminErhalten] = useState(initial?.termin_erhalten ?? false);
  const [pruefungsdatum, setPruefungsdatum] = useState(initial?.pruefungsdatum ?? "");
  const [speichert, setSpeichert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function speichern() {
    setSpeichert(true);
    setFehler(null);
    const res = await fetch("/api/wartezeit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        antragDatum,
        rechnungErhalten,
        rechnungDatum: rechnungErhalten ? rechnungDatum : null,
        terminErhalten,
        pruefungsdatum: terminErhalten ? pruefungsdatum : null,
        turnstileToken: token,
      }),
    });
    setSpeichert(false);
    if (res.ok) {
      // Harter Reload statt router.refresh(): der gecachte Durchschnitt wird
      // serverseitig per revalidateTag invalidiert, aber der Router-Cache
      // holt die frische RSC-Payload im Dev-Modus nicht immer zuverlässig ab.
      window.location.reload();
    } else {
      reset();
      const data = await res.json().catch(() => null);
      setFehler(data?.error ?? "Speichern fehlgeschlagen");
    }
  }

  const gueltig =
    antragDatum !== "" &&
    (!rechnungErhalten || rechnungDatum !== "") &&
    (!terminErhalten || pruefungsdatum !== "");

  return (
    <>
      <button
        type="button"
        onClick={() => setDetailOffen(true)}
        aria-label="Wartezeit-Details"
        className="flex h-10 items-center gap-1 rounded-full bg-white px-3 text-xs font-semibold text-zinc-700 shadow-sm"
      >
        ⏱ {badgeText}
      </button>

      {detailOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-left shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold">Ø Wartezeit</h2>
              <button
                type="button"
                onClick={() => setDetailOffen(false)}
                className="text-sm text-zinc-500"
              >
                Schließen
              </button>
            </div>
            <WartezeitGraph verlauf={verlauf} antragDatum={initial?.antrag_datum ?? null} />
            <button
              type="button"
              onClick={() => setFormularOffen(true)}
              className="mt-3 text-sm text-accent hover:underline"
            >
              {istGast
                ? "Meine Wartezeit anonym melden"
                : "Meine Daten eintragen/aktualisieren"}
            </button>
          </div>
        </div>
      )}

      {formularOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-left shadow-lg">
            <h2 className="text-sm font-semibold">Meine Wartezeit-Daten</h2>
            {istGast && (
              <p className="mt-1 text-xs text-zinc-500">
                Wird anonym gemeldet und fließt in den Community-Schnitt ein. Als Gast
                kannst du deine Meldung später nicht mehr ändern.
              </p>
            )}

            <div className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Antragsdatum
                <input
                  type="date"
                  value={antragDatum}
                  onChange={(e) => setAntragDatum(e.target.value)}
                  className="kp-input"
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rechnungErhalten}
                  onChange={(e) => setRechnungErhalten(e.target.checked)}
                  className="h-4 w-4 accent-[#3797f0]"
                />
                Rechnung erhalten
              </label>
              {rechnungErhalten && (
                <label className="flex flex-col gap-1 text-sm">
                  Rechnungsdatum
                  <input
                    type="date"
                    value={rechnungDatum}
                    onChange={(e) => setRechnungDatum(e.target.value)}
                    className="kp-input"
                  />
                </label>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={terminErhalten}
                  onChange={(e) => setTerminErhalten(e.target.checked)}
                  className="h-4 w-4 accent-[#3797f0]"
                />
                Prüfungstermin erhalten
              </label>
              {terminErhalten && (
                <label className="flex flex-col gap-1 text-sm">
                  Prüfungsdatum
                  <input
                    type="date"
                    value={pruefungsdatum}
                    onChange={(e) => setPruefungsdatum(e.target.value)}
                    className="kp-input"
                  />
                </label>
              )}
            </div>

            {fehler && <p className="mt-2 text-sm text-red-600">{fehler}</p>}

            <div className="mt-3">{widget}</div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormularOffen(false)}
                className="rounded-full px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={!gueltig || speichert || (erforderlich && !token)}
                onClick={speichern}
                className="kp-btn-primary py-1.5"
              >
                {istGast ? "Anonym melden" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
