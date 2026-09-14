"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { StrukturierterText } from "@/components/strukturierter-text";
import { MusterantwortText } from "@/components/musterantwort-text";
import { ZoombaresBild } from "@/components/zoombares-bild";
import { getGastFavoriten, toggleGastFavorit } from "@/lib/favoriten";

type FrageDetail = {
  id: number;
  modul: string;
  kurs: string;
  teil: number;
  frage: string;
  musterantwort: string;
  hilfe_hinweis: string | null;
  bild_frage_url: string | null;
  bild_antwort_url: string | null;
};

export function FavoritenListe({ istGast }: { istGast: boolean }) {
  const [status, setStatus] = useState<"laden" | "fertig" | "fehler">("laden");
  const [fragen, setFragen] = useState<FrageDetail[]>([]);
  const [offen, setOffen] = useState<Set<number>>(new Set());

  const laden = useCallback(async () => {
    setStatus("laden");
    try {
      let ids: number[];
      if (istGast) {
        ids = getGastFavoriten();
      } else {
        const res = await fetch("/api/favoriten");
        if (!res.ok) throw new Error("Favoriten konnten nicht geladen werden");
        ids = ((await res.json()).ids as number[]) ?? [];
      }

      if (ids.length === 0) {
        setFragen([]);
        setStatus("fertig");
        return;
      }

      const res = await fetch("/api/fragen-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Fragen konnten nicht geladen werden");
      const data = await res.json();
      setFragen((data.fragen as FrageDetail[]) ?? []);
      setStatus("fertig");
    } catch {
      setStatus("fehler");
    }
  }, [istGast]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void laden();
  }, [laden]);

  function umschaltenOffen(id: number) {
    setOffen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function entfernen(id: number) {
    setFragen((prev) => prev.filter((f) => f.id !== id));
    if (istGast) {
      toggleGastFavorit(id);
      return;
    }
    try {
      await fetch("/api/favoriten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: id, favorit: false }),
      });
    } catch {
      void laden(); // Fehlschlag -> Liste neu laden
    }
  }

  if (status === "laden") {
    return (
      <p className="mx-auto max-w-2xl px-6 py-10 text-sm text-zinc-500 dark:text-zinc-400">
        Favoriten werden geladen…
      </p>
    );
  }

  if (status === "fehler") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-3 px-6 py-10">
        <p className="text-sm text-red-700 dark:text-red-400">Das hat nicht geklappt.</p>
        <button type="button" onClick={() => void laden()} className="kp-btn-primary px-4 py-2 text-sm">
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (fragen.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-3 px-6 py-10">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Noch keine Favoriten. Tippe während einer Übung auf den Stern ☆, um eine Frage zu merken.
        </p>
        <Link href="/" className="text-sm text-accent hover:underline">
          Zur Startseite
        </Link>
      </div>
    );
  }

  const idsParam = fragen.map((f) => f.id).join(",");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {fragen.length} Favorit{fragen.length === 1 ? "" : "en"}
        </p>
        <Link
          href={`/session?modus=ids&ids=${idsParam}&teil=voll&sortierung=zufaellig`}
          className="kp-btn-primary px-4 py-2 text-sm"
        >
          Als Karteikarten üben
        </Link>
      </div>

      {fragen.map((f) => {
        const istOffen = offen.has(f.id);
        return (
          <div key={f.id} className="kp-card flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {f.modul} · {f.kurs} · Teil {f.teil}
              </span>
              <button
                type="button"
                onClick={() => entfernen(f.id)}
                className="shrink-0 text-xs font-medium text-zinc-400 hover:text-red-600 hover:underline dark:text-zinc-500"
              >
                Favorit entfernen
              </button>
            </div>

            <StrukturierterText text={f.frage} className="text-base" />
            {f.bild_frage_url && <ZoombaresBild src={f.bild_frage_url} alt="Bild zur Frage" />}

            <button
              type="button"
              onClick={() => umschaltenOffen(f.id)}
              className="self-start text-sm font-medium text-accent hover:underline"
            >
              {istOffen ? "Antwort verbergen" : "Antwort anzeigen"}
            </button>

            {istOffen && (
              <div className="flex flex-col gap-3 rounded-xl bg-violet-50/50 p-3 dark:bg-violet-950/40">
                <span className="inline-block self-start rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                  Musterantwort
                </span>
                <MusterantwortText text={f.musterantwort} className="text-sm leading-relaxed" />
                {f.bild_antwort_url && (
                  <ZoombaresBild src={f.bild_antwort_url} alt="Bild zur Musterantwort" />
                )}
                {f.hilfe_hinweis && (
                  <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    💡 {f.hilfe_hinweis}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
