# KP-Trainer App – Erweiterung Version 4 (Phase F)

Ergänzt die bisherigen Phasen A-E. Betrifft NUR das Layout der Trainer-Hauptseite
(Startseite nach Login), basierend auf einer Handskizze des Nutzers.

---

## PHASE F – Neues Hauptseiten-Layout

### Aufbau von oben nach unten:

**1. Obere Leiste**
- Links: **"+"-Icon** → führt direkt zum Formular "Frage oder Protokoll einreichen"
  (aus Phase D2, bereits vorhanden — hier nur als schneller Zugang von der
  Hauptseite aus verlinkt)
- Rechts: kleines rundes Badge mit der **Gesamt-Wartezeit** (die Community-Wartezeit-
  Anzeige aus Phase B2, aber kompakt als Badge statt als Textzeile), z.B. "6,5 Mon."
  — Tippen darauf öffnet die Detailansicht (Aufschlüsselung Antrag→Rechnung /
  Rechnung→Termin, plus das Formular zum eigenen Eintragen, wie in B2 spezifiziert)

**2. Fortschritts-Kreise pro Modul (horizontal scrollbar)**
Reihe von runden Fortschritts-Badges, einer pro Modul, mit Beschriftung darunter
(z.B. "8/8 Chirurgie", "7/7 Dermato", "6/6 Endokrino" — Zahl = bearbeitete Fragen
von verfügbaren Fragen in diesem Modul). Das sind die Fortschritts-Ringe aus
Phase E3, hier nur als kompakte horizontale Leiste statt als große Kacheln
dargestellt. Bei mehr Modulen als auf den Bildschirm passen: seitlich wischbar.
Tippen auf ein Modul-Badge = direkter Sprung in eine Session mit diesem Modul
vorausgewählt.

**3. Auswahl-Liste für die nächste Session**
Vier Zeilen, jede mit Label links und aktuellem Wert + ">"-Pfeil rechts (tippen
öffnet eine Auswahl, ähnlich einem Einstellungsmenü):
- **Fächer** — Standardwert "zufällig" (= alle Module gemischt); alternativ ein
  oder mehrere Module gezielt auswählen (siehe Phase A/B: Modus-Auswahl)
- **Teil** — Standardwert "alle" (Teil 1+2+3 gemischt); alternativ Teil 1, 2 oder 3
  gezielt wählen
- **Reihenfolge** — Standardwert "häufiger" (= häufigste Fragen zuerst, aus Phase
  A1); alternativ "neueste zuerst" / "älteste zuerst" / "zufällig"
- **Fortschritt** — Standardwert "falsch beantwortet" (nutzt den Filter aus Phase
  E4); alternativ "noch nie gesehen" / "schon gesehen" / "alle" (kein Filter)

Unterhalb dieser vier Zeilen: großer **"Session starten"-Button**, der die
Live-Anzahl verfügbarer Fragen für die aktuell gewählte Kombination anzeigt
(z.B. "12 Fragen starten") — Prinzip aus Phase A1, hier auf die neue Kombination
aus allen vier Filtern angewendet.

**4. Untere Navigationsleiste (fixiert, immer sichtbar)**
Drei Icons, wie in Phase E1/E5 bereits als Bottom-Navigation umgesetzt — hier
noch mal explizit bestätigt/vereinfacht auf genau drei Hauptpunkte:
- **Home** (Haus-Icon) — diese Hauptseite
- **Inbox** (Papierflieger-/Nachrichten-Icon) — Nachrichten aus Phase C3, mit
  Ungelesen-Badge
- **Marktplatz** (Laden-Icon) — aus Phase C

(Profil/Einstellungen: falls schon als viertes Icon vorhanden, kann es bleiben
oder in ein Menü über das Profilbild/Icon oben verschoben werden — Claude Code
soll hier die aufgeräumtere Variante wählen, das Mockup zeigt bewusst nur drei
Icons unten.)

### Wichtiger Hinweis
Dies ist ein Layout-Update der Startseite, keine neue Funktion — alle Filter,
Fortschrittsdaten und Zähler existieren bereits aus Phase A-E und werden hier nur
neu angeordnet/dargestellt.
