"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminQuestion } from "@/lib/admin-data";
import { MusterantwortText } from "@/components/musterantwort-text";
import { BildFeld } from "@/components/admin/bild-feld";

type FormState = {
  modul: string;
  kurs: string;
  teil: 1 | 2 | 3;
  frage: string;
  musterantwort: string;
  bild_frage_url: string | null;
  bild_antwort_url: string | null;
  quelle: string;
  haeufigkeit: number;
  hilfe_hinweis: string;
};

function leererState(): FormState {
  return {
    modul: "",
    kurs: "",
    teil: 1,
    frage: "",
    musterantwort: "",
    bild_frage_url: null,
    bild_antwort_url: null,
    quelle: "",
    haeufigkeit: 1,
    hilfe_hinweis: "",
  };
}

export function FrageForm({ initial }: { initial?: AdminQuestion }) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(
    initial
      ? {
          modul: initial.modul,
          kurs: initial.kurs,
          teil: initial.teil as 1 | 2 | 3,
          frage: initial.frage,
          musterantwort: initial.musterantwort,
          bild_frage_url: initial.bild_frage_url,
          bild_antwort_url: initial.bild_antwort_url,
          quelle: initial.quelle ?? "",
          haeufigkeit: initial.haeufigkeit,
          hilfe_hinweis: initial.hilfe_hinweis ?? "",
        }
      : leererState()
  );
  const [speichert, setSpeichert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState(false);

  const gueltig =
    state.modul.trim() !== "" &&
    state.kurs.trim() !== "" &&
    state.frage.trim() !== "" &&
    state.musterantwort.trim() !== "";

  async function speichern() {
    setSpeichert(true);
    setFehler(null);
    setGespeichert(false);
    const url = initial ? `/api/admin/questions/${initial.id}` : "/api/admin/questions";
    const method = initial ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    setSpeichert(false);
    if (res.ok) {
      if (initial) {
        // Bearbeiten: auf der Frage bleiben, damit direkt weiterbearbeitet
        // werden kann — nur kurz bestätigen statt zur Liste zu springen.
        setGespeichert(true);
        router.refresh();
        window.setTimeout(() => setGespeichert(false), 2500);
      } else {
        // Neu anlegen: zur Liste zurück, dort ist die neue Frage sichtbar.
        router.push("/admin/fragen");
        router.refresh();
      }
    } else {
      const data = await res.json().catch(() => null);
      setFehler(data?.error ?? "Speichern fehlgeschlagen");
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {initial?.quelle_typ === "telegram" && (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
            Telegram
          </span>
          {initial.pruefungszentrum && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {initial.pruefungszentrum}
            </span>
          )}
          <span className="text-zinc-500">
            automatisch importiert am {new Date(initial.erstellt_am).toLocaleDateString("de-DE")}
            {initial.quelle ? ` · ${initial.quelle}` : ""}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-500">Modul</label>
          <input
            value={state.modul}
            onChange={(e) => setState((s) => ({ ...s, modul: e.target.value }))}
            className="kp-input"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-500">Kurs</label>
          <input
            value={state.kurs}
            onChange={(e) => setState((s) => ({ ...s, kurs: e.target.value }))}
            className="kp-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-500">Teil</label>
          <select
            value={state.teil}
            onChange={(e) =>
              setState((s) => ({ ...s, teil: Number(e.target.value) as 1 | 2 | 3 }))
            }
            className="w-32 kp-input"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-500">
            Häufigkeit (wie oft in Protokollen)
          </label>
          <input
            type="number"
            min={1}
            value={state.haeufigkeit}
            onChange={(e) =>
              setState((s) => ({ ...s, haeufigkeit: Number(e.target.value) || 1 }))
            }
            className="w-32 kp-input"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-500">Frage</label>
        <textarea
          value={state.frage}
          onChange={(e) => setState((s) => ({ ...s, frage: e.target.value }))}
          rows={3}
          className="kp-input"
        />
      </div>

      <BildFeld
        label="Bild zur Frage"
        url={state.bild_frage_url}
        onChange={(url) => setState((s) => ({ ...s, bild_frage_url: url }))}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-500">
          Hilfe-Hinweis (Strukturhilfe, nicht die Lösung — Button wird ausgeblendet, wenn leer)
        </label>
        <textarea
          value={state.hilfe_hinweis}
          onChange={(e) => setState((s) => ({ ...s, hilfe_hinweis: e.target.value }))}
          rows={2}
          placeholder='z.B. "Nenne: Schnittführung, zu unterbindendes Gefäß, OP-Schritte in Reihenfolge."'
          className="kp-input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-500">Musterantwort</label>
        <textarea
          value={state.musterantwort}
          onChange={(e) => setState((s) => ({ ...s, musterantwort: e.target.value }))}
          rows={6}
          className="kp-input"
        />
        {state.musterantwort.trim() !== "" && (
          <div className="mt-1 flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-400">
              Vorschau (nur Anzeige, gespeicherter Text bleibt roh)
            </span>
            <MusterantwortText
              text={state.musterantwort}
              className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700"
            />
          </div>
        )}
      </div>

      <BildFeld
        label="Bild zur Musterantwort"
        url={state.bild_antwort_url}
        onChange={(url) => setState((s) => ({ ...s, bild_antwort_url: url }))}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-500">Quelle (interne Notiz)</label>
        <input
          value={state.quelle}
          onChange={(e) => setState((s) => ({ ...s, quelle: e.target.value }))}
          className="kp-input"
        />
      </div>

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!gueltig || speichert}
          onClick={speichern}
          className="kp-btn-primary w-fit"
        >
          Speichern
        </button>
        {gespeichert && (
          <span className="text-sm font-medium text-green-700">Gespeichert ✓</span>
        )}
      </div>
    </div>
  );
}
