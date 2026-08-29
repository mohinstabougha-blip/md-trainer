"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Einreichung } from "@/lib/einreichungen-types";
import { QUELLE_LABEL } from "@/lib/einreichungen-types";
import { BildFeld } from "@/components/admin/bild-feld";

function EinreichungKarte({ e, namen }: { e: Einreichung; namen: Record<string, string> }) {
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
    <div className="kp-card flex flex-col gap-3">
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

      {e.protokoll_text && (
        <div className="rounded-xl bg-zinc-50 p-3 text-sm">
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

export function EinreichungenListe({
  einreichungen,
  namen,
}: {
  einreichungen: Einreichung[];
  namen: Record<string, string>;
}) {
  if (einreichungen.length === 0) {
    return <p className="text-sm text-zinc-500">Keine offenen Einreichungen.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {einreichungen.map((e) => (
        <EinreichungKarte key={e.id} e={e} namen={namen} />
      ))}
    </div>
  );
}
