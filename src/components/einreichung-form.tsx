"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EinreichungTyp } from "@/lib/einreichungen-types";
import { useTurnstile } from "@/components/turnstile-widget";

export function EinreichungForm() {
  const router = useRouter();
  const [typ, setTyp] = useState<EinreichungTyp>("einzelfrage");
  const [modul, setModul] = useState("");
  const [kurs, setKurs] = useState("");
  const [teil, setTeil] = useState<1 | 2 | 3>(1);
  const [frage, setFrage] = useState("");
  const [antwortVorschlag, setAntwortVorschlag] = useState("");
  const [protokollText, setProtokollText] = useState("");
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gesendet, setGesendet] = useState(false);
  const { token, widget, reset, erforderlich } = useTurnstile();

  const gueltig =
    typ === "einzelfrage"
      ? modul.trim() && kurs.trim() && frage.trim() && antwortVorschlag.trim()
      : protokollText.trim() !== "";

  async function absenden() {
    setSendet(true);
    setFehler(null);
    const body =
      typ === "einzelfrage"
        ? { typ, modul, kurs, teil, frage, antwortVorschlag, turnstileToken: token }
        : { typ, protokollText, turnstileToken: token };

    const res = await fetch("/api/einreichungen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSendet(false);
    if (!res.ok) reset();
    if (res.ok) {
      setModul("");
      setKurs("");
      setFrage("");
      setAntwortVorschlag("");
      setProtokollText("");
      setGesendet(true);
      router.refresh();
      setTimeout(() => setGesendet(false), 3000);
    } else {
      const data = await res.json().catch(() => null);
      setFehler(data?.error ?? "Einreichen fehlgeschlagen");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTyp("einzelfrage")}
          className={`kp-pill ${typ === "einzelfrage" ? "kp-pill-aktiv" : "kp-pill-inaktiv"}`}
        >
          Einzelfrage
        </button>
        <button
          type="button"
          onClick={() => setTyp("protokoll")}
          className={`kp-pill ${typ === "protokoll" ? "kp-pill-aktiv" : "kp-pill-inaktiv"}`}
        >
          Ganzes Protokoll
        </button>
      </div>

      {typ === "einzelfrage" ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <input
              value={modul}
              onChange={(e) => setModul(e.target.value)}
              placeholder="Modul"
              className="kp-input"
            />
            <input
              value={kurs}
              onChange={(e) => setKurs(e.target.value)}
              placeholder="Kurs"
              className="kp-input"
            />
          </div>
          <select
            value={teil}
            onChange={(e) => setTeil(Number(e.target.value) as 1 | 2 | 3)}
            className="kp-input w-32"
          >
            <option value={1}>Teil 1</option>
            <option value={2}>Teil 2</option>
            <option value={3}>Teil 3</option>
          </select>
          <textarea
            value={frage}
            onChange={(e) => setFrage(e.target.value)}
            placeholder="Frage"
            rows={3}
            className="kp-input"
          />
          <textarea
            value={antwortVorschlag}
            onChange={(e) => setAntwortVorschlag(e.target.value)}
            placeholder="Musterantwort-Vorschlag"
            rows={5}
            className="kp-input"
          />
        </>
      ) : (
        <textarea
          value={protokollText}
          onChange={(e) => setProtokollText(e.target.value)}
          placeholder="Kompletter Prüfungsprotokoll-Text — muss noch nicht strukturiert sein, wird von der Adminseite aus einzelne Fragen aufbereitet."
          rows={10}
          className="kp-input"
        />
      )}

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}
      {gesendet && (
        <p className="text-sm text-green-700">Danke! Deine Einreichung wird geprüft.</p>
      )}

      {widget}

      <button
        type="button"
        disabled={!gueltig || sendet || (erforderlich && !token)}
        onClick={absenden}
        className="kp-btn-primary w-fit"
      >
        Einreichen
      </button>
    </div>
  );
}
