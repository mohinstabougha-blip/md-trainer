"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import type { Einreichung } from "@/lib/einreichungen-types";
import { QUELLE_LABEL } from "@/lib/einreichungen-types";
import type { DuplikatTreffer } from "@/lib/duplikat-check";
import { useZeilenAuswahl } from "@/components/admin/use-zeilen-auswahl";
import { BildFeld } from "@/components/admin/bild-feld";

function DuplikatBadge({ score, onClick }: { score: number; onClick?: () => void }) {
  const text = `⚠ mögl. Duplikat ${Math.round(score * 100)} %`;
  if (!onClick) {
    return (
      <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        {text}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title="Nur mögliche Duplikate anzeigen"
      className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200"
    >
      {text}
    </button>
  );
}

function EinreichungKarte({
  e,
  namen,
  treffer,
}: {
  e: Einreichung;
  namen: Record<string, string>;
  treffer?: DuplikatTreffer;
}) {
  const router = useRouter();
  const [modul, setModul] = useState(e.modul ?? "");
  const [kurs, setKurs] = useState(e.kurs ?? "");
  const [teil, setTeil] = useState<1 | 2 | 3>((e.teil as 1 | 2 | 3) ?? 1);
  const [frage, setFrage] = useState(e.frage ?? "");
  const [musterantwort, setMusterantwort] = useState(e.antwort_vorschlag ?? "");
  const [hilfeHinweis, setHilfeHinweis] = useState(e.hilfe_hinweis ?? "");
  const [bildFrageUrl, setBildFrageUrl] = useState<string | null>(e.bild_frage_url);
  const [bildAntwortUrl, setBildAntwortUrl] = useState<string | null>(e.bild_antwort_url);
  const [adminKommentar, setAdminKommentar] = useState("");
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function freigeben() {
    setSendet(true);
    setFehler(null);
    const res = await fetch(`/api/admin/einreichungen/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aktion: "freigeben",
        modul,
        kurs,
        teil,
        frage,
        musterantwort,
        hilfe_hinweis: hilfeHinweis,
        bild_frage_url: bildFrageUrl,
        bild_antwort_url: bildAntwortUrl,
      }),
    });
    setSendet(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setFehler(data?.error ?? "Freigeben fehlgeschlagen");
    }
  }

  async function ablehnen() {
    setSendet(true);
    setFehler(null);
    const res = await fetch(`/api/admin/einreichungen/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktion: "ablehnen", adminKommentar }),
    });
    setSendet(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setFehler(data?.error ?? "Ablehnen fehlgeschlagen");
    }
  }

  const gueltig = modul.trim() && kurs.trim() && frage.trim() && musterantwort.trim();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <span>{e.typ === "einzelfrage" ? "Einzelfrage" : "Protokoll"}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              e.quelle_typ === "telegram"
                ? "bg-sky-100 text-sky-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {QUELLE_LABEL[e.quelle_typ]}
          </span>
        </div>
        <span>
          {e.user_id
            ? (namen[e.user_id] ?? `Nutzer-${e.user_id.slice(0, 6)}`)
            : "—"}{" "}
          · {new Date(e.erstellt_am).toLocaleString("de-DE")}
        </span>
      </div>

      {treffer && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="text-xs font-medium">
            ⚠ Mögliches Duplikat ({Math.round(treffer.score * 100)} % Textähnlichkeit) zu bestehender
            Frage #{treffer.questionId} · {treffer.modul} / {treffer.kurs}:
          </p>
          <p className="mt-1">{treffer.frage}</p>
        </div>
      )}

      {e.protokoll_text && (
        <div className="rounded-xl bg-white p-3 text-sm">
          <p className="mb-1 text-xs font-medium text-zinc-500">Eingereichter Protokoll-Text:</p>
          <p className="whitespace-pre-wrap text-zinc-700">{e.protokoll_text}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input
          value={modul}
          onChange={(ev) => setModul(ev.target.value)}
          placeholder="Modul"
          className="kp-input"
        />
        <input
          value={kurs}
          onChange={(ev) => setKurs(ev.target.value)}
          placeholder="Kurs"
          className="kp-input"
        />
      </div>
      <select
        value={teil}
        onChange={(ev) => setTeil(Number(ev.target.value) as 1 | 2 | 3)}
        className="kp-input w-32"
      >
        <option value={1}>Teil 1</option>
        <option value={2}>Teil 2</option>
        <option value={3}>Teil 3</option>
      </select>
      <textarea
        value={frage}
        onChange={(ev) => setFrage(ev.target.value)}
        placeholder="Frage"
        rows={2}
        className="kp-input"
      />
      <BildFeld label="Bild zur Frage" url={bildFrageUrl} onChange={setBildFrageUrl} />
      <textarea
        value={hilfeHinweis}
        onChange={(ev) => setHilfeHinweis(ev.target.value)}
        placeholder="Hilfe-Hinweis (optional, Strukturhilfe ohne Lösung)"
        rows={2}
        className="kp-input"
      />
      <textarea
        value={musterantwort}
        onChange={(ev) => setMusterantwort(ev.target.value)}
        placeholder="Musterantwort"
        rows={4}
        className="kp-input"
      />
      <BildFeld label="Bild zur Musterantwort" url={bildAntwortUrl} onChange={setBildAntwortUrl} />

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!gueltig || sendet}
          onClick={freigeben}
          className="kp-btn-primary py-1.5"
        >
          Freigeben (→ Fragendatenbank)
        </button>
        <input
          value={adminKommentar}
          onChange={(ev) => setAdminKommentar(ev.target.value)}
          placeholder="Ablehnungsgrund (optional)"
          className="kp-input flex-1 py-1.5"
        />
        <button
          type="button"
          disabled={sendet}
          onClick={ablehnen}
          className="rounded-full border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          Ablehnen
        </button>
      </div>
    </div>
  );
}

