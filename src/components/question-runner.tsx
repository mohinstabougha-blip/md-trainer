"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SessionQuestion, Teil, FortschrittFilter } from "@/lib/questions";
import type { Bewertung, KursStat } from "@/lib/bewertung-types";
import { QuestionScreen } from "@/components/question-screen";
import { ErgebnisScreen } from "@/components/ergebnis-screen";
import { getGastBewertungen } from "@/lib/gast-fortschritt";
import {
  getAktiveSession,
  setAktiveSession,
  clearAktiveSession,
  type AktiveSession,
} from "@/lib/aktive-session";

type Ergebnis = { modul: string; kurs: string; bewertung: Bewertung };
type Lauf = { fragen: SessionQuestion[]; startIndex: number; startErgebnisse: Ergebnis[] };

function zuKursStats(ergebnisse: Ergebnis[]): KursStat[] {
  const map = new Map<string, KursStat>();
  for (const e of ergebnisse) {
    const key = `${e.modul} ${e.kurs}`;
    const stat = map.get(key) ?? { modul: e.modul, kurs: e.kurs, richtig: 0, teilweise: 0, falsch: 0 };
    stat[e.bewertung] += 1;
    map.set(key, stat);
  }
  return [...map.values()];
}

async function sessionStatusAendern(sessionId: string, status: "abgeschlossen" | "abgebrochen") {
  await fetch(`/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

function berechneLauf(
  questions: SessionQuestion[],
  gastFilterAktiv: boolean,
  fortschrittFilter: FortschrittFilter,
  resumeDaten: AktiveSession | null
): Lauf | null {
  // Fortsetzen: gespeicherte Reihenfolge + Position wiederherstellen.
  if (resumeDaten && resumeDaten.frageIds.length > 0) {
    const byId = new Map(questions.map((q) => [q.id, q]));
    const geordnet = resumeDaten.frageIds
      .map((id) => byId.get(id))
      .filter((q): q is SessionQuestion => !!q);
    if (geordnet.length === 0) {
      return { fragen: questions, startIndex: 0, startErgebnisse: [] };
    }
    let fehlendVorIndex = 0;
    for (let i = 0; i < Math.min(resumeDaten.index, resumeDaten.frageIds.length); i++) {
      if (!byId.has(resumeDaten.frageIds[i])) fehlendVorIndex++;
    }
    const startIndex = Math.max(
      0,
      Math.min(resumeDaten.index - fehlendVorIndex, geordnet.length)
    );
    return { fragen: geordnet, startIndex, startErgebnisse: resumeDaten.ergebnisse ?? [] };
  }

  if (!gastFilterAktiv) {
    return { fragen: questions, startIndex: 0, startErgebnisse: [] };
  }

  // Gast-Fortschrittsfilter wird im Effect aufgelöst (localStorage).
  void fortschrittFilter;
  return null;
}

export function QuestionRunner({
  questions,
  teil,
  modus,
  filterWerte,
  fortschrittFilter,
  istAdmin,
  istGast,
  ungeleseneNachrichten,
  favoritenIds,
  resume,
  resumeHref,
}: {
  questions: SessionQuestion[];
  teil: Teil;
  modus: string;
  filterWerte: Record<string, unknown>;
  fortschrittFilter: FortschrittFilter;
  istAdmin: boolean;
  istGast: boolean;
  ungeleseneNachrichten: number;
  favoritenIds: number[];
  resume: boolean;
  resumeHref: string;
}) {
  const router = useRouter();
  const [sessionId] = useState(() => crypto.randomUUID());

  const gastFilterAktiv = istGast && fortschrittFilter !== "alle";

  const [resumeDaten] = useState<AktiveSession | null>(() =>
    resume ? getAktiveSession() : null
  );
  const [lauf, setLauf] = useState<Lauf | null>(() =>
    berechneLauf(questions, gastFilterAktiv, fortschrittFilter, resumeDaten)
  );
  const [index, setIndex] = useState(() => lauf?.startIndex ?? 0);
  const [ergebnisse, setErgebnisse] = useState<Ergebnis[]>(() => lauf?.startErgebnisse ?? []);

  const sessionTitel = (() => {
    if (modus === "ids") return "Favoriten";
    if (modus === "modul") {
      const m = (filterWerte.module as string[] | undefined) ?? [];
      return m.length === 1 ? m[0] : m.length > 1 ? `${m.length} Module` : "Training";
    }
    if (modus === "kurs" || modus === "kurse") {
      const ks = (filterWerte.kurse as { kurs: string }[] | undefined) ?? [];
      return ks[0]?.kurs ?? (filterWerte.kurs as string) ?? "Kurs";
    }
    return "Zufällig";
  })();

  // Gast-Fortschrittsfilter nach dem Mounten anwenden (localStorage).
  useEffect(() => {
    if (!gastFilterAktiv || resumeDaten) return;
    const bewertungen = getGastBewertungen();
    const neu = questions.filter((q) => {
      const b = bewertungen[q.id];
      if (fortschrittFilter === "nie_gesehen") return !b;
      if (fortschrittFilter === "schon_gesehen") return !!b;
      return b === "falsch" || b === "teilweise";
    });
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setLauf({ fragen: neu, startIndex: 0, startErgebnisse: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aktiveFragen = lauf?.fragen ?? [];

  // Session-Zeile für angemeldete Nutzer anlegen (Server-Historie).
  useEffect(() => {
    if (istGast || aktiveFragen.length === 0) return;
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sessionId, modus, filterWerte }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lauf]);

  // Snapshot für "Weitermachen" laufend aktualisieren.
  useEffect(() => {
    if (!lauf || lauf.fragen.length === 0) return;
    if (index >= lauf.fragen.length) {
      clearAktiveSession();
      return;
    }
    if (index === 0 && ergebnisse.length === 0) return;
    setAktiveSession({
      href: resumeHref,
      titel: sessionTitel,
      frageIds: lauf.fragen.map((q) => q.id),
      index,
      ergebnisse,
      gesamt: lauf.fragen.length,
      aktualisiert: Date.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, ergebnisse, lauf]);

  async function abbrechen() {
    // Snapshot bleibt erhalten -> auf der Startseite kann fortgesetzt werden.
    if (!istGast) await sessionStatusAendern(sessionId, "abgebrochen");
    router.push("/");
  }

  if (!lauf) {
    return <div className="min-h-screen" aria-hidden />;
  }

  if (aktiveFragen.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <p>Keine Fragen für diese Auswahl gefunden.</p>
        <Link href="/" className="text-sm text-accent hover:underline">
          Zurück zur Auswahl
        </Link>
      </div>
    );
  }

  if (index >= aktiveFragen.length) {
    return <ErgebnisScreen stats={zuKursStats(ergebnisse)} teil={teil} />;
  }

  return (
    <QuestionScreen
      key={aktiveFragen[index].id}
      question={aktiveFragen[index]}
      index={index}
      gesamt={aktiveFragen.length}
      sessionId={sessionId}
      istAdmin={istAdmin}
      istGast={istGast}
      initialFavorit={favoritenIds.includes(aktiveFragen[index].id)}
      ungeleseneNachrichten={ungeleseneNachrichten}
      onAbbrechen={abbrechen}
      onNext={(result) => {
        if (result.bewertung) {
          const { modul, kurs } = aktiveFragen[index];
          setErgebnisse((prev) => [...prev, { modul, kurs, bewertung: result.bewertung! }]);
        }
        const neuerIndex = index + 1;
        if (neuerIndex >= aktiveFragen.length && !istGast) {
          sessionStatusAendern(sessionId, "abgeschlossen");
        }
        setIndex(neuerIndex);
      }}
    />
  );
}
