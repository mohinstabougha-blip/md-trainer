# KP-Trainer App – Erweiterung Version 2

Diese Datei ergänzt `KP_Trainer_App_Spezifikation.md` (Version 1, bereits gebaut).
Bitte NICHT alles auf einmal umsetzen lassen — Phase für Phase, jede Phase testen,
bevor die nächste beginnt. Sonst wird es für Claude Code (und für dich zum Prüfen)
zu unübersichtlich.

---

## PHASE A – Lern-Kern verbessern (zuerst umsetzen)

### A1. Themenauswahl: Gesamtanzahl statt Anzahl wählen
Bisher: Nutzer wählt vorab "10/20/50 Fragen".
Neu: Bei Auswahl eines Moduls/Kurses zeigt die App sofort die **Gesamtanzahl
verfügbarer Fragen** an (z.B. "Herzinsuffizienz — 12 Fragen verfügbar").
Zusätzlich eine Sortier-Option für die Reihenfolge, in der Fragen kommen:
- Neueste zuerst (nach `erstellt_am`)
- Älteste zuerst
- Häufigste zuerst (siehe A-DB unten: Zähler, wie oft eine Frage in echten
  Prüfungen laut Protokollen vorkam)

**Datenbank-Ergänzung `questions`:** neues Feld `haeufigkeit` (int, Standard 1) —
wie oft diese Frage/dieses Thema in den Protokollen vorkam. Kannst du später
in der Admin-Oberfläche pro Frage hochzählen.

### A2. Hilfe-Button pro Frage
Kleiner Button/Icon "💡 Hilfe" neben dem Antwortfeld. Zeigt NICHT die Musterantwort,
sondern eine kurze **Strukturhilfe**, was die Antwort enthalten sollte — z.B. bei
"Wie läuft eine Appendektomie ab?": *"Nenne: Schnittführung, zu unterbindendes
Gefäß, OP-Schritte in Reihenfolge."*

**Datenbank-Ergänzung `questions`:** neues Feld `hilfe_hinweis` (text, nullable).
Für bestehende 131 Fragen muss dieses Feld noch nachträglich befüllt werden
(Admin-Aufgabe, kann später erledigt werden — Button einfach ausblenden, wenn leer).

### A3. Spracherkennung im Antwortfeld (zuverlässig auf allen Geräten)
Da es auf Web + iOS + Android zuverlässig laufen soll: **natives Plugin**, nicht
nur die Browser-Web-Speech-API (die funktioniert nur in Chrome und nicht in der
gepackten iOS/Android-App zuverlässig).
- Für iOS/Android (Capacitor-App): `@capacitor-community/speech-recognition`
  Plugin verwenden — nutzt die native Spracherkennung des Betriebssystems
- Für die reine Web-Version (Browser): Fallback auf die Web Speech API
- Mikrofon-Icon im Antwortfeld, Text wird direkt ins Feld diktiert, Nutzer kann
  danach noch von Hand korrigieren

### A4. Kurze, knappe Korrektur (max. 30 Wörter, keine Verben)
Prompt für die Bewertung anpassen:
> "Vergleiche Nutzerantwort mit Musterantwort. Antworte in maximal 30 Wörtern,
> als Stichpunkte OHNE Verben (keine ganzen Sätze), nenne nur: was fehlt, worauf
> der Nutzer sich als Nächstes fokussieren soll. Kein Lob, keine Füllwörter.
> Beispiel: 'Fehlt: Douglas-Schmerz, Psoas-Zeichen. Fokus: rektale Untersuchung.'"

### A5. Schnelle Bewertung
Für die Antwortbewertung **Claude Haiku 4.5** verwenden (Modell-String
`claude-haiku-4-5-20251001`) statt eines größeren Modells — reicht für kurze
Stichpunkt-Bewertung völlig aus und ist deutlich schneller + günstiger. Das
größere Modell nur für die Session-Zusammenfassung (A6) verwenden, falls nötig.

### A6. Kurze Session-Zusammenfassung (~30 Wörter)
Am Ende einer Session: ein kurzer Text (~30 Wörter), was wiederholt werden soll,
z.B.: *"Wiederhole: Elektrolytstörungen (EKG-Zeichen), Meningitis-Erregerspektrum.
Gut beherrscht: Appendizitis, Herzinsuffizienz-Therapie."*
Ersetzt/ergänzt die bisherige längere Zusammenfassung aus Version 1 — kürzer
und direkter.

---

## PHASE B – Nutzerkonten + Wartezeit-Tracker

### B1. Pflicht-Login
Registrierung/Login Pflicht, um die App zu nutzen (Supabase Auth: E-Mail + Passwort,
optional Google-Login).

