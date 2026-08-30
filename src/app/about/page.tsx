import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Über KP Baden",
  description:
    "KP Baden ist ein kostenloses Übungswerkzeug für die Kenntnisprüfung, erstellt von einem approbierten Arzt als Beitrag für die Community.",
};

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{titel}</h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-100 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/">
            <Logo size={24} />
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
            Zurück
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-8 p-6 pb-16">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold">Über KP Baden</h1>
          <p className="leading-relaxed text-zinc-700">
            KP Baden ist ein kostenloses, werbefreies Übungswerkzeug für die{" "}
            <strong>Kenntnisprüfung (KP)</strong> im Rahmen der Approbation in Deutschland.
          </p>
        </div>

        <Abschnitt titel="Wer steckt dahinter?">
          <p className="leading-relaxed text-zinc-700">
            KP Baden wurde von einem approbierten Arzt entwickelt, der das gesamte
            Gleichwertigkeitsverfahren in Baden-Württemberg im Jahr 2025 erfolgreich
            abgeschlossen hat – von der Fachsprachprüfung bis zur Kenntnisprüfung.
          </p>
          <p className="leading-relaxed text-zinc-700">
            Die Vorbereitung lebt fast vollständig davon, dass Kolleginnen und Kollegen ihre
            Prüfungsprotokolle und Erfahrungen teilen. Dieses Projekt ist der Versuch, etwas
            davon zurückzugeben: gebündeltes Prüfungswissen, strukturiert und jederzeit
            abrufbar – dauerhaft <strong>kostenlos</strong> für alle, die denselben Weg gehen.
          </p>
        </Abschnitt>

        <Abschnitt titel="Was kann KP Baden?">
          <ul className="flex flex-col gap-3">
            {[
              [
                "Fragendatenbank aus echten Protokollen",
                "Hunderte Prüfungsfragen, aus den KP-Protokollen aus Baden-Württemberg (Freiburg, Heidelberg, Mannheim, Stuttgart, Tübingen, Ulm, Baden-Baden) aufbereitet und nach Fachgebiet/Kurs sowie Teil 1 (Anamnese & Untersuchung), Teil 2 (Fallvorstellung) und Teil 3 (Fachfragen) sortiert.",
              ],
              [
                "Karteikarten-Training (Active Recall)",
                "Jede Frage erscheint als Karteikarte: erst selbst beantworten, dann die Karte umdrehen und mit der Musterantwort vergleichen. Ein Antwort-/Notizfeld steht bereit, ist aber optional.",
              ],
              [
                "Ehrliche Selbsteinschätzung",
                "Nach dem Aufdecken bewertest du dich selbst mit „richtig“, „teilweise“ oder „falsch“. Daraus entsteht dein persönlicher Lernstand.",
              ],
              [
                "Fortschritt pro Modul",
                "Kreisdiagramme zeigen für jedes Modul, wie viele Fragen du schon bearbeitet hast und wie sie ausgefallen sind.",
              ],
              [
                "Gezielte Sessions",
                "Stelle dir eine Übungsrunde zusammen: nach Fächern/Modulen oder einem bestimmten Kurs, nach Teil, nach Reihenfolge (häufigste zuerst, neueste, zufällig) und mit Fortschrittsfilter (alle, noch nie gesehen, schon gesehen, falsch beantwortet).",
              ],
              [
                "Musterantworten als Stichpunkte",
                "Knappe, fachlich fundierte Stichpunktlisten statt langer Fließtexte – so, wie man sie in der Prüfung auch nennen würde.",
              ],
              [
                "Hilfe-Hinweise",
                "Zu vielen Fragen gibt es einen kurzen Stichwort-Hinweis, der die Struktur der Antwort andeutet, ohne die Lösung vorwegzunehmen.",
              ],
              [
                "Community-Kommentare",
                "Zu jeder Frage können Nutzer Hinweise, Ergänzungen und Erfahrungen als Kommentar hinterlassen.",
              ],
              [
                "Wartezeit-Tracker",
                "Eine aus den Angaben aller Nutzer geschätzte aktuelle Wartezeit (Antrag → Rechnung → Prüfungstermin), inklusive eines kleinen Verlaufsgraphen. Je mehr Menschen ihre Daten eintragen, desto genauer wird die Schätzung.",
              ],
              [
                "Fragen & Protokolle einreichen",
                "Eigene Fragen oder ganze Protokolle einreichen; nach Prüfung durch einen Admin werden sie in die Datenbank aufgenommen.",
              ],
              [
                "Marktplatz",
                "Simulationspartner für die mündliche Prüfung finden, Kurse und Bücher anbieten oder suchen – mit direkter Nachrichtenfunktion.",
              ],
              [
                "Problem melden",
                "Fehler in einer Frage oder Musterantwort mit einem Klick melden.",
              ],
            ].map(([t, d]) => (
              <li key={t} className="kp-card">
                <p className="font-medium">{t}</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">{d}</p>
              </li>
            ))}
          </ul>
        </Abschnitt>

        <Abschnitt titel="So holst du am meisten heraus">
          <ol className="flex list-decimal flex-col gap-2 pl-5 leading-relaxed text-zinc-700 marker:text-zinc-400">
            <li>
              <strong>Täglich kurze Runden</strong> statt seltener Marathons – Active Recall
              wirkt durch Wiederholung über die Zeit.
            </li>
            <li>
              <strong>Erst selbst antworten</strong> (laut oder schriftlich), dann die Karte
              umdrehen. Das Notizfeld hilft, Gedanken festzuhalten, ist aber kein Muss.
            </li>
            <li>
              <strong>Ehrlich einschätzen.</strong> Nur wer „teilweise“ und „falsch“ zugibt,
              bekommt einen ehrlichen Lernstand.
            </li>
            <li>
              Mit dem Filter <strong>„Falsch beantwortet“</strong> gezielt die Lücken
              wiederholen, kurz vor der Prüfung noch einmal <strong>„Alle“</strong> durchgehen.
            </li>
            <li>
              <strong>Teil 1</strong> als Anamnese- und Untersuchungs-Checkliste üben,{" "}
              <strong>Teil 3</strong> als klassische Fachfragen. Für Teil 2 die Fallvorstellung
              laut formulieren.
            </li>
            <li>
              Reihenfolge <strong>„Häufigste zuerst“</strong> wählen, um die Themen zu treffen,
              die in den Protokollen immer wieder vorkommen.
            </li>
            <li>
              <strong>Trage deine Wartezeit-Daten ein</strong> – das verbessert die Schätzung
              für alle nach dir.
            </li>
            <li>
              <strong>Reiche nach deiner Prüfung dein Protokoll ein.</strong> Genau davon lebt
              dieses Projekt.
            </li>
            <li>
              Über den <strong>Marktplatz</strong> früh einen Simulationspartner suchen und
              die mündliche Situation regelmäßig üben.
            </li>
          </ol>
        </Abschnitt>

        <Abschnitt titel="Wichtiger Hinweis">
          <p className="text-sm leading-relaxed text-zinc-600">
            KP Baden ist ein privates Lernprojekt und keine offizielle Stelle. Die Inhalte
            beruhen auf geteilten Protokollen und medizinischem Fachwissen, ersetzen aber
            weder Lehrbücher/Leitlinien noch die verbindlichen Angaben der zuständigen
            Behörden. Für Vollständigkeit und Richtigkeit wird keine Gewähr übernommen.
          </p>
        </Abschnitt>

        <div>
          <Link href="/" className="kp-btn-primary inline-block py-2.5">
            Zum Training
          </Link>
        </div>

        <footer className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-200 pt-4 text-sm text-zinc-500">
          <Link href="/datenschutz" className="hover:text-zinc-900">
            Datenschutz
          </Link>
          <Link href="/impressum" className="hover:text-zinc-900">
            Impressum
          </Link>
        </footer>
      </main>
    </div>
  );
}
