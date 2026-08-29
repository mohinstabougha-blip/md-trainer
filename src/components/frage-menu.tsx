"use client";

import { useState } from "react";
import Link from "next/link";

export function FrageMenu({
  istAdmin,
  ungeleseneNachrichten,
}: {
  istAdmin: boolean;
  ungeleseneNachrichten: number;
}) {
  const [offen, setOffen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Menü"
        onClick={() => setOffen((v) => !v)}
        className="text-lg leading-none"
      >
        ☰
      </button>
      {offen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOffen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 flex w-60 flex-col gap-1 rounded-2xl bg-white p-2 text-sm shadow-lg">
            <Link
              href="/"
              className="rounded-xl px-3 py-2 hover:bg-zinc-100"
              onClick={() => setOffen(false)}
            >
              Zurück zur Trainer-Hauptseite
            </Link>
            <Link
              href="/marktplatz/nachrichten"
              className="rounded-xl px-3 py-2 hover:bg-zinc-100"
              onClick={() => setOffen(false)}
            >
              Nachrichten{ungeleseneNachrichten > 0 && ` (${ungeleseneNachrichten})`}
            </Link>
            <Link
              href="/marktplatz"
              className="rounded-xl px-3 py-2 hover:bg-zinc-100"
              onClick={() => setOffen(false)}
            >
              Marktplatz
            </Link>
            <Link
              href="/einstellungen"
              className="rounded-xl px-3 py-2 hover:bg-zinc-100"
              onClick={() => setOffen(false)}
            >
              Profil/Einstellungen
            </Link>
            {istAdmin && (
              <Link
                href="/admin/fragen"
                className="rounded-xl px-3 py-2 hover:bg-zinc-100"
                onClick={() => setOffen(false)}
              >
                Admin-Bereich
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
