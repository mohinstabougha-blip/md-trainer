# KP-Trainer App – Projekt-Spezifikation für Claude Code

## Ziel
Eine Lern-App für die medizinische Kenntnisprüfung (KP) in Baden-Württemberg, die auf
**aktivem Abrufen (Active Recall)** basiert: Der Nutzer bekommt eine Frage und muss
selbst frei antworten (Freitext, keine Multiple-Choice-Optionen), bevor die Musterantwort
gezeigt wird. Eine KI bewertet die Antwort und gibt Feedback.

## Plattformen
Eine Codebasis für: Web-App + iOS-App + Android-App.
- Frontend/Backend: **Next.js** (React), gehostet z.B. auf Vercel
- Mobile Verpackung: **Capacitor**, um dieselbe Web-App als native iOS/Android-App
  im App Store / Play Store zu veröffentlichen
- Datenbank: **Supabase** (Postgres, einfach anzubinden, hat Auth + Storage für Bilder
  gleich eingebaut)

## Datenmodell (Startpunkt: KP_Trainer_Fragen_Datenbank.xlsx)

Tabelle `questions`:
| Feld | Typ | Beschreibung |
|---|---|---|
| id | int, primary key | |
| modul | text | großes Fachgebiet, z.B. "Kardiologie" |
| kurs | text | spezifisches Thema, z.B. "Herzinsuffizienz" |
| teil | int (1/2/3) | 1 = Anamnese/KU, 2 = Patientenvorstellung, 3 = medizinische Fragen |
| frage | text | wird dem Nutzer angezeigt |
| bild_frage_url | text, nullable | optionales Bild zur Frage (Röntgen, EKG, Hautbefund) |
| musterantwort | text | wird NICHT angezeigt, bevor Nutzer selbst geantwortet hat |
| bild_antwort_url | text, nullable | optionales Bild zur Musterantwort |
| quelle | text | interne Notiz, woher die Frage stammt |
| erstellt_am | timestamp | |

Tabelle `results` (Ergebnis-Tracking pro Nutzer):
| Feld | Typ |
|---|---|
| id | int, primary key |
| user_id | uuid (Referenz auf Supabase-Auth-User) |
| question_id | int (Referenz auf questions) |
| bewertung | enum: 'richtig' / 'teilweise' / 'falsch' |
| nutzer_antwort | text |
| feedback_text | text (von der KI generiertes Feedback) |
| session_id | uuid (gruppiert Fragen, die zusammen beantwortet wurden) |
| erstellt_am | timestamp |

Tabelle `feedback` (Nutzer meldet fehlerhafte Frage/Antwort):
| Feld | Typ |
|---|---|
| id | int, primary key |
| question_id | int |
| user_id | uuid |
| typ | enum: 'frage_fehlerhaft' / 'antwort_fehlerhaft' / 'bild_fehlt_oder_falsch' / 'sonstiges' |
| kommentar | text |
| status | enum: 'offen' / 'erledigt' |
| erstellt_am | timestamp |

## Kern-Nutzerfluss (normale Nutzer)

1. **Start-Screen:** Modus wählen
   - Zufällig (alle Module gemischt)
   - Nach Modul (Mehrfachauswahl möglich, z.B. Kardio + Gastro)
   - Nach Kurs (spezifisches Thema, z.B. nur "Herzinsuffizienz")
   - Dazu: Teil wählen (1/2/3) oder "Vollsimulation" (alle 3 nacheinander)
   - Anzahl Fragen für die Session wählen (z.B. 10/20/50)

2. **Frage-Screen:**
   - Frage anzeigen (+ Bild, falls `bild_frage_url` vorhanden)
   - Freitext-Eingabefeld (Pflichtfeld — "Weiter" ist erst aktiv, wenn Nutzer etwas
     eingegeben hat)
   - Kleines Feedback-Icon (⚠️) in der Ecke, öffnet ein kleines Formular:
     Typ auswählen (Frage/Antwort/Bild fehlerhaft) + Kommentarfeld → speichert in
     `feedback`-Tabelle
   - Timer optional (an/aus), simuliert Prüfungsdruck (Teil 1 typischerweise 30 Min)

