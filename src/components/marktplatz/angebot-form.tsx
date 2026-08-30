"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KATEGORIE_LABEL, type AngebotKategorie } from "@/lib/marktplatz-types";
import { useTurnstile } from "@/components/turnstile-widget";

export function AngebotForm() {
  const router = useRouter();
  const [kategorie, setKategorie] = useState<AngebotKategorie>("simulation_kostenlos");
  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [preis, setPreis] = useState("");
  const [speichert, setSpeichert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const { token, widget, reset, erforderlich } = useTurnstile();

  const gueltig = titel.trim() !== "" && beschreibung.trim() !== "";

  async function speichern() {
    setSpeichert(true);
    setFehler(null);
    const res = await fetch("/api/marktplatz/angebote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kategorie, titel, beschreibung, preis, turnstileToken: token }),
    });
    setSpeichert(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/marktplatz/${data.id}`);
      router.refresh();
    } else {
      reset();
      const data = await res.json().catch(() => null);
      setFehler(data?.error ?? "Speichern fehlgeschlagen");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-500">Kategorie</label>
        <select
          value={kategorie}
          onChange={(e) => setKategorie(e.target.value as AngebotKategorie)}
          className="kp-input"
        >
          {Object.entries(KATEGORIE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-500">Titel</label>
        <input value={titel} onChange={(e) => setTitel(e.target.value)} className="kp-input" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-500">Beschreibung</label>
        <textarea
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
          rows={5}
          className="kp-input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-500">
          Preis (nur Anzeige, optional)
        </label>
        <input
          value={preis}
          onChange={(e) => setPreis(e.target.value)}
          placeholder='z.B. "kostenlos" oder "20€/Stunde"'
          className="kp-input"
        />
      </div>

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}

      {widget}

      <button
        type="button"
        disabled={!gueltig || speichert || (erforderlich && !token)}
        onClick={speichern}
        className="kp-btn-primary w-fit"
      >
        Angebot veröffentlichen
      </button>
    </div>
  );
}
