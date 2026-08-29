"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KursStat } from "@/lib/bewertung-types";
import type { Teil } from "@/lib/questions";

// Ab wie viel Prozent Trefferquote ein Kurs als "gut beherrscht" statt als
// "üben" gilt. Kurse mit zu wenigen Versuchen (< MIN_VERSUCHE) werden in
// keiner der beiden Listen gezeigt, um bei nur 1 falscher Antwort nicht
// gleich als Schwäche markiert zu werden.
const GUT_SCHWELLE = 0.7;
const MIN_VERSUCHE = 2;

function trefferquote(s: KursStat): number {
  const gesamt = s.richtig + s.teilweise + s.falsch;
  if (gesamt === 0) return 0;
  return (s.richtig + 0.5 * s.teilweise) / gesamt;
}

export function ErgebnisScreen({ stats, teil }: { stats: KursStat[]; teil: Teil }) {
  const router = useRouter();

  const gesamtRichtig = stats.reduce((sum, s) => sum + s.richtig, 0);
  const gesamtTeilweise = stats.reduce((sum, s) => sum + s.teilweise, 0);
  const gesamtFalsch = stats.reduce((sum, s) => sum + s.falsch, 0);
  const gesamt = gesamtRichtig + gesamtTeilweise + gesamtFalsch;

  const bewertet = stats
    .map((s) => ({ ...s, gesamt: s.richtig + s.teilweise + s.falsch, quote: trefferquote(s) }))
    .filter((s) => s.gesamt >= MIN_VERSUCHE);

  const gut = bewertet
    .filter((s) => s.quote >= GUT_SCHWELLE)
    .sort((a, b) => b.quote - a.quote);
  const ueben = bewertet
    .filter((s) => s.quote < GUT_SCHWELLE)
    .sort((a, b) => a.quote - b.quote);

  function nochmalUeben() {
    if (ueben.length === 0) return;
    const kurse = ueben.map((e) => ({ modul: e.modul, kurs: e.kurs }));
    const params = new URLSearchParams();
    params.set("modus", "kurse");
    params.set("kurse", JSON.stringify(kurse));
    params.set("teil", teil);
    router.push(`/session?${params.toString()}`);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Session beendet</h1>
        <p className="mt-1 text-zinc-500">
          {gesamtRichtig} richtig · {gesamtTeilweise} teilweise · {gesamtFalsch} falsch von{" "}
          {gesamt} Fragen
        </p>
      </div>

      {gut.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-green-700">Das lief gut</h2>
          <ul className="kp-card flex flex-col gap-1 text-sm">
            {gut.map((s, i) => (
              <li key={i}>
                {s.modul} / {s.kurs}: {s.richtig + Math.round(s.teilweise * 0.5)} von {s.gesamt}{" "}
                richtig
              </li>
            ))}
          </ul>
        </section>
      )}

      {ueben.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-amber-700">Das solltest du üben</h2>
          <ul className="kp-card flex flex-col gap-1 text-sm">
            {ueben.map((s, i) => (
              <li key={i}>
                {s.modul} / {s.kurs}: {s.richtig + Math.round(s.teilweise * 0.5)} von {s.gesamt}{" "}
                richtig
              </li>
            ))}
          </ul>
        </section>
      )}

      {ueben.length > 0 && (
        <button type="button" onClick={nochmalUeben} className="kp-btn-primary py-3">
          Diese Themen nochmal üben
        </button>
      )}

      <Link href="/" className="text-center text-sm text-accent hover:underline">
        Neue Session starten
      </Link>
    </div>
  );
}
