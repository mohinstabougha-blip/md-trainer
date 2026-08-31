import type { Metadata } from "next";
import { RechtsSeite } from "@/components/rechts-seite";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Informationen zur Verarbeitung personenbezogener Daten bei KP Baden.",
};

export default function DatenschutzPage() {
  return (
    <RechtsSeite titel="Datenschutzerklärung">
      <p className="rounded-xl bg-amber-50 p-3 text-amber-900">
        Hinweis: Die mit [eckigen Klammern] markierten Angaben (Verantwortlicher, Kontakt,
        Hosting-Anbieter, Server-Standort/Region) müssen vor der Veröffentlichung durch die
        tatsächlichen Daten ersetzt werden. Diese Vorlage beschreibt die derzeit im Code
        angelegten Verarbeitungen; bei Änderungen der eingesetzten Dienste ist sie
        anzupassen.
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlich für die Datenverarbeitung auf dieser Website ist:
        <br />
        [Vorname Nachname]
        <br />
        [Straße und Hausnummer], [PLZ Ort], [Land]
        <br />
        E-Mail: [datenschutz@deine-domain.de]
      </p>

      <h2>2. Überblick</h2>
      <p>
        KP Baden ist ein kostenloses, werbefreies Übungswerkzeug für die Kenntnisprüfung.
        Der Zugriff auf die Lerninhalte setzt ein Nutzerkonto voraus. Wir verarbeiten
        personenbezogene Daten nur, soweit dies für den Betrieb, die Sicherheit und die
        angebotenen Funktionen erforderlich ist. Es findet kein Verkauf von Daten und kein
        Profiling zu Werbezwecken statt.
      </p>

      <h2>3. Hosting</h2>
      <p>
        Die Website wird bei [Hosting-Anbieter, z. B. Vercel Inc.] gehostet. Beim Aufruf der
        Website werden vom Hoster technisch notwendige Zugriffsdaten in Server-Logfiles
        verarbeitet (u. a. gekürzte/vollständige IP-Adresse, Datum und Uhrzeit, aufgerufene
        URL, Referrer, User-Agent). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO
        (berechtigtes Interesse an einem sicheren und stabilen Betrieb). Mit dem Hoster
        besteht ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO.
      </p>

      <h2>4. Nutzerkonto und Anmeldung (Authentifizierung)</h2>
      <p>
        Für Registrierung, Anmeldung und Sitzungsverwaltung nutzen wir den Dienst{" "}
        <strong>Supabase</strong> (Supabase, Inc.). Verarbeitet werden E-Mail-Adresse,
        Passwort (verschlüsselt gespeichert), Zeitpunkt der Registrierung und der Anmeldungen
        sowie eine technische Nutzerkennung. Server-Standort/Region: [z. B. EU (Frankfurt)].
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Durchführung des Nutzungsverhältnisses).
        Mit Supabase besteht ein Auftragsverarbeitungsvertrag; bei Datenübermittlung in
        Drittländer werden die EU-Standardvertragsklauseln herangezogen.
      </p>

      <h2>5. Bot-Schutz mit Cloudflare Turnstile</h2>
      <p>
        Zum Schutz von Formularen (Anmeldung/Registrierung, Kommentare, Nachrichten,
        Marktplatz-Anzeigen, Frage-Einreichungen, Problemmeldungen, Admin-Anmeldung) vor
        automatisiertem Missbrauch setzen wir <strong>Cloudflare Turnstile</strong> (Cloudflare,
        Inc.) ein. Dabei werden technische Informationen wie IP-Adresse, Angaben zum
        Browser/Endgerät und Interaktionsmerkmale an Cloudflare übermittelt und dort zur
        Unterscheidung von Mensch und Bot ausgewertet. Turnstile setzt hierfür ein bzw. mehrere
        technisch notwendige Cookies/Local-Storage-Einträge. Eine Übermittlung in die USA ist
        möglich; Cloudflare stützt sich hierbei u. a. auf die EU-Standardvertragsklauseln.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Abwehr
        von Spam und Missbrauch). Weitere Informationen:{" "}
        <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare-Datenschutzerklärung</a>.
      </p>

      <h2>6. Reichweitenmessung mit Vercel Web Analytics</h2>
      <p>
        Zur anonymen Auswertung der Nutzung (z. B. Anzahl der Seitenaufrufe, aufgerufene
        Seiten, ungefähre Herkunftsregion, Gerätetyp, verweisende Seite) setzen wir{" "}
        <strong>Vercel Web Analytics</strong> (Vercel Inc.) ein. Die Erfassung erfolgt{" "}
        <strong>cookiefrei</strong> und ohne geräteübergreifende Wiedererkennung; es werden
        keine IP-Adressen dauerhaft gespeichert und keine für sich genommen einer Person
        zuordenbaren Kennungen gebildet. Aus den Daten lassen sich keine einzelnen Personen
        identifizieren. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
        an einer bedarfsgerechten Gestaltung des Angebots). Anbieter ist zugleich unser
        Hosting-Dienstleister (siehe Ziffer 3). Weitere Informationen:{" "}
        <a href="https://vercel.com/docs/analytics/privacy-policy">
          Vercel Web Analytics – Datenschutz
        </a>
        .
      </p>

      <h2>7. Verarbeitung im Rahmen der Funktionen</h2>
      <ul>
        <li>
          <strong>Training / Fortschritt:</strong> deine eingegebenen Antworten/Notizen (sofern
          du sie eingibst), deine Selbsteinschätzung (richtig/teilweise/falsch) und der
          zugehörige Zeitpunkt, um deinen Lernstand und Fortschritt darzustellen.
        </li>
        <li>
          <strong>Frage-/Protokoll-Einreichungen:</strong> die von dir übermittelten Inhalte
          sowie deine Nutzerkennung, zur Prüfung und ggf. Aufnahme in die Fragendatenbank.
        </li>
        <li>
          <strong>Kommentare:</strong> Kommentartext, Zeitpunkt und dein Anzeigename bzw. eine
          pseudonyme Kennung.
        </li>
        <li>
          <strong>Marktplatz:</strong> von dir erstellte Anzeigen (Titel, Beschreibung,
          Kategorie, ggf. Preisangabe) und Nachrichten an andere Nutzer inkl. Absender/Empfänger
          und Zeitpunkt.
        </li>
        <li>
          <strong>Wartezeit-Angaben:</strong> von dir freiwillig eingetragene Datumsangaben
          (Antrag, Rechnung, Prüfungstermin). Diese fließen ausschließlich anonymisiert in
          Durchschnittswerte für alle Nutzer ein.
        </li>
        <li>
          <strong>Meldungen / Feedback:</strong> Art der Meldung, optionaler Kommentar,
          betroffene Frage/Inhalt und deine Nutzerkennung.
        </li>
        <li>
          <strong>Profil:</strong> ein von dir wählbarer Anzeigename.
        </li>
      </ul>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung der Funktionen) bzw.
        Art. 6 Abs. 1 lit. f DSGVO (Sicherheit, Moderation, Verbesserung des Angebots).
        Öffentlich sichtbare Inhalte (Kommentare, Marktplatz-Anzeigen) sind für andere
        angemeldete Nutzer einsehbar – veröffentliche dort keine sensiblen personenbezogenen
        Daten.
      </p>

      <h2>8. Cookies und lokale Speicherung</h2>
      <ul>
        <li>
          <strong>Anmelde-Sitzung (Supabase):</strong> technisch notwendige Cookies zur
          Aufrechterhaltung der Anmeldung.
        </li>
        <li>
          <strong>Admin-Sitzung:</strong> ein technisch notwendiges Cookie für den geschützten
          Verwaltungsbereich (nur für Administratoren).
        </li>
        <li>
          <strong>Cloudflare Turnstile:</strong> technisch notwendige Cookies/Local-Storage zum
          Bot-Schutz.
        </li>
        <li>
          <strong>Lokale Einstellungen:</strong> im Browser gespeicherte Filter-/Ansichts­
          einstellungen (Session Storage), die deine Bedienung erleichtern und den Server nicht
          erreichen.
        </li>
      </ul>
      <p>
        Es werden keine Analyse- oder Marketing-Cookies gesetzt; die Reichweitenmessung
        (Ziffer 6) arbeitet cookiefrei. Für die technisch notwendigen Cookies ist keine
        Einwilligung erforderlich (§ 25 Abs. 2 TDDDG).
      </p>

      <h2>9. Empfänger / Auftragsverarbeiter</h2>
      <ul>
        <li>[Hosting-Anbieter] / Vercel Inc. – Auslieferung der Website und Reichweitenmessung</li>
        <li>Supabase, Inc. – Authentifizierung und Datenbank</li>
        <li>Cloudflare, Inc. – Bot-Schutz (Turnstile)</li>
      </ul>
      <p>
        Eine Weitergabe an weitere Dritte erfolgt nicht, außer wir sind gesetzlich dazu
        verpflichtet.
      </p>

      <h2>10. Speicherdauer</h2>
      <p>
        Kontodaten und zugehörige Nutzungsdaten werden gespeichert, solange dein Konto besteht.
        Bei Löschung des Kontos werden die dir zugeordneten personenbezogenen Daten gelöscht
        oder anonymisiert; bereits anonymisierte Aggregatwerte (z. B. Wartezeit-Durchschnitte)
        bleiben bestehen. Server-Logfiles werden nach [z. B. 14 Tagen] gelöscht bzw.
        anonymisiert. Gesetzliche Aufbewahrungspflichten bleiben unberührt.
      </p>

      <h2>11. Deine Rechte</h2>
      <p>Du hast im Rahmen der gesetzlichen Voraussetzungen das Recht auf:</p>
      <ul>
        <li>Auskunft über die zu dir gespeicherten Daten (Art. 15 DSGVO)</li>
        <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
        <li>Löschung (Art. 17 DSGVO)</li>
        <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>
          Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
          (Art. 21 DSGVO)
        </li>
      </ul>
      <p>
        Zur Ausübung deiner Rechte genügt eine Nachricht an [datenschutz@deine-domain.de].
        Außerdem hast du das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren,
        insbesondere in dem Mitgliedstaat deines Aufenthaltsorts oder des mutmaßlichen
        Verstoßes.
      </p>

      <h2>12. Keine automatisierte Entscheidungsfindung</h2>
      <p>
        Eine ausschließlich automatisierte Entscheidungsfindung einschließlich Profiling nach
        Art. 22 DSGVO findet nicht statt.
      </p>

      <h2>13. Änderungen dieser Datenschutzerklärung</h2>
      <p>
        Wir passen diese Datenschutzerklärung an, wenn sich die Rechtslage oder die
        eingesetzten Dienste ändern. Es gilt jeweils die auf dieser Seite veröffentlichte
        Fassung. Stand: [Monat Jahr].
      </p>
    </RechtsSeite>
  );
}
