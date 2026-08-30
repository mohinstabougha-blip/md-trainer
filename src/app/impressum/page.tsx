import type { Metadata } from "next";
import { RechtsSeite } from "@/components/rechts-seite";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung von KP Baden.",
};

export default function ImpressumPage() {
  return (
    <RechtsSeite titel="Impressum">
      <p className="rounded-xl bg-amber-50 p-3 text-amber-900">
        Hinweis: Die mit [eckigen Klammern] markierten Angaben müssen vor der Veröffentlichung
        durch die tatsächlichen Daten des Betreibers ersetzt werden. KP Baden ist ein
        privates, nicht-kommerzielles Lernprojekt.
      </p>

      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        [Vorname Nachname]
        <br />
        [Straße und Hausnummer]
        <br />
        [PLZ Ort]
        <br />
        [Land]
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: [kontakt@deine-domain.de]
        <br />
        Telefon: [optional]
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        [Vorname Nachname], Anschrift wie oben.
      </p>

      <h2>Art des Angebots</h2>
      <p>
        KP Baden wird privat und ohne Gewinnerzielungsabsicht betrieben. Die Nutzung ist
        kostenlos und werbefrei. Es handelt sich um ein Lern- und Übungswerkzeug für die
        Kenntnisprüfung; es ersetzt keine offizielle Auskunft der zuständigen Behörden und
        keine medizinische Fachliteratur.
      </p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
        nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
        Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
        Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
        Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
        Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine
        diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten
        Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen
        werden wir diese Inhalte umgehend entfernen.
      </p>

      <h2>Haftung für Links</h2>
      <p>
        Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
        Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
        übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder
        Betreiber der Seiten verantwortlich. Bei Bekanntwerden von Rechtsverletzungen werden
        wir derartige Links umgehend entfernen.
      </p>

      <h2>Nutzergenerierte Inhalte</h2>
      <p>
        Frage-Einreichungen, Kommentare, Marktplatz-Anzeigen und Nachrichten stammen von
        Nutzerinnen und Nutzern. Für rechtswidrige oder unrichtige nutzergenerierte Inhalte
        übernehmen wir keine Haftung; wir entfernen sie nach Kenntnisnahme. Meldungen an
        [kontakt@deine-domain.de].
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
        unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche
        gekennzeichnet. Downloads und Kopien dieser Seite sind nur für den privaten, nicht
        kommerziellen Gebrauch gestattet.
      </p>

      <h2>Streitschlichtung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
        bereit: <a href="https://ec.europa.eu/consumers/odr/">https://ec.europa.eu/consumers/odr/</a>.
        Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </RechtsSeite>
  );
}
