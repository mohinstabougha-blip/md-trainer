"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WartezeitMeldungAdmin } from "@/lib/admin-data";

function formatDatum(datum: string | null): string {
  if (!datum) return "—";
  return new Date(datum).toLocaleDateString("de-DE");
}

export function WartezeitMeldungenListe({ meldungen }: { meldungen: WartezeitMeldungAdmin[] }) {
  const router = useRouter();
  const [quelleFilter, setQuelleFilter] = useState("");
  const [loeschtId, setLoeschtId] = useState<number | null>(null);

  const telegramAnzahl = useMemo(
    () => meldungen.filter((m) => m.quelle_typ === "telegram").length,
    [meldungen]
  );

  const gefiltert = quelleFilter
    ? meldungen.filter((m) => m.quelle_typ === quelleFilter)
    : meldungen;

  async function loeschen(id: number) {
    if (!confirm("Diese Wartezeit-Meldung wirklich löschen?")) return;
    setLoeschtId(id);
    const res = await fetch(`/api/admin/wartezeit/${id}`, { method: "DELETE" });
    setLoeschtId(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Wartezeit-Meldungen ({meldungen.length}, davon {telegramAnzahl} aus Telegram)
        </h1>
        <select
          value={quelleFilter}
          onChange={(e) => setQuelleFilter(e.target.value)}
          className="kp-input"
        >
          <option value="">Alle Quellen</option>
          <option value="nutzer">Nutzer-erstellt</option>
          <option value="telegram">Telegram-Import</option>
        </select>
      </div>

      {gefiltert.length === 0 ? (
        <p className="text-sm text-zinc-500">Keine Meldungen gefunden.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-2 py-1.5">Quelle</th>
                <th className="px-2 py-1.5">Antragsdatum</th>
                <th className="px-2 py-1.5">Rechnung erhalten</th>
                <th className="px-2 py-1.5">Prüfungstermin</th>
                <th className="px-2 py-1.5">Erstellt</th>
                <th className="px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {gefiltert.map((m) => (
                <tr key={m.id} className="border-t border-zinc-100">
                  <td className="px-2 py-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.quelle_typ === "telegram"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {m.quelle_typ === "telegram" ? "Telegram" : "Nutzer"}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">{formatDatum(m.antrag_datum)}</td>
                  <td className="px-2 py-1.5">
                    {m.rechnung_erhalten ? formatDatum(m.rechnung_datum) : "—"}
                  </td>
                  <td className="px-2 py-1.5">
                    {m.termin_erhalten ? formatDatum(m.pruefungsdatum) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-zinc-500">
                    {new Date(m.erstellt_am).toLocaleDateString("de-DE")}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right">
                    <button
                      type="button"
                      disabled={loeschtId === m.id}
                      onClick={() => loeschen(m.id)}
                      className="text-sm text-red-600 hover:underline disabled:opacity-40"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
