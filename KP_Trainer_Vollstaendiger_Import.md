# KP-Trainer – Vollständiger Fragen-Import aus allen 7 Protokollen

Ziel: systematisch ALLE Prüfungsfragen aus den 7 PDF-Protokollen (Freiburg,
Heidelberg, Mannheim, Stuttgart, Tübingen, Ulm, Baden-Baden) erfassen — nicht nur
Radiologie, sondern alle Fachrichtungen (Kardiologie, Gastroenterologie,
Pneumologie, Nephrologie, Neurologie, Chirurgie, Endokrinologie, Hämatologie,
Notfallmedizin, Pharmakologie, Gynäkologie, Pädiatrie, Psychiatrie, etc. — je
nachdem was in den Protokollen tatsächlich vorkommt).

## Vorgehen (bitte in dieser Reihenfolge)

1. **Bestand erfassen:** Zuerst alle bereits in `questions` vorhandenen Fragen
   auslesen (aktuell ca. 130 allgemeine + 35 Radiologie = ca. 165). Kurze Liste
   von Frage-Kernthemen/-Stichworten daraus ableiten (z.B. als einfache Liste von
   Frage-Texten oder Themen-Schlagworten), um sie später zum Abgleich zu nutzen.

2. **PDFs vollständig durchgehen, Protokoll für Protokoll, Stadt für Stadt:**
   Jede der 7 PDF-Dateien einzeln und vollständig lesen (nicht nur Auszüge/
   Stichproben). Für jeden einzelnen im Protokoll dokumentierten Prüfungsbericht
   alle enthaltenen Fragen aus Teil 1 (Anamnese/körperliche Untersuchung — hier
   wie schon in der bestehenden Datenbank üblich als vollständige "erfahrener
   Arzt"-Checkliste behandeln, falls das Protokoll nur die Diagnose ohne
   Einzelfragen nennt), Teil 2 (Patientenvorstellung/klinische Zeichen/
   Prüferfragen) und Teil 3 (medizinische Fragen) erfassen.

3. **Gegen den Bestand abgleichen, bevor gespeichert wird:** Für jede neu
   gefundene Frage prüfen, ob sie inhaltlich bereits existiert (gleiches Thema,
   nicht nur exakt gleicher Wortlaut — z.B. "Therapie der Herzinsuffizienz" zählt
   als Duplikat, auch wenn der Protokoll-Wortlaut leicht abweicht). Nur wirklich
   neue Themen/Fragen aufnehmen. Bei Unsicherheit lieber überspringen als
   doppelt anlegen.

4. **Speichern in der bestehenden Struktur:** Neue Fragen mit denselben Feldern
   wie bisher (Modul, Kurs, Teil, Frage, Musterantwort, hilfe_hinweis, quelle)
   in die `einreichungen`-Warteschlange schreiben (status='offen'), NICHT direkt
   live in `questions` — genau wie beim letzten Radiologie-Import, damit ich sie
   vor Freigabe durchsehen kann.

5. **Am Ende einen kurzen Bericht geben:** Wie viele PDFs durchsucht, wie viele
   Fragen insgesamt gefunden, wie viele davon als Duplikate übersprungen, wie
   viele neu als Einreichungen angelegt wurden — aufgeschlüsselt nach Modul, damit
   ich sehe, welche Fachrichtungen jetzt gut abgedeckt sind und wo eventuell noch
   Lücken bestehen.

## Wichtig
- Musterantworten wie bisher: knapp, fachlich fundiert, kann bei Bedarf über das
  reine Protokoll hinaus mit medizinischem Fachwissen ergänzt werden (nicht nur
  wörtliche Protokoll-Abschrift, aber auch keine Erfindung von Fakten, die dem
  Protokoll-Kontext widersprechen).
- hilfe_hinweis für jede neue Frage mit erzeugen (kurze Stichworte, keine Lösung),
  wie beim letzten Mal.
- Bei Radiologie-relevanten neuen Funden: gleicher Stil wie beim letzten Import
  anwenden (neutrale Frage "Schreiben Sie einen kurzen Befund...", ohne den
  Befund in der Frage vorwegzunehmen).