type BulkAktion = "modul" | "freigeben" | "ablehnen";

export function EinreichungenListe({
  einreichungen,
  namen,
  alleModule,
  duplikate = {},
}: {
  einreichungen: Einreichung[];
  namen: Record<string, string>;
  alleModule: string[];
  duplikate?: Record<number, DuplikatTreffer>;
}) {
  const router = useRouter();
  const [offeneId, setOffeneId] = useState<number | null>(null);
  const [nurDuplikate, setNurDuplikate] = useState(false);
  const duplikatAnzahl = Object.keys(duplikate).length;
  const [bulkModul, setBulkModul] = useState("");
  const [bulkKommentar, setBulkKommentar] = useState("");
  const [bulkLaeuft, setBulkLaeuft] = useState<BulkAktion | null>(null);
  const [bulkFehler, setBulkFehler] = useState<string | null>(null);
  const [bulkInfo, setBulkInfo] = useState<string | null>(null);
  const [suche, setSuche] = useState("");
  const [modulFilter, setModulFilter] = useState("");
  const [kursFilter, setKursFilter] = useState("");
  const [teilFilter, setTeilFilter] = useState("");
  const [quelleFilter, setQuelleFilter] = useState("");

  const alleModulnamen = [
    ...new Set(einreichungen.map((e) => e.modul).filter((m): m is string => !!m)),
  ].sort((a, b) => a.localeCompare(b, "de"));
  const alleKursnamen = [
    ...new Set(
      einreichungen
        .filter((e) => !modulFilter || e.modul === modulFilter)
        .map((e) => e.kurs)
        .filter((k): k is string => !!k)
    ),
  ].sort((a, b) => a.localeCompare(b, "de"));

  const gefiltert = einreichungen.filter((e) => {
    if (nurDuplikate && !duplikate[e.id]) return false;
    if (modulFilter && e.modul !== modulFilter) return false;
    if (kursFilter && e.kurs !== kursFilter) return false;
    if (teilFilter && String(e.teil) !== teilFilter) return false;
    if (quelleFilter && e.quelle_typ !== quelleFilter) return false;
    if (suche) {
      const q = suche.toLowerCase();
      const heu = `${e.frage ?? ""} ${e.modul ?? ""} ${e.kurs ?? ""} ${e.antwort_vorschlag ?? ""} ${e.protokoll_text ?? ""}`.toLowerCase();
      if (!heu.includes(q)) return false;
    }
    return true;
  });

  const { ausgewaehlt, setAusgewaehlt, zeileMausRunter, zeileMausRein, alleUmschalten } =
    useZeilenAuswahl(gefiltert.map((e) => e.id));

  if (einreichungen.length === 0) {
    return <p className="text-sm text-zinc-500">Keine offenen Einreichungen.</p>;
  }

  const alleAusgewaehlt =
    gefiltert.length > 0 && gefiltert.every((e) => ausgewaehlt.has(e.id));

  async function bulkAktion(aktion: BulkAktion) {
    const ids = [...ausgewaehlt];
    if (ids.length === 0) return;
    if (aktion === "modul" && !bulkModul.trim()) return;

    const frage =
      aktion === "modul"
        ? `Modul von ${ids.length} Einreichung(en) auf „${bulkModul.trim()}" ändern?`
        : aktion === "freigeben"
          ? `${ids.length} Einreichung(en) freigeben und in die Fragendatenbank übernehmen?`
          : `${ids.length} Einreichung(en) ablehnen?`;
    if (!confirm(frage)) return;

    setBulkLaeuft(aktion);
    setBulkFehler(null);
    setBulkInfo(null);
    const res = await fetch("/api/admin/einreichungen/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aktion,
        ids,
        modul: aktion === "modul" ? bulkModul.trim() : undefined,
        adminKommentar: aktion === "ablehnen" ? bulkKommentar.trim() || undefined : undefined,
      }),
    });
    setBulkLaeuft(null);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setBulkFehler(data?.error ?? "Aktion fehlgeschlagen");
      return;
    }

    const data = await res.json().catch(() => null);
    if (aktion === "freigeben") {
      const uebersprungen = data?.uebersprungen?.length ?? 0;
      setBulkInfo(
        `${data?.freigegeben ?? 0} freigegeben` +
          (uebersprungen > 0 ? `, ${uebersprungen} übersprungen (Pflichtfelder fehlen)` : "")
      );
    } else if (aktion === "modul") {
      setBulkInfo(`${data?.aktualisiert ?? 0} Einreichung(en) aktualisiert`);
    } else {
      setBulkInfo(`${data?.abgelehnt ?? 0} Einreichung(en) abgelehnt`);
    }
    setAusgewaehlt(new Set());
    setBulkModul("");
    setBulkKommentar("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Suche in Frage/Modul/Kurs/Musterantwort…"
          className="kp-input flex-1"
        />
        <select
          value={modulFilter}
          onChange={(e) => {
            setModulFilter(e.target.value);
            setKursFilter("");
          }}
          className="kp-input"
        >
          <option value="">Alle Module</option>
          {alleModulnamen.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={kursFilter}
          onChange={(e) => setKursFilter(e.target.value)}
          className="kp-input"
        >
          <option value="">Alle Kurse</option>
          {alleKursnamen.map((k) => (
            <option key={k} value={k}>
              {k}
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
          <option value="nutzer">Nutzer</option>
          <option value="telegram">Telegram</option>
        </select>
        <label
          className={`flex items-center gap-1.5 whitespace-nowrap text-sm ${
            duplikatAnzahl > 0 ? "text-amber-800" : "text-zinc-400"
          }`}
        >
          <input
            type="checkbox"
            checked={nurDuplikate}
            onChange={(e) => setNurDuplikate(e.target.checked)}
            disabled={duplikatAnzahl === 0}
            className="accent-[#3797f0]"
          />
          Nur mögl. Duplikate ({duplikatAnzahl})
        </label>
        {(suche || modulFilter || kursFilter || teilFilter || quelleFilter || nurDuplikate) && (
          <button
            type="button"
            onClick={() => {
              setSuche("");
              setModulFilter("");
              setKursFilter("");
              setTeilFilter("");
              setQuelleFilter("");
              setNurDuplikate(false);
            }}
            className="text-sm text-accent hover:underline"
          >
            Filter zurücksetzen
          </button>
        )}
        <span className="text-sm text-zinc-500">
          {gefiltert.length} von {einreichungen.length}
          {ausgewaehlt.size > 0 && `, ${ausgewaehlt.size} ausgewählt`}
        </span>
      </div>

      {ausgewaehlt.size > 0 && (
        <div className="flex flex-col gap-2 rounded-xl bg-accent/10 px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{ausgewaehlt.size} ausgewählt</span>
            <span className="text-xs text-zinc-500">(Tipp: über die Kästchen ziehen wählt mehrere auf einmal)</span>

            <span className="ml-2 text-zinc-500">Modul →</span>
            <input
              list="admin-einreichung-module"
              value={bulkModul}
              onChange={(e) => setBulkModul(e.target.value)}
              placeholder="Modulname"
              className="kp-input py-1"
            />
            <datalist id="admin-einreichung-module">
              {alleModule.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <button
              type="button"
              disabled={!bulkModul.trim() || bulkLaeuft !== null}
              onClick={() => bulkAktion("modul")}
              className="kp-btn-secondary py-1.5"
            >
              {bulkLaeuft === "modul" ? "…" : "Modul ändern"}
            </button>

            <span className="mx-1 h-5 w-px bg-zinc-300" />

            <button
              type="button"
              disabled={bulkLaeuft !== null}
              onClick={() => bulkAktion("freigeben")}
              className="kp-btn-primary py-1.5"
            >
              {bulkLaeuft === "freigeben" ? "Gebe frei…" : "Freigeben"}
            </button>
            <button
              type="button"
              disabled={bulkLaeuft !== null}
              onClick={() => bulkAktion("ablehnen")}
              className="rounded-full border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              {bulkLaeuft === "ablehnen" ? "Lehne ab…" : "Ablehnen"}
            </button>
            <input
              value={bulkKommentar}
              onChange={(e) => setBulkKommentar(e.target.value)}
              placeholder="Ablehnungsgrund (optional)"
              className="kp-input py-1"
            />

            <button
              type="button"
              onClick={() => setAusgewaehlt(new Set())}
              className="ml-auto text-zinc-600 hover:underline"
            >
              Auswahl aufheben
            </button>
          </div>
          {bulkFehler && <span className="text-red-600">{bulkFehler}</span>}
        </div>
      )}

      {bulkInfo && ausgewaehlt.size === 0 && (
        <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{bulkInfo}</p>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={alleAusgewaehlt}
                  onChange={alleUmschalten}
                  aria-label="Alle Einreichungen auswählen"
                />
              </th>
              <th className="px-3 py-2">Modul</th>
              <th className="px-3 py-2">Kurs</th>
              <th className="w-14 px-3 py-2">Teil</th>
              <th className="px-3 py-2">Frage</th>
              <th className="px-3 py-2">Quelle</th>
              <th className="w-24 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {gefiltert.length === 0 && (
              <tr className="border-t border-zinc-100">
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-zinc-500">
                  Keine Einreichung passt zu den Filtern.
                </td>
              </tr>
            )}
            {gefiltert.map((e, index) => {
              const offen = offeneId === e.id;
              return (
                <Fragment key={e.id}>
                  <tr
                    className={`border-t border-zinc-100 ${ausgewaehlt.has(e.id) ? "bg-accent/5" : ""}`}
                  >
                    <td
                      className="cursor-pointer select-none px-3 py-2 align-top"
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        zeileMausRunter(index, ev.shiftKey);
                      }}
                      onMouseEnter={() => zeileMausRein(index)}
                    >
                      <input
                        type="checkbox"
                        checked={ausgewaehlt.has(e.id)}
                        readOnly
                        tabIndex={-1}
                        aria-label={`Einreichung ${e.id} auswählen`}
                        className="pointer-events-none"
                      />
                    </td>
                    <td className="max-w-[150px] truncate px-3 py-2 align-top">{e.modul ?? "—"}</td>
                    <td className="max-w-[200px] truncate px-3 py-2 align-top">{e.kurs ?? "—"}</td>
                    <td className="px-3 py-2 align-top">{e.teil ?? "—"}</td>
                    <td className="max-w-[360px] px-3 py-2 align-top">
                      <div className="truncate">
                        {e.typ === "protokoll" && !e.frage ? (
                          <span className="text-zinc-400">(Protokoll)</span>
                        ) : (
                          e.frage
                        )}
                      </div>
                      {duplikate[e.id] && (
                        <div className="mt-1">
                          <DuplikatBadge
                            score={duplikate[e.id].score}
                            onClick={() => setNurDuplikate(true)}
                          />
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          e.quelle_typ === "telegram"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {QUELLE_LABEL[e.quelle_typ]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right align-top">
                      <button
                        type="button"
                        onClick={() => setOffeneId(offen ? null : e.id)}
                        className="text-sm text-accent hover:underline"
                      >
                        {offen ? "Schließen" : "Bearbeiten"}
                      </button>
                    </td>
                  </tr>
                  {offen && (
                    <tr className="border-t border-zinc-100 bg-zinc-50">
                      <td colSpan={7} className="px-3 py-3">
                        <EinreichungKarte e={e} namen={namen} treffer={duplikate[e.id]} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
