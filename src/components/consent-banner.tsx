"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsent, setConsent, CONSENT_EVENT } from "@/lib/consent";

// Schlanker Cookie-Hinweis: erscheint, solange keine Wahl getroffen wurde.
// „Akzeptieren" schaltet den Meta Pixel frei, „Ablehnen" lädt nichts.
export function ConsentBanner() {
  const [sichtbar, setSichtbar] = useState(false);

  useEffect(() => {
    const sync = () => setSichtbar(getConsent() === null);
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  if (!sichtbar) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie-Hinweis"
      className="fixed bottom-20 left-3 right-3 z-50 rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-lg sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm"
    >
      <p className="text-zinc-700">
        Wir verwenden optionale Cookies für Reichweitenmessung und Werbung (Meta Pixel) –
        nur mit deiner Einwilligung. Für das Training ist keine Zustimmung nötig. Details in
        der{" "}
        <Link href="/datenschutz" className="text-accent underline">
          Datenschutzerklärung
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setConsent("granted")}
          className="kp-btn-primary flex-1 py-2"
        >
          Akzeptieren
        </button>
        <button
          type="button"
          onClick={() => setConsent("denied")}
          className="flex-1 rounded-full border border-zinc-300 py-2 font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Ablehnen
        </button>
      </div>
    </div>
  );
}
