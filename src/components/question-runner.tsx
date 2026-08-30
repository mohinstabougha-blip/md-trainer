"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SessionQuestion, Teil, FortschrittFilter } from "@/lib/questions";
import type { Bewertung, KursStat } from "@/lib/bewertung-types";
import { QuestionScreen } from "@/components/question-screen";
import { ErgebnisScreen } from "@/components/ergebnis-screen";
import { getGastBewertungen } from "@/lib/gast-fortschritt";

type Ergebnis = { modul: string; kurs: string; bewertung: Bewertung };

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

export function QuestionRunner({
  questions,
  teil,
  modus,
  filterWerte,
  fortschrittFilter,
  istAdmin,
  istGast,
  ungeleseneNachrichten,
}: {
  questions: SessionQuestion[];
  teil: Teil;
  modus: string;
  filterWerte: Record<string, unknown>;
  fortschrittFilter: FortschrittFilter;
  istAdmin: boolean;
  istGast: boolean;
  ungeleseneNachrichten: number;
}) {
  const router = useRouter();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [index, setIndex] = useState(0);
  const [ergebnisse, setErgebnisse] = useState<Ergebnis[]>([]);

  // Gäste: der Fortschritts-Filter kann serverseitig nicht angewendet werden
  // (results liegen im localStorage). Nachträglich hier filtern.
  const gastFilterAktiv = istGast && fortschrittFilter !== "alle";
  const [gastBereit, setGastBereit] = useState(!gastFilterAktiv);
  const [gefiltert, setGefiltert] = useState<SessionQuestion[]>(questions);

  useEffect(() => {
    if (!gastFilterAktiv) return;
    const bewertungen = getGastBewertungen();
    const neu = questions.filter((q) => {
      const b = bewertungen[q.id];
      if (fortschrittFilter === "nie_gesehen") return !b;
      if (fortschrittFilter === "schon_gesehen") return !!b;
      return b === "falsch" || b === "teilweise";
    });
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setGefiltert(neu);
    setGastBereit(true);
    // questions/fortschrittFilter sind über die Lebensdauer stabil (key-Remount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aktiveFragen = gastFilterAktiv ? gefiltert : questions;

  useEffect(() => {
    if (istGast || aktiveFragen.length === 0) return;
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sessionId, modus, filterWerte }),
    });
    // Nur beim Mounten anlegen — sessionId/modus/filterWerte ändern sich über
    // die Lebensdauer dieser Komponenteninstanz nicht (key erzwingt Remount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function abbrechen() {
    if (!istGast) await sessionStatusAendern(sessionId, "abgebrochen");
    router.push("/");
  }

  if (!gastBereit) {
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
