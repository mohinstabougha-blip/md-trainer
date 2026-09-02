"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminQuestion } from "@/lib/admin-data";
import { useZeilenAuswahl } from "@/components/admin/use-zeilen-auswahl";

const FILTER_STORAGE_KEY = "admin-fragen-filter";

const STANDARD_BREITEN = {
  modul: 120,
  kurs: 140,
  teil: 44,
  frage: 0, // 0 = nimmt den restlichen Platz (flexibel)
  quelle: 96,
  geprueft: 84,
} as const;

const AKTIONEN_BREITE = 118;

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
  const [bulkModul, setBulkModul] = useState("");
  const [bulkLaeuft, setBulkLaeuft] = useState(false);
  const [bulkFehler, setBulkFehler] = useState<string | null>(null);
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

  const filterAktiv = Boolean(
    suche ||
      modulFilter ||
      teilFilter ||
      quelleFilter ||
      pruefungszentrumFilter ||
      vonDatum ||
      bisDatum ||
      nurUngeprueft
  );

  function filterZuruecksetzen() {
    setSuche("");
    setModulFilter("");
    setTeilFilter("");
    setQuelleFilter("");
    setPruefungszentrumFilter("");
    setVonDatum("");
    setBisDatum("");
    setNurUngeprueft(false);
    try {
      sessionStorage.removeItem(FILTER_STORAGE_KEY);
    } catch {
      // ignorieren
    }
  }

  const gefilterteIds = gefiltert.map((f) => f.id);
  const { ausgewaehlt, setAusgewaehlt, zeileMausRunter, zeileMausRein, alleUmschalten } =
    useZeilenAuswahl(gefilterteIds);
  const alleGefiltertAusgewaehlt =
    gefilterteIds.length > 0 && gefilterteIds.every((id) => ausgewaehlt.has(id));

  async function bulkModulAnwenden() {
    const ids = [...ausgewaehlt];
    const modul = bulkModul.trim();
    if (ids.length === 0 || !modul) return;
    if (!confirm(`Modul von ${ids.length} Frage(n) auf „${modul}" ändern?`)) return;
    setBulkLaeuft(true);
    setBulkFehler(null);
    const res = await fetch("/api/admin/questions/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, modul }),
    });
    setBulkLaeuft(false);
    if (res.ok) {
      setAusgewaehlt(new Set());
      setBulkModul("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setBulkFehler(data?.error ?? "Aktualisierung fehlgeschlagen");
    }
  }

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
          Fragen ({fragen.length}, {gefiltert.length} angezeigt
          {ausgewaehlt.size > 0 && `, ${ausgewaehlt.size} ausgewählt`})
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
        {filterAktiv && (
          <button
            type="button"
            onClick={filterZuruecksetzen}
            className="text-sm text-accent hover:underline"
          >
            Filter zurücksetzen
          </button>
        )}
        {vonDatum && bisDatum && vonDatum > bisDatum && (
          <span className="text-sm text-red-600">von-Datum liegt nach bis-Datum</span>
        )}
      </div>

      {ausgewaehlt.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-accent/10 px-3 py-2 text-sm">
          <span className="font-medium">{ausgewaehlt.size} ausgewählt</span>
          <span className="text-xs text-zinc-500">(Tipp: über die Kästchen ziehen wählt mehrere auf einmal)</span>
          <span className="text-zinc-500">→ Modul ändern auf</span>
          <input
            list="admin-bulk-module"
            value={bulkModul}
            onChange={(e) => setBulkModul(e.target.value)}
            placeholder="Modulname"
            className="kp-input py-1"
          />
          <datalist id="admin-bulk-module">
            {alleModule.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <button
            type="button"
            disabled={!bulkModul.trim() || bulkLaeuft}
            onClick={bulkModulAnwenden}
            className="kp-btn-primary py-1.5"
          >
            {bulkLaeuft ? "Speichert…" : "Anwenden"}
          </button>
          <button
            type="button"
            onClick={() => setAusgewaehlt(new Set())}
            className="text-zinc-600 hover:underline"
          >
            Auswahl aufheben
          </button>
          {bulkFehler && <span className="text-red-600">{bulkFehler}</span>}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ width: breiten.modul }} />
            <col style={{ width: breiten.kurs }} />
            <col style={{ width: breiten.teil }} />
            <col style={breiten.frage ? { width: breiten.frage } : undefined} />
            <col style={{ width: breiten.quelle }} />
            <col style={{ width: breiten.geprueft }} />
            <col style={{ width: AKTIONEN_BREITE }} />
          </colgroup>
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-2 py-1.5">
                <input
                  type="checkbox"
                  checked={alleGefiltertAusgewaehlt}
                  onChange={alleUmschalten}
                  aria-label="Alle angezeigten Fragen auswählen"
                />
              </th>
              <th className="relative px-2 py-1.5">
                Modul
                <SpaltenGriff onMouseDown={(e) => ziehenStart("modul", e)} />
              </th>
              <th className="relative px-2 py-1.5">
                Kurs
                <SpaltenGriff onMouseDown={(e) => ziehenStart("kurs", e)} />
              </th>
              <th className="relative px-2 py-1.5">
                Teil
                <SpaltenGriff onMouseDown={(e) => ziehenStart("teil", e)} />
              </th>
              <th className="relative px-2 py-1.5">
                Frage
                <SpaltenGriff onMouseDown={(e) => ziehenStart("frage", e)} />
              </th>
              <th className="relative px-2 py-1.5">
                Quelle
                <SpaltenGriff onMouseDown={(e) => ziehenStart("quelle", e)} />
              </th>
              <th className="relative px-2 py-1.5">
                Geprüft
                <SpaltenGriff onMouseDown={(e) => ziehenStart("geprueft", e)} />
              </th>
              <th className="sticky right-0 border-l border-zinc-200 bg-zinc-50 px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {gefiltert.map((f, index) => (
              <tr
                key={f.id}
                className={`border-t border-zinc-100 ${ausgewaehlt.has(f.id) ? "bg-accent/5" : ""}`}
              >
                <td
                  className="cursor-pointer select-none px-2 py-1.5"
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    zeileMausRunter(index, ev.shiftKey);
                  }}
                  onMouseEnter={() => zeileMausRein(index)}
                >
                  <input
                    type="checkbox"
                    checked={ausgewaehlt.has(f.id)}
                    readOnly
                    tabIndex={-1}
                    aria-label={`Frage ${f.id} auswählen`}
                    className="pointer-events-none"
                  />
                </td>
                <td className="truncate px-2 py-1.5" title={f.modul}>{f.modul}</td>
                <td className="truncate px-2 py-1.5" title={f.kurs}>{f.kurs}</td>
                <td className="px-2 py-1.5">{f.teil}</td>
                <td className="truncate px-2 py-1.5" title={f.frage}>{f.frage}</td>
                <td className="px-2 py-1.5">
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
                <td className="px-2 py-1.5">
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
                <td className="sticky right-0 whitespace-nowrap border-l border-zinc-200 bg-white px-2 py-1.5 text-right">
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
