"use client";

import { useEffect, useState } from "react";
import { getConsent, setConsent, resetConsent, CONSENT_EVENT } from "@/lib/consent";

// Für die Datenschutzseite: aktuellen Stand anzeigen und ändern können.
export function ConsentWiderruf() {
  const [wert, setWert] = useState<"granted" | "denied" | null>(null);

  useEffect(() => {
    const sync = () => setWert(getConsent());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  const text =
    wert === "granted"
      ? "Aktueller Stand: Marketing-Cookies (Meta Pixel) erlaubt."
      : wert === "denied"
        ? "Aktueller Stand: Marketing-Cookies abgelehnt."
        : "Aktueller Stand: noch keine Auswahl getroffen.";

  return (
    <div className="not-prose my-2 flex flex-col gap-2 rounded-xl bg-zinc-50 p-3 text-sm">
      <span className="text-zinc-600">{text}</span>
      <div className="flex flex-wrap gap-2">
        {wert !== "granted" && (
          <button
            type="button"
            onClick={() => setConsent("granted")}
            className="rounded-full border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-white"
          >
            Marketing-Cookies erlauben
          </button>
        )}
        {wert === "granted" && (
          <button
            type="button"
            onClick={() => {
              setConsent("denied");
              window.location.reload();
            }}
            className="rounded-full border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-white"
          >
            Einwilligung widerrufen
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            resetConsent();
            window.location.reload();
          }}
          className="rounded-full px-3 py-1.5 text-zinc-500 hover:bg-white"
        >
          Auswahl zurücksetzen
        </button>
      </div>
    </div>
  );
}
