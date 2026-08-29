# KP-Trainer App – Erweiterung Version 5 (Phase G)

Ergänzt die bisherigen Phasen A-F. Ziel: Nachrichten aus KP-Telegram-Gruppen
automatisiert nach möglichen Fragen durchsuchen und als Vorschläge in die
bestehende Einreichungen-Warteschlange (Phase D2) einspeisen — NICHTS wird
ungeprüft direkt in die Fragendatenbank übernommen.

---

## PHASE G – Telegram-Import (separates Skript, kein Teil der Web-App)

### Wichtig: separates Projekt, nicht in Next.js/Capacitor eingebaut
Dies läuft als eigenständiges Python-Skript (mit der Bibliothek **Telethon**),
nicht als Teil der App selbst — läuft z.B. einmal täglich automatisch (Cron-Job)
oder manuell gestartet, verbindet sich zur Supabase-Datenbank der App und schreibt
Vorschläge in die `einreichungen`-Tabelle (aus Phase D2).

### G0. Voraussetzung — VOR dem technischen Aufbau
Bevor irgendetwas gebaut wird: Informiere die Admins der betroffenen KP-Telegram-
Gruppen, dass Nachrichten automatisiert nach Prüfungsfragen durchsucht werden, und
hole ihr Einverständnis ein. Ohne das nicht umsetzen — auch technisch mögliche
Dinge sollten nicht ohne Zustimmung der Communitys laufen, deren Daten genutzt
werden.

### G1. Telegram-API-Zugang einrichten (einmalig, durch dich als Nutzer)
1. Gehe zu https://my.telegram.org, mit deiner Telefonnummer einloggen
2. "API development tools" → neue App anlegen (Name/Kurzname frei wählbar)
3. Du bekommst eine `api_id` (Zahl) und einen `api_hash` (Zeichenkette) — diese
   brauchst du für Telethon, NIEMALS öffentlich teilen (wie ein Passwort behandeln)

### G2. Skript-Aufbau
- Telethon verbindet sich mit deinem eigenen Telegram-Account (liest die Gruppen
  mit, in denen du ohnehin Mitglied bist)
- Für jede zu überwachende Gruppe: neue Nachrichten seit dem letzten Lauf abrufen
- Für jede Nachricht: über die Anthropic API (Claude Haiku, günstig/schnell)
  prüfen lassen: "Enthält dieser Text eine Prüfungsfrage oder einen Fallbericht
  aus einer KP-Prüfung? Falls ja, extrahiere: Modul, Kurs (falls erkennbar), Teil
  (1/2/3, falls erkennbar), die Frage selbst. Falls nein, antworte nur 'NEIN'."
- Nachrichten ohne erkennbaren Frageninhalt werden verworfen (nicht gespeichert)
- Nachrichten mit erkanntem Inhalt werden in die `einreichungen`-Tabelle
  geschrieben (gleiche Tabelle wie bei manuellen Nutzer-Einreichungen aus Phase D2),
  mit:
  - `typ`: 'protokoll' (roher Text) oder 'einzelfrage' (falls die KI eine klare
    Einzelfrage extrahieren konnte)
  - `status`: 'offen' (erscheint automatisch in deiner Admin-Warteschlange)
  - Herkunft in einem neuen Feld `quelle_typ` = 'telegram' vermerken (damit du im
    Admin-Bereich siehst, was automatisch kam vs. was Nutzer manuell eingereicht
    haben)
- **Kein Autor-Name/keine Telefonnummer aus Telegram wird gespeichert** — nur der
  reine Nachrichteninhalt, um die Privatsphäre der Gruppenmitglieder zu wahren

### G3. Speicherort für den "letzten Lauf" (damit nicht doppelt gelesen wird)
Kleine Datei oder Datenbank-Tabelle, die sich merkt, bis zu welcher Nachrichten-ID
pro Gruppe zuletzt gelesen wurde, damit jeder Lauf nur neue Nachrichten prüft.

### G4. Admin-Bereich — kleine Ergänzung
Im bestehenden "Einreichungen"-Tab (Phase D2): Filter/Kennzeichnung, ob eine
Einreichung von einem Nutzer manuell kam oder automatisch aus Telegram — sonst
identischer Freigabe-Workflow wie gehabt (Freigeben kopiert in `questions`,
Ablehnen mit Begründung).

---

## Praktische erste Schritte für DICH (nicht Claude Code)

1. Gruppenadmins fragen (G0) — zuerst, bevor irgendwas Technisches passiert
2. `api_id`/`api_hash` unter my.telegram.org holen (G1)
3. Dann Claude Code den Auftrag geben (siehe Prompt unten)

## Prompt für Claude Code (wenn 1+2 erledigt sind)

```
Lies KP_Trainer_App_Erweiterung_v5_PhaseG.md. Baue das beschriebene separate
Python-Skript mit Telethon auf, das Telegram-Gruppennachrichten liest und
mögliche KP-Fragen erkennt, dann als Einreichungen in die bestehende
einreichungen-Tabelle schreibt. api_id und api_hash frage mich interaktiv ab
und speichere sie sicher in einer .env-Datei (nicht im Code). Erkläre mir
Schritt für Schritt, wie ich das Skript einmalig zum Testen manuell starte.
```