### B2. Community-Wartezeit-Anzeige
Oben auf der Hauptseite (nach Login) wird eine **geschätzte aktuelle Wartezeit**
angezeigt, berechnet aus den Meldungen aller Nutzer, z.B.:
*"Ø Wartezeit aktuell: Antrag → Rechnung ca. 4 Monate, Rechnung → Prüfungstermin
ca. 2,5 Monate (basierend auf 87 Meldungen)"*

**Neue Tabelle `wartezeit_meldungen`:**
| Feld | Typ |
|---|---|
| id | int, primary key |
| user_id | uuid |
| antrag_datum | date |
| rechnung_erhalten | boolean |
| rechnung_datum | date, nullable |
| termin_erhalten | boolean |
| pruefungsdatum | date, nullable |
| erstellt_am | timestamp |

Button "Meine Daten eintragen/aktualisieren" öffnet ein einfaches Formular mit
genau diesen Feldern. Berechnung der Durchschnittswerte serverseitig (z.B. als
Supabase-View oder kleine Funktion), nicht bei jedem Seitenaufruf neu über alle
Nutzer berechnen (Performance).

---

## PHASE C – Marketplace (Simulationspartner, Kurse, Bücher)

**Wichtig — rechtlicher Hinweis, MUSS immer sichtbar sein:**
Auf jedem Angebot und beim Erstellen eines Angebots muss dieser Text stehen:
> "⚠️ Zahlungen laufen nicht über diese App. Wir empfehlen dringend, nicht im
> Voraus zu bezahlen. Wir übernehmen keine Verantwortung für Vereinbarungen
> zwischen Nutzern."

**Neue Tabelle `angebote`:**
| Feld | Typ |
|---|---|
| id | int, primary key |
| user_id | uuid (Ersteller) |
| kategorie | enum: 'simulation_kostenlos' / 'kurs_kostenpflichtig' / 'buch' / 'sonstiges' |
| titel | text |
| beschreibung | text |
| preis | text, nullable (nur Anzeige, keine Zahlungsabwicklung) |
| status | enum: 'aktiv' / 'inaktiv' |
| erstellt_am | timestamp |

**Neue Tabelle `angebot_nachrichten`:** einfaches 1:1-Nachrichtensystem
(user_id_von, user_id_an, angebot_id, text, gelesen, erstellt_am)

**Neue Tabelle `angebot_kommentare`:** öffentliche Kommentare/Meinungen zu
einem Angebot (user_id, angebot_id, text, erstellt_am)

Marketplace-Übersicht: Liste/Filter nach Kategorie, Suchfunktion.

---

## PHASE D – Community-Inhalte (Kommentare + eigene Fragen einreichen)

### D1. Öffentliche Kommentare zu Musterantworten
Unter jeder Musterantwort ein Kommentarbereich (wie ein kleines Forum), wo
Nutzer Ergänzungen/Anmerkungen schreiben können.

**Neue Tabelle `antwort_kommentare`:**
(question_id, user_id, text, erstellt_am)

### D2. Nutzer reichen eigene Fragen/Protokolle ein — Freigabe nur durch Admin
Nutzer können über ein Formular neue Fragen (inkl. Musterantwort-Vorschlag) oder
ganze Protokoll-Texte einreichen. Diese landen NICHT direkt in `questions`,
sondern in einer separaten Tabelle und erscheinen erst nach deiner Freigabe.

**Neue Tabelle `einreichungen`:**
| Feld | Typ |
|---|---|
| id | int, primary key |
| user_id | uuid |
| typ | enum: 'einzelfrage' / 'protokoll' |
| modul | text, nullable |
| kurs | text, nullable |
| teil | int, nullable |
| frage | text, nullable |
| antwort_vorschlag | text, nullable |
| protokoll_text | text, nullable (bei ganzen Protokollen, unstrukturiert) |
| status | enum: 'offen' / 'freigegeben' / 'abgelehnt' |
| admin_kommentar | text, nullable |
| erstellt_am | timestamp |

**Admin-Bereich Erweiterung:** neuer Tab "Einreichungen" — Liste aller offenen
Einreichungen, mit Vorschau, Bearbeiten-Möglichkeit (bevor Freigabe) und Buttons
"Freigeben" (kopiert automatisch in `questions`) / "Ablehnen" (mit Kommentar,
warum).

---

## Empfohlene Reihenfolge für Claude Code

Gib Claude Code **eine Phase nach der anderen**, nicht alles auf einmal. Beispiel
für den ersten Prompt:

> "Lies KP_Trainer_App_Erweiterung_v2.md, Abschnitt PHASE A. Setze A1 bis A6 um,
> einen Punkt nach dem anderen. Erkläre kurz, was du bei jedem Punkt änderst."

Erst wenn Phase A läuft und du sie getestet hast, gibst du den nächsten Prompt für
Phase B, dann C, dann D.
