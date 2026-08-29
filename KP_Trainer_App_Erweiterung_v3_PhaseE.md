# KP-Trainer App – Erweiterung Version 3 (Phase E)

Ergänzt `KP_Trainer_App_Erweiterung_v2.md` (Phasen A-D, bereits umgesetzt).

---

## PHASE E – Navigation, Fortschritts-Tracking, UX-Redesign

### E1. Menü im Frage-Screen
Aktuell hat der Frage-Screen (während einer Session) keine Navigation. Ergänzen:
- Kleines Menü-Icon (oben, z.B. Hamburger-Icon ☰) öffnet ein Menü mit:
  - Zurück zur Trainer-Hauptseite
  - Nachrichten (mit Ungelesen-Badge, falls vorhanden — gibt's schon aus Phase C)
  - Marktplatz
  - Profil/Einstellungen
  - Admin-Bereich (nur sichtbar, falls eingeloggter Nutzer Admin ist)
- **"Session abbrechen"-Button** direkt sichtbar im Frage-Screen (nicht im Menü versteckt,
  z.B. oben rechts als "×" oder "Abbrechen"-Text). Beim Klick: kurze Bestätigung
  ("Session wirklich abbrechen? Dein bisheriger Fortschritt wird gespeichert."),
  dann zurück zur Hauptseite. Die Session wird dabei NICHT verworfen, sondern als
  `abgebrochen` gespeichert (siehe E2).

### E2. Alle Sessions speichern (auch unvollständige)
**Neue/erweiterte Tabelle `sessions`:**
| Feld | Typ |
|---|---|
| id | uuid, primary key |
| user_id | uuid |
| modus | text (zufällig / modul / kurs / nie_gesehen / falsch_beantwortet) |
| filter_werte | jsonb (z.B. welches Modul/Kurs/Teil gewählt wurde) |
| gestartet_am | timestamp |
| beendet_am | timestamp, nullable |
| status | enum: 'laufend' / 'abgeschlossen' / 'abgebrochen' |

Jede Antwort in `results` bekommt weiterhin die `session_id` — auch bei abgebrochenen
Sessions bleiben die bereits beantworteten Fragen erhalten und zählen in die Statistik.

### E3. Fortschritts-Statistik auf der Hauptseite
Für jedes Modul ein kleines **Kreisdiagramm** (donut chart), das zeigt:
- Wie viele der verfügbaren Fragen in diesem Modul der Nutzer schon mindestens
  einmal beantwortet hat (z.B. "14 von 20 Fragen bearbeitet")
- Innerhalb davon: wie viele zuletzt richtig / teilweise / falsch bewertet wurden
  (z.B. als Farbsegmente im Ring: grün = richtig, gelb = teilweise, rot = falsch,
  grau = noch nie gesehen)

Berechnung: für jede Frage der letzte `results`-Eintrag des Nutzers zählt (nicht
alle Versuche, nur der aktuellste Stand pro Frage).

### E4. Neue Auswahl-Modi beim Session-Start
Zusätzlich zu den bestehenden Modi (Zufällig / nach Modul / nach Kurs) drei neue
Filter-Optionen, die mit den bestehenden kombinierbar sind (z.B. "Kardiologie" +
"noch nie gesehen"):
- **"Noch nie gesehen"** — Fragen, zu denen der Nutzer noch keinen `results`-Eintrag hat
- **"Schon gesehen"** — Fragen mit mindestens einem `results`-Eintrag
- **"Falsch beantwortet"** — Fragen, deren letzter `results`-Eintrag `falsch` oder
  `teilweise` war

Bei jeder Auswahl wird (wie in Phase A1 schon umgesetzt) die Live-Anzahl der
verfügbaren Fragen für diese Kombination angezeigt.

### E5. UX-Redesign — sauber, hell, wie Instagram
Kompletter visueller Refresh, Richtung: schlicht, viel Weißraum, hell (weißer/sehr
heller Hintergrund statt aktuell dunkel), klare Typografie, dezente Trennlinien
statt schwerer Rahmen, abgerundete Ecken bei Karten/Buttons, ein bis zwei
Akzentfarben (nicht mehr), große Touch-Ziele für Mobile. Konkret:
- Weißer/naheweißer Hintergrund (#FFFFFF oder #FAFAFA)
- Dunkler Text (nicht reines Schwarz, z.B. #262626) für besseren Kontrast/weniger hart
- Eine klare Akzentfarbe für Buttons/Fortschrittsringe (z.B. ein warmes Blau oder
  das bisherige Orange aus dem Logo — Konsistenz mit bestehendem Branding)
- Karten mit leichtem Schatten statt Rahmen, großzügiger Innenabstand (Padding)
- Bottom-Navigation auf Mobile (Home/Trainer, Nachrichten, Marktplatz, Profil) statt
  Hamburger-Menü, falls das auf kleinen Bildschirmen besser nutzbar ist — Claude Code
  soll hier die für Next.js/Capacitor gängige Lösung wählen
- Wichtig: das ist ein reines Stil-Update der bestehenden Screens, keine
  Funktionsänderung — alle Features aus Phase A-D bleiben wie sie sind, nur die
  Optik ändert sich

---

## Empfohlene Reihenfolge

E1+E2 zuerst (Navigation + Session-Speicherung — technisches Fundament), dann E3+E4
(Statistik + neue Filter, bauen auf E2 auf), E5 zuletzt (Redesign — betrifft dann
alle bereits fertigen Screens auf einmal, macht am meisten Sinn ganz am Ende).
