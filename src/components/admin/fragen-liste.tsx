"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminQuestion } from "@/lib/admin-data";

const FILTER_STORAGE_KEY = "admin-fragen-filter";

const STANDARD_BREITEN = {
  modul: 160,
  kurs: 200,
  teil: 70,
  frage: 340,
  quelle: 150,
  geprueft: 110,
} as const;

const AKTIONEN_BREITE = 150;

type SpaltenKey = keyof typeof STANDARD_BREITEN;

function SpaltenGriff({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      aria-hidden="true"
      className="absolute right-0 top-0 z-10 h-full w-1.5 cursor-col-resize select-none hover:bg-accent/40"
    />
  );
}

export function FragenListe({ fragen }: { fragen: AdminQuestion[] }) {
  const router = useRouter();
  const [suche, setSuche] = useState("");
  const [modulFilter, setModulFilter] = useState("");
  const [teilFilter, setTeilFilter] = useState("");
  const [quelleFilter, setQuelleFilter] = useState("");
  const [pruefungszentrumFilter, setPruefungszentrumFilter] = useState("");
  const [vonDatum, setVonDatum] = useState("");
  const [bisDatum, setBisDatum] = useState("");
  const [nurUngeprueft, setNurUngeprueft] = useState(false);
  const [loeschtId, setLoeschtId] = useState<number | null>(null);
  const [gepruefteIds, setGepruefteIds] = useState<Map<number, boolean>>(new Map());
  const [toggeltId, setToggeltId] = useState<number | null>(null);
  const [breiten, setBreiten] = useState<Record<SpaltenKey, number>>(STANDARD_BREITEN);
  const ziehendRef = useRef<{ spalte: SpaltenKey; startX: number; startBreite: number } | null>(
    null
  );
  // Verhindert, dass der Speicher-Effekt beim allerersten Lauf (noch mit den
  // Default-Werten von VOR der Wiederherstellung aus sessionStorage) den
  // gerade erst gelesenen gespeicherten Filter sofort wieder überschreibt.
  const ersterSpeicherLauf = useRef(true);

  // Gespeicherten Filter erst NACH dem ersten Render einlesen: sessionStorage
  // existiert serverseitig nicht, ein Lesen direkt im useState-Initializer
  // würde zu einem Hydration-Mismatch führen.
  useEffect(() => {
    try {
      const roh = sessionStorage.getItem(FILTER_STORAGE_KEY);
      if (!roh) return;
      const werte = JSON.parse(roh);
      // Restore aus sessionStorage ist nur nach dem Mount möglich (serverseitig
      // nicht verfügbar) — ein einmaliger Zusatz-Render danach ist hier bewusst.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuche(werte.suche ?? "");
      setModulFilter(werte.modulFilter ?? "");
      setTeilFilter(werte.teilFilter ?? "");
      setQuelleFilter(werte.quelleFilter ?? "");
      setPruefungszentrumFilter(werte.pruefungszentrumFilter ?? "");
      setVonDatum(werte.vonDatum ?? "");
      setBisDatum(werte.bisDatum ?? "");
      setNurUngeprueft(werte.nurUngeprueft ?? false);
    } catch {
      // sessionStorage evtl. nicht verfügbar (z.B. privater Modus) — dann ohne gespeicherten Filter starten.
    }
  }, []);

  useEffect(() => {
    if (ersterSpeicherLauf.current) {
      ersterSpeicherLauf.current = false;
      return;
    }
    try {
      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify({
          suche,
          modulFilter,
          teilFilter,
          quelleFilter,
          pruefungszentrumFilter,
          vonDatum,
          bisDatum,
          nurUngeprueft,
        })
      );
    } catch {
      // ignorieren, s.o.
    }
  }, [
    suche,
    modulFilter,
    teilFilter,
    quelleFilter,
    pruefungszentrumFilter,
    vonDatum,
    bisDatum,
    nurUngeprueft,
  ]);

  function ziehenBewegen(e: MouseEvent) {
    const ziehend = ziehendRef.current;
    if (!ziehend) return;
    const neueBreite = Math.max(60, ziehend.startBreite + (e.clientX - ziehend.startX));
    setBreiten((b) => ({ ...b, [ziehend.spalte]: neueBreite }));
  }

  function ziehenEnde() {
    ziehendRef.current = null;
    document.removeEventListener("mousemove", ziehenBewegen);
    document.removeEventListener("mouseup", ziehenEnde);
  }

  function ziehenStart(spalte: SpaltenKey, e: React.MouseEvent) {
    e.preventDefault();
    ziehendRef.current = { spalte, startX: e.clientX, startBreite: breiten[spalte] };
    document.addEventListener("mousemove", ziehenBewegen);
    document.addEventListener("mouseup", ziehenEnde);
  }

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", ziehenBewegen);
      document.removeEventListener("mouseup", ziehenEnde);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur Cleanup beim Unmount, Handler sind über den Ref stabil.
  }, []);

  const alleModule = useMemo(() => [...new Set(fragen.map((f) => f.modul))].sort(), [fragen]);
  const alleZentren = useMemo(
    () => [...new Set(fragen.map((f) => f.pruefungszentrum).filter((z): z is string => !!z))].sort(),
    [fragen]
  );

  function istGeprueft(f: AdminQuestion): boolean {
    return gepruefteIds.get(f.id) ?? f.geprueft;
  }

  const gefiltert = fragen.filter((f) => {
    if (modulFilter && f.modul !== modulFilter) return false;
    if (teilFilter && String(f.teil) !== teilFilter) return false;
    if (quelleFilter && f.quelle_typ !== quelleFilter) return false;
    if (pruefungszentrumFilter && f.pruefungszentrum !== pruefungszentrumFilter) return false;
    if (vonDatum && f.erstellt_am.slice(0, 10) < vonDatum) return false;
    if (bisDatum && f.erstellt_am.slice(0, 10) > bisDatum) return false;
    if (nurUngeprueft && istGeprueft(f)) return false;
    if (suche) {
      const q = suche.toLowerCase();
      if (
        !f.frage.toLowerCase().includes(q) &&
        !f.kurs.toLowerCase().includes(q) &&
        !f.modul.toLowerCase().includes(q) &&
        !(f.pruefungszentrum ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  async function loeschen(id: number) {
    if (!confirm("Diese Frage wirklich löschen?")) return;
    setLoeschtId(id);
    const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    setLoeschtId(null);
    if (res.ok) router.refresh();
  }

  async function geprueftUmschalten(f: AdminQuestion) {
    const neu = !istGeprueft(f);
    setToggeltId(f.id);
    setGepruefteIds((m) => new Map(m).set(f.id, neu));
    const res = await fetch(`/api/admin/questions/${f.id}/geprueft`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ geprueft: neu }),
    });
    setToggeltId(null);
    if (res.ok) {
      router.refresh();
    } else {
      // Fehlgeschlagen: optimistischen Wert zurücknehmen.
      setGepruefteIds((m) => new Map(m).set(f.id, !neu));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Fragen ({fragen.length}, {gefiltert.length} angezeigt)
        </h1>
        <Link href="/admin/fragen/neu" className="kp-btn-primary py-1.5">
          Neue Frage
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Suche in Frage/Modul/Kurs/Prüfungszentrum…"
          className="flex-1 kp-input"
        />
        <select
          value={modulFilter}
          onChange={(e) => setModulFilter(e.target.value)}
          className="kp-input"
        >
          <option value="">Alle Module</option>
          {alleModule.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={teilFilter}
          onChange={(e) => setTeilFilter(e.target.value)}
          className="kp-input"
        >
          <option value="">Alle Teile</option>
          <option value="1">Teil 1</option>
          <option value="2">Teil 2</option>
          <option value="3">Teil 3</option>
        </select>
        <select
          value={quelleFilter}
          onChange={(e) => setQuelleFilter(e.target.value)}
          className="kp-input"
        >
          <option value="">Alle Quellen</option>
          <option value="nutzer">Nutzer-erstellt</option>
          <option value="telegram">Telegram-Import</option>
        </select>
        <select
          value={pruefungszentrumFilter}
          onChange={(e) => setPruefungszentrumFilter(e.target.value)}
          className="kp-input"
        >
          <option value="">Alle Prüfungszentren</option>
          {alleZentren.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-zinc-500">
          von
          <input
            type="date"
            value={vonDatum}
            onChange={(e) => setVonDatum(e.target.value)}
            className="kp-input"
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-zinc-500">
          bis
          <input
            type="date"
            value={bisDatum}
            onChange={(e) => setBisDatum(e.target.value)}
            className="kp-input"
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-zinc-500">
          <input
            type="checkbox"
            checked={nurUngeprueft}
            onChange={(e) => setNurUngeprueft(e.target.checked)}
          />
          nur ungeprüfte anzeigen
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="text-left text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: breiten.modul }} />
            <col style={{ width: breiten.kurs }} />
            <col style={{ width: breiten.teil }} />
            <col style={{ width: breiten.frage }} />
            <col style={{ width: breiten.quelle }} />
            <col style={{ width: breiten.geprueft }} />
            <col style={{ width: AKTIONEN_BREITE }} />
          </colgroup>
          <thead className="bg-zinc-50">
            <tr>
              <th className="relative px-3 py-2">
                Modul
                <SpaltenGriff onMouseDown={(e) => ziehenStart("modul", e)} />
              </th>
              <th className="relative px-3 py-2">
                Kurs
                <SpaltenGriff onMouseDown={(e) => ziehenStart("kurs", e)} />
              </th>
              <th className="relative px-3 py-2">
                Teil
                <SpaltenGriff onMouseDown={(e) => ziehenStart("teil", e)} />
              </th>
              <th className="relative px-3 py-2">
                Frage
                <SpaltenGriff onMouseDown={(e) => ziehenStart("frage", e)} />
              </th>
              <th className="relative px-3 py-2">
                Quelle
                <SpaltenGriff onMouseDown={(e) => ziehenStart("quelle", e)} />
              </th>
              <th className="relative px-3 py-2">
                Geprüft
                <SpaltenGriff onMouseDown={(e) => ziehenStart("geprueft", e)} />
              </th>
              <th className="sticky right-0 border-l border-zinc-200 bg-zinc-50 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {gefiltert.map((f) => (
              <tr key={f.id} className="border-t border-zinc-100">
                <td className="truncate px-3 py-2">{f.modul}</td>
                <td className="truncate px-3 py-2">{f.kurs}</td>
                <td className="px-3 py-2">{f.teil}</td>
                <td className="truncate px-3 py-2">{f.frage}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        f.quelle_typ === "telegram"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {f.quelle_typ === "telegram" ? "Telegram" : "Nutzer"}
                    </span>
                    {f.pruefungszentrum && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {f.pruefungszentrum}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    disabled={toggeltId === f.id}
                    onClick={() => geprueftUmschalten(f)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium disabled:opacity-40 ${
                      istGeprueft(f)
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {istGeprueft(f) ? "Geprüft ✓" : "Ungeprüft"}
                  </button>
                </td>
                <td className="sticky right-0 whitespace-nowrap border-l border-zinc-200 bg-white px-3 py-2 text-right">
                  <Link href={`/admin/fragen/${f.id}`} className="mr-3 text-sm hover:underline">
                    Bearbeiten
                  </Link>
                  <button
                    type="button"
                    disabled={loeschtId === f.id}
                    onClick={() => loeschen(f.id)}
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
    </div>
  );
}
