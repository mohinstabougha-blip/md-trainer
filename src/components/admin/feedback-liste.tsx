"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FeedbackGruppe } from "@/lib/admin-data";

const TYP_LABEL: Record<string, string> = {
  frage_fehlerhaft: "Frage fehlerhaft",
  antwort_fehlerhaft: "Antwort fehlerhaft",
  bild_fehlt_oder_falsch: "Bild fehlt oder falsch",
  sonstiges: "Sonstiges",
};

export function FeedbackListe({ gruppen }: { gruppen: FeedbackGruppe[] }) {
  const router = useRouter();
  const [erledigtId, setErledigtId] = useState<number | null>(null);

  async function alsErledigtMarkieren(id: number) {
    setErledigtId(id);
    const res = await fetch(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "erledigt" }),
    });
    setErledigtId(null);
    if (res.ok) router.refresh();
  }

  if (gruppen.length === 0) {
    return <p className="text-sm text-zinc-500">Keine offenen Meldungen.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {gruppen.map((g) => (
        <div key={g.questionId} className="kp-card">
          <div className="flex items-center justify-between">
            <Link href={`/admin/fragen/${g.questionId}`} className="font-medium hover:underline">
              {g.frage}
            </Link>
            <span className="text-sm text-zinc-500">
              {g.modul} / {g.kurs} · {g.eintraege.length} Meldung
              {g.eintraege.length !== 1 ? "en" : ""}
            </span>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {g.eintraege.map((e) => (
              <li
                key={e.id}
                className="flex items-start justify-between gap-4 rounded-xl bg-zinc-50 p-3 text-sm"
              >
                <div>
                  <span className="font-medium">{TYP_LABEL[e.typ] ?? e.typ}</span>
                  {e.kommentar && <p className="mt-1 text-zinc-600">{e.kommentar}</p>}
                  <p className="mt-1 text-xs text-zinc-400">
                    {new Date(e.erstellt_am).toLocaleString("de-DE")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={erledigtId === e.id}
                  onClick={() => alsErledigtMarkieren(e.id)}
                  className="whitespace-nowrap rounded-full border border-zinc-200 px-2 py-1 text-xs font-medium hover:bg-zinc-100 disabled:opacity-40"
                >
                  Als erledigt markieren
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
