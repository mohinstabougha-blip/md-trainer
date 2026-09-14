"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAktiveSession, clearAktiveSession, type AktiveSession } from "@/lib/aktive-session";

// Startseiten-Karte "Weitermachen": erscheint nur, wenn im localStorage ein
// angefangener, noch nicht beendeter Durchgang liegt.
export function WeitermachenKarte() {
  const [session, setSession] = useState<AktiveSession | null>(null);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    const s = getAktiveSession();
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setSession(s && s.index > 0 && s.index < s.gesamt ? s : null);
    setGeladen(true);
  }, []);

  if (!geladen || !session) return null;

  const beantwortet = session.index;
  const prozent = Math.round((beantwortet / Math.max(session.gesamt, 1)) * 100);

  function verwerfen() {
    clearAktiveSession();
    setSession(null);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-6 pt-4">
      <div className="kp-card flex flex-col gap-3 border border-accent/20 bg-accent/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Angefangener Durchgang</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {session.titel} · Frage {beantwortet + 1} von {session.gesamt}
            </p>
          </div>
          <button
            type="button"
            onClick={verwerfen}
            className="shrink-0 text-xs font-medium text-zinc-400 hover:text-red-600 hover:underline dark:text-zinc-500"
          >
            Verwerfen
          </button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div className="h-full rounded-full bg-accent" style={{ width: `${prozent}%` }} />
        </div>
        <Link href={session.href} className="kp-btn-primary py-3 text-center">
          Weitermachen
        </Link>
      </div>
    </div>
  );
}