3. **Nach Absenden der Antwort:**
   - Aufruf der Anthropic API (Modell: `claude-sonnet-4-6`) mit Prompt:
     "Vergleiche die Nutzerantwort mit der Musterantwort. Bewerte als richtig/
     teilweise/falsch. Nenne kurz, was gut war und was fehlt. Antworte auf Deutsch,
     im Ton eines wohlwollenden erfahrenen Prüfers."
   - Bewertung + Feedback anzeigen
   - Erst DANACH die vollständige Musterantwort (+ `bild_antwort_url`) zeigen
   - "Nächste Frage"-Button

4. **Ergebnis-Screen (am Ende der Session):**
   - Score: X von Y richtig / teilweise / falsch (3-stufig, nicht nur binär)
   - "Das lief gut": automatisch generierte Liste der Module/Kurse mit hoher
     Trefferquote in dieser Session
   - "Das solltest du üben": Module/Kurse mit niedriger Trefferquote, sortiert nach
     Dringlichkeit (z.B. "Elektrolytstörungen: 2 von 5 richtig")
   - Diese Zusammenfassung entsteht durch einen zweiten LLM-Call, der alle
     Einzelbewertungen der Session zusammenfasst
   - Button: "Diese Themen nochmal üben" → startet neue Session gefiltert auf die
     schwachen Kurse

5. **Fortschritt (übergreifend, nicht nur pro Session):**
   - Kleine Statusanzeige pro Kurs in der Kurs-Auswahl (z.B. Ampel-Farbe oder %),
     basierend auf den letzten Ergebnissen aus der `results`-Tabelle

## Admin-Bereich (nur für dich, passwortgeschützt)

Separate Route `/admin`, eigener Login (nicht der normale Nutzer-Login).

- **Fragen-Liste:** Tabelle aller Fragen, filter-/suchbar nach Modul/Kurs/Teil,
  mit "Bearbeiten"- und "Löschen"-Button pro Zeile
- **Formular Frage bearbeiten/hinzufügen:**
  - Textfelder: Modul, Kurs, Teil (Dropdown 1/2/3), Frage, Musterantwort
  - Bild-Upload für Frage UND separat für Antwort (Vorschau direkt im Formular),
    Speicherung in Supabase Storage, Link wird automatisch in `bild_frage_url`/
    `bild_antwort_url` eingetragen
  - Speichern-Button
- **Tab "Gemeldetes Feedback":** zeigt alle offenen Einträge aus der `feedback`-
  Tabelle, sortiert nach Anzahl Meldungen pro Frage; Klick springt direkt zum
  Bearbeiten-Formular der betroffenen Frage; Button "als erledigt markieren"

## Erste Umsetzungsschritte für Claude Code

1. Next.js-Projekt aufsetzen, Supabase-Projekt anlegen und verbinden
2. `questions`-Tabelle aus der beigelegten Excel-Datei importieren (Importskript
   schreiben, das die 9 Spalten einliest)
3. Start-Screen (Moduswahl) bauen
4. Frage-Screen mit Freitext-Eingabe + Feedback-Icon bauen
5. Anthropic-API-Anbindung für Antwortbewertung einbauen (API-Key als
   Umgebungsvariable, nie im Frontend-Code)
6. Ergebnis-Screen bauen
7. Admin-Bereich (Login, Fragen-CRUD, Bild-Upload, Feedback-Übersicht) bauen
8. Mit Capacitor für iOS/Android verpacken (erst nachdem die Web-Version läuft
   und getestet ist)

## Wichtiger Hinweis zu Kosten
Jede Antwortbewertung ist ein API-Aufruf und kostet Geld (nach Nutzung abgerechnet).
Bei vielen Nutzern lohnt es sich, ein Nutzungslimit pro Tag/Nutzer einzubauen, damit
die Kosten kontrollierbar bleiben.
