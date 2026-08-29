"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Angebot } from "@/lib/marktplatz-types";
import { KATEGORIE_LABEL } from "@/lib/marktplatz-types";
import { nutzerName } from "@/lib/pseudonym";

export function AngeboteListe({
  angebote,
  aktuelleUserId,
  namen,
}: {
  angebote: Angebot[];
  aktuelleUserId: string;
  namen: Record<string, string>;
}) {
  const router = useRouter();
  const [suche, setSuche] = useState("");
  const [kategorieFilter, setKategorieFilter] = useState<string>("");
  const [nurMeine, setNurMeine] = useState(false);
  const [aendertId, setAendertId] = useState<number | null>(null);

  const gefiltert = useMemo(() => {
    return angebote.filter((a) => {
      if (nurMeine && a.user_id !== aktuelleUserId) return false;
      if (!nurMeine && a.status !== "aktiv" && a.user_id !== aktuelleUserId) return false;
      if (kategorieFilter && a.kategorie !== kategorieFilter) return false;
      if (suche) {
        const q = suche.toLowerCase();
        if (!a.titel.toLowerCase().includes(q) && !a.beschreibung.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [angebote, suche, kategorieFilter, nurMeine, aktuelleUserId]);

  async function statusAendern(id: number, neuerStatus: "aktiv" | "inaktiv") {
    setAendertId(id);
    const res = await fetch(`/api/marktplatz/angebote/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: neuerStatus }),
    });
    setAendertId(null);
    if (res.ok) router.refresh();
  }

  async function loeschen(id: number) {
    if (!confirm("Dieses Angebot wirklich löschen?")) return;
    setAendertId(id);
    const res = await fetch(`/api/marktplatz/angebote/${id}`, { method: "DELETE" });
    setAendertId(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Suche…"
          className="kp-input flex-1"
        />
        <select
          value={kategorieFilter}
          onChange={(e) => setKategorieFilter(e.target.value)}
          className="kp-input"
        >
          <option value="">Alle Kategorien</option>
          {Object.entries(KATEGORIE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={nurMeine}
            onChange={(e) => setNurMeine(e.target.checked)}
            className="accent-[#3797f0]"
          />
          Nur meine
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {gefiltert.length === 0 && (
          <p className="text-sm text-zinc-500">Keine Angebote gefunden.</p>
        )}
        {gefiltert.map((a) => (
          <div key={a.id} className="kp-card flex flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/marktplatz/${a.id}`} className="font-medium hover:underline">
                {a.titel}
              </Link>
              {a.status === "inaktiv" && (
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600">
                  inaktiv
                </span>
              )}
            </div>
            <p className="line-clamp-2 text-sm text-zinc-600">{a.beschreibung}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
              <span>{KATEGORIE_LABEL[a.kategorie]}</span>
              {a.preis && <span>{a.preis}</span>}
              <span>{nutzerName(a.user_id, namen, aktuelleUserId)}</span>
            </div>
            {a.user_id === aktuelleUserId && (
              <div className="mt-2 flex gap-3 text-sm">
                <button
                  type="button"
                  disabled={aendertId === a.id}
                  onClick={() => statusAendern(a.id, a.status === "aktiv" ? "inaktiv" : "aktiv")}
                  className="text-zinc-600 hover:underline disabled:opacity-40"
                >
                  {a.status === "aktiv" ? "Deaktivieren" : "Aktivieren"}
                </button>
                <button
                  type="button"
                  disabled={aendertId === a.id}
                  onClick={() => loeschen(a.id)}
                  className="text-red-600 hover:underline disabled:opacity-40"
                >
                  Löschen
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
