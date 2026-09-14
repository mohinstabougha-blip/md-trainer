"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { StrukturierterText } from "@/components/strukturierter-text";
import { MusterantwortText } from "@/components/musterantwort-text";
import { ZoombaresBild } from "@/components/zoombares-bild";

type Treffer = {
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

export function SucheBar() {
  const [text, setText] = useState("");
  const [treffer, setTreffer] = useState<Treffer[]>([]);
  const [status, setStatus] = useState<"leer" | "laden" | "fertig" | "fehler">("leer");
  const [offen, setOffen] = useState<Set<number>>(new Set());
  const abbruch = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) {
      abbruch.current?.abort();
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setTreffer([]);
      setStatus("leer");
      return;
    }

    const t = setTimeout(async () => {
      abbruch.current?.abort();
      const ac = new AbortController();
      abbruch.current = ac;
      setStatus("laden");
      try {
        const res = await fetch(`/api/suche?q=${encodeURIComponent(q)}`, { signal: ac.signal });
        if (!res.ok) throw new Error("Suche fehlgeschlagen");
        const data = await res.json();
        setTreffer((data.fragen as Treffer[]) ?? []);
        setStatus("fertig");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setStatus("fehler");
      }
    }, 250);

    return () => clearTimeout(t);
  }, [text]);

  function umschaltenOffen(id: number) {
    setOffen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto w-full max-w-xl px-6 pt-4">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
          🔍
        </span>
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Fragen & Antworten durchsuchen…"
          className="kp-input w-full py-2.5 pl-9 pr-3 text-sm"
        />
      </div>

      {status !== "leer" && (
        <div className="mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-zinc-100 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {status === "laden" && (
            <p className="px-2 py-3 text-sm text-zinc-500 dark:text-zinc-400">Suche läuft…</p>
          )}
          {status === "fehler" && (
            <p className="px-2 py-3 text-sm text-red-700 dark:text-red-400">Das hat nicht geklappt.</p>
          )}
          {status === "fertig" && treffer.length === 0 && (
            <p className="px-2 py-3 text-sm text-zinc-500 dark:text-zinc-400">Keine Treffer.</p>
          )}
          {status === "fertig" &&
            treffer.map((t) => {
              const istOffen = offen.has(t.id);
              return (
                <div key={t.id} className="border-b border-zinc-100 p-2 last:border-b-0 dark:border-zinc-800">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t.modul} · {t.kurs} · Teil {t.teil}
                    </span>
                    <Link
                      href={`/session?modus=ids&ids=${t.id}&teil=voll&sortierung=zufaellig`}
                      className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent hover:bg-accent/20"
                    >
                      Üben
                    </Link>
                  </div>
                  <StrukturierterText text={t.frage} className="mt-1 text-sm" />
                  {t.bild_frage_url && (
                    <ZoombaresBild src={t.bild_frage_url} alt="Bild zur Frage" />
                  )}
                  <button
                    type="button"
                    onClick={() => umschaltenOffen(t.id)}
                    className="mt-1 text-xs font-medium text-accent hover:underline"
                  >
                    {istOffen ? "Antwort verbergen" : "Antwort anzeigen"}
                  </button>
                  {istOffen && (
                    <div className="mt-2 flex flex-col gap-2 rounded-xl bg-violet-50/50 p-2 dark:bg-violet-950/40">
                      <MusterantwortText text={t.musterantwort} className="text-sm leading-relaxed" />
                      {t.bild_antwort_url && (
                        <ZoombaresBild src={t.bild_antwort_url} alt="Bild zur Musterantwort" />
                      )}
                      {t.hilfe_hinweis && (
                        <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                          💡 {t.hilfe_hinweis}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
