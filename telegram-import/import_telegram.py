"""Liest Nachrichten aus konfigurierten Telegram-Gruppen, lässt Claude Haiku
daraus vollständige KP-Prüfungsfragen samt Musterantwort und Hilfe-Hinweis
erstellen, und schreibt Treffer DIREKT (ohne Freigabe-Warteschlange) als live
sichtbare Fragen (quelle_typ='telegram') in die `questions`-Tabelle der
KP-Trainer-App. Erkennt zusätzlich aus dem Gruppennamen ein Prüfungszentrum.
Erkennt unabhängig davon (im selben Anthropic-Aufruf, keine zusätzlichen
Kosten) konkrete persönliche Wartezeit-Datumsangaben (Antrag/Rechnung/
Prüfungstermin) und schreibt sie als Meldung (quelle_typ='telegram') in
`wartezeit_meldungen` — nur bei eindeutigen Daten, nie bei vagen Angaben.
Speichert dabei bewusst NUR den generierten Fragen-/Antworttext bzw. die
extrahierten Datumsangaben — kein Autor, keine Telefonnummer, keine
Telegram-User-ID.

Zwei Modi:
- Normal (kein Argument): nur Nachrichten seit dem letzten Lauf je Gruppe
  (state.json) — das ist der Modus für den täglichen Cron-Job.
- `--since YYYY-MM-DD`: einmaliger Backfill über alle Nachrichten ab diesem
  Datum, unabhängig vom gespeicherten Stand. Zeigt vor der (kostenpflichtigen)
  Klassifizierung eine Schätzung der Nachrichtenzahl je Gruppe und fragt vor
  dem eigentlichen Import nochmal nach Bestätigung.

Manuelle Nutzer-Einreichungen (Phase D2) sind davon nicht betroffen und
durchlaufen weiterhin die normale Admin-Freigabe.

Separates Projekt, kein Teil der Next.js-App.
"""

import argparse
import asyncio
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import anthropic
from dotenv import dotenv_values
from supabase import create_client
from telethon import TelegramClient

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
STATE_PATH = BASE_DIR / "state.json"
SESSION_NAME = str(BASE_DIR / "telegram_import")

MODELL = "claude-haiku-4-5-20251001"
MIN_TEXT_LAENGE = 20  # kürzere Nachrichten (Grüße, Emojis) gar nicht erst prüfen
ERSTLAUF_LIMIT = 50  # beim allerersten Normal-Lauf pro Gruppe nur die letzten N
# Nachrichten holen, nicht die komplette Gruppenhistorie (Kosten/Rate-Limits)

# Für pruefungszentrum: Substring-Suche im Gruppennamen. Tübingen zusätzlich
# ohne Umlaut, da manche Gruppennamen "Tuebingen" schreiben.
PRUEFUNGSZENTREN: dict[str, list[str]] = {
    "Stuttgart": ["stuttgart"],
    "Tübingen": ["tübingen", "tuebingen"],
    "Freiburg": ["freiburg"],
    "Heidelberg": ["heidelberg"],
    "Mannheim": ["mannheim"],
    "Ulm": ["ulm"],
    "Karlsruhe": ["karlsruhe"],
}

KLASSIFIZIERUNGS_TOOL = {
    "name": "kp_frage_erstellen",
    "description": (
        "Prüft einen Text aus einer Telegram-Gruppe und erstellt daraus bei Bedarf "
        "eine vollständige, eigenständige KP-Prüfungsfrage mit Musterantwort und "
        "Hilfe-Hinweis."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "ist_pruefungsfrage": {
                "type": "boolean",
                "description": (
                    "true, wenn der Text eine KP-Prüfungsfrage, einen Fallbericht oder "
                    "einen sonstigen klaren Hinweis auf ein konkretes KP-Prüfungsthema enthält"
                ),
            },
            "modul": {
                "type": ["string", "null"],
                "description": "Medizinisches Modul/Fachgebiet — bei ist_pruefungsfrage=true immer angeben, notfalls die beste Einschätzung",
            },
            "kurs": {
                "type": ["string", "null"],
                "description": "Kurs/Thema innerhalb des Moduls — bei ist_pruefungsfrage=true immer angeben, notfalls die beste Einschätzung",
            },
            "teil": {
                "type": ["integer", "null"],
                "description": "Prüfungsteil 1, 2 oder 3 — bei ist_pruefungsfrage=true immer angeben, notfalls 1 (Anamnese/Untersuchung ist der häufigste Fall)",
            },
            "frage": {
                "type": ["string", "null"],
                "description": (
                    "Eine klare, eigenständige Prüfungsfrage. Falls die Nachricht nur einen "
                    "losen Fallbericht oder Stichworte enthält, daraus eine sinnvolle Frage "
                    "formulieren (z.B. 'Teil-1-Checkliste: Anamnese + Untersuchung bei ...' "
                    "oder eine konkrete Fallfrage für Teil 2/3) — nicht wörtlich zitieren."
                ),
            },
            "musterantwort": {
                "type": ["string", "null"],
                "description": (
                    "Fachlich korrekte, fundierte Musterantwort in knappen Stichpunkten "
                    "(keine ganzen Sätze), im Stil einer Prüfungs-Lernkartei, z.B. "
                    "'ANAMNESE: ..., KU: ...' mit konkreten Differentialdiagnosen, "
                    "Leitsymptomen, Untersuchungsschritten, Scores und Eponymen/Zeichen "
                    "wo fachlich relevant."
                ),
            },
            "hilfe_hinweis": {
                "type": ["string", "null"],
                "description": (
                    "Kurzer Strukturhinweis (max. 15 Wörter) für den Hilfe-Button, der nur "
                    "nennt, WELCHE Kategorien/Aspekte die Antwort abdecken soll — OHNE die "
                    "Lösung selbst zu verraten. Beispiel: 'Nenne: Schnittführung, zu "
                    "unterbindendes Gefäß, OP-Schritte in Reihenfolge.' Bei "
                    "ist_pruefungsfrage=true immer angeben."
                ),
            },
            "enthaelt_wartezeit_angabe": {
                "type": "boolean",
                "description": (
                    "true NUR wenn der Text konkrete, eindeutige persönliche Datumsangaben "
                    "zum eigenen KP-Zulassungsprozess enthält (Datum der Antragstellung, "
                    "Datum des Rechnungserhalts, oder Datum eines Prüfungstermins). Bei "
                    "vagen/unsicheren Angaben ('vor ein paar Monaten', 'letztes Jahr') "
                    "false setzen — lieber zu wenig als falsche Daten übernehmen. "
                    "Unabhängig von ist_pruefungsfrage."
                ),
            },
            "wartezeit_antrag_datum": {
                "type": ["string", "null"],
                "description": "Datum der Antragstellung im Format YYYY-MM-DD, NUR falls eindeutig und konkret genannt, sonst null.",
            },
            "wartezeit_rechnung_datum": {
                "type": ["string", "null"],
                "description": "Datum, an dem die Rechnung erhalten wurde, im Format YYYY-MM-DD, NUR falls eindeutig genannt, sonst null.",
            },
            "wartezeit_pruefungstermin_datum": {
                "type": ["string", "null"],
                "description": "Datum des KP-Prüfungstermins im Format YYYY-MM-DD, NUR falls eindeutig genannt, sonst null.",
            },
        },
        "required": ["ist_pruefungsfrage", "enthaelt_wartezeit_angabe"],
    },
}

SYSTEM_PROMPT = (
    "Du bist ein erfahrener Prüfer für die medizinische Kenntnisprüfung (KP) in "
    "Baden-Württemberg und wertest Nachrichten aus Telegram-Gruppen für angehende "
    "Ärzt:innen aus, die sich auf die KP vorbereiten. Du hast zwei unabhängige Aufgaben:\n\n"
    "AUFGABE 1 — Prüfungsfrage erkennen und erstellen:\n"
    "Enthält der Text eine Prüfungsfrage, einen Fallbericht oder einen sonstigen klaren "
    "Hinweis auf ein konkretes KP-Prüfungsthema? Falls ja:\n"
    "1. Formuliere daraus eine klare, eigenständige Prüfungsfrage — auch wenn die "
    "Nachricht nur einen losen Fallbericht oder Stichworte enthält, leite eine sinnvolle "
    "Frage ab.\n"
    "2. Erstelle dazu eine fachlich korrekte, fundierte Musterantwort in knappen "
    "Stichpunkten, wie in einer etablierten Prüfungs-Lernkartei.\n"
    "3. Ordne Modul, Kurs und Teil (1/2/3) zu — bei Unsicherheit die plausibelste "
    "Einschätzung, nicht leer lassen.\n"
    "4. Formuliere zusätzlich einen kurzen Strukturhinweis (max. 15 Wörter) für den "
    "Hilfe-Button: nennt nur, WELCHE Kategorien/Aspekte die Antwort abdecken soll, "
    "OHNE die Lösung zu verraten (Beispiel: 'Nenne: Schnittführung, zu unterbindendes "
    "Gefäß, OP-Schritte in Reihenfolge.').\n"
    "Ignoriere reinen Chat (Grüße, Terminabsprachen, Small Talk, Werbung) — dafür "
    "ist_pruefungsfrage=false setzen.\n\n"
    "AUFGABE 2 — Wartezeit-Angaben erkennen (unabhängig von Aufgabe 1, auch wenn "
    "ist_pruefungsfrage=false):\n"
    "Enthält der Text konkrete, eindeutige persönliche Datumsangaben zum eigenen "
    "KP-Zulassungsprozess (Antragstellung, Rechnungserhalt, Prüfungstermin)? Nur bei "
    "eindeutigen, konkreten Daten extrahieren (Format YYYY-MM-DD) — bei vagen Angaben "
    "('vor ein paar Monaten', 'letztes Jahr', 'kürzlich') NICHTS eintragen. Lieber zu "
    "wenig als falsche Daten."
)


DATUM_MUSTER = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def ist_gueltiges_datum(wert) -> bool:
    return isinstance(wert, str) and bool(DATUM_MUSTER.match(wert))


def erkenne_pruefungszentrum(gruppenname: str) -> str:
    name_klein = gruppenname.lower()
    for zentrum, suchbegriffe in PRUEFUNGSZENTREN.items():
        if any(begriff in name_klein for begriff in suchbegriffe):
            return zentrum
    return "unbekannt"


def auf_woerter_kuerzen(text: str, max_woerter: int) -> str:
    woerter = text.strip().split()
    if len(woerter) <= max_woerter:
        return text.strip()
    return " ".join(woerter[:max_woerter]) + "…"


def parse_gruppen(roh: str) -> list[str | int]:
    """TELEGRAM_GROUPS akzeptiert @namen (öffentliche Gruppen/Kanäle) und
    numerische Chat-IDs (für Gruppen ohne öffentlichen Namen, siehe list_groups.py) —
    Telethon unterscheidet die beiden Formen am Python-Typ (str vs. int)."""
    ergebnis: list[str | int] = []
    for teil in roh.split(","):
        teil = teil.strip()
        if not teil:
            continue
        try:
            ergebnis.append(int(teil))
        except ValueError:
            ergebnis.append(teil)
    return ergebnis


def lade_konfiguration() -> dict[str, str]:
    if not ENV_PATH.exists():
        sys.exit("Keine .env gefunden. Erst ausführen: python setup.py")
    werte = dotenv_values(ENV_PATH)
    pflichtfelder = [
        "TELEGRAM_API_ID",
        "TELEGRAM_API_HASH",
        "TELEGRAM_PHONE",
        "TELEGRAM_GROUPS",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "ANTHROPIC_API_KEY",
    ]
    fehlend = [f for f in pflichtfelder if not werte.get(f)]
    if fehlend:
        sys.exit(f"In .env fehlen: {', '.join(fehlend)}. Erneut ausführen: python setup.py")
    return werte  # type: ignore[return-value]


def lade_state() -> dict[str, int]:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    return {}


def speichere_state(state: dict[str, int]) -> None:
    STATE_PATH.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")


def klassifiziere(client: anthropic.Anthropic, text: str) -> dict | None:
    try:
        response = client.messages.create(
            model=MODELL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=[KLASSIFIZIERUNGS_TOOL],
            tool_choice={"type": "tool", "name": "kp_frage_erstellen"},
            messages=[{"role": "user", "content": text}],
        )
    except anthropic.APIError as fehler:
        print(f"  ! Anthropic-API-Fehler, Nachricht übersprungen: {fehler}")
        return None

    for block in response.content:
        if block.type == "tool_use":
            return block.input
    return None


def frage_einfuegen(supabase, ergebnis: dict, gruppenname: str, pruefungszentrum: str) -> None:
    hilfe_hinweis = ergebnis.get("hilfe_hinweis")
    eintrag = {
        "modul": ergebnis.get("modul") or "Unsortiert",
        "kurs": ergebnis.get("kurs") or "Telegram-Import",
        "teil": ergebnis.get("teil") if ergebnis.get("teil") in (1, 2, 3) else 1,
        "frage": ergebnis["frage"],
        "musterantwort": ergebnis["musterantwort"],
        "hilfe_hinweis": auf_woerter_kuerzen(hilfe_hinweis, 15) if hilfe_hinweis else None,
        "quelle": f"Telegram: {gruppenname}",
        "quelle_typ": "telegram",
        "pruefungszentrum": pruefungszentrum,
    }
    supabase.table("questions").insert(eintrag).execute()


def wartezeit_meldung_einfuegen(supabase, ergebnis: dict) -> bool:
    """Legt nur an, wenn ein gültiges Antragsdatum vorliegt — die Spalte ist
    NOT NULL, und ohne Antragsdatum lässt sich ohnehin keine sinnvolle
    Wartezeit-Spanne berechnen. Rechnung/Termin sind optionale Ergänzungen."""
    antrag_datum = ergebnis.get("wartezeit_antrag_datum")
    if not ist_gueltiges_datum(antrag_datum):
        return False

    rechnung_datum = ergebnis.get("wartezeit_rechnung_datum")
    rechnung_gueltig = ist_gueltiges_datum(rechnung_datum)
    pruefungstermin_datum = ergebnis.get("wartezeit_pruefungstermin_datum")
    termin_gueltig = ist_gueltiges_datum(pruefungstermin_datum)

    eintrag = {
        "user_id": None,
        "antrag_datum": antrag_datum,
        "rechnung_erhalten": rechnung_gueltig,
        "rechnung_datum": rechnung_datum if rechnung_gueltig else None,
        "termin_erhalten": termin_gueltig,
        "pruefungsdatum": pruefungstermin_datum if termin_gueltig else None,
        "quelle_typ": "telegram",
    }
    supabase.table("wartezeit_meldungen").insert(eintrag).execute()
    return True


def zaehle_relevante(nachrichten: list) -> int:
    return sum(1 for n in nachrichten if len((n.text or "").strip()) >= MIN_TEXT_LAENGE)


async def hole_neue_nachrichten(
    telegram_client: TelegramClient, gruppe, letzte_id: int | None
) -> list:
    if letzte_id is None:
        # Erstlauf: nur die letzten ERSTLAUF_LIMIT Nachrichten, nicht die komplette
        # Historie. get_messages(limit=N) liefert neueste zuerst — für eine
        # konsistente Verarbeitungsreihenfolge (ältere zuerst) umdrehen.
        kuerzlich = await telegram_client.get_messages(gruppe, limit=ERSTLAUF_LIMIT)
        return list(reversed(kuerzlich))
    # Folgelauf: alles seit der zuletzt gesehenen ID, chronologisch (reverse=True
    # bedeutet hier zusammen mit min_id "ab min_id aufwärts", nicht "von ID 1 an").
    return [m async for m in telegram_client.iter_messages(gruppe, min_id=letzte_id, reverse=True)]


async def hole_nachrichten_seit(telegram_client: TelegramClient, gruppe, seit: datetime) -> list:
    # offset_date + reverse=True: Telethon liefert dabei alle Nachrichten NACH
    # diesem Datum, chronologisch aufsteigend bis zur aktuellsten — genau der
    # Bereich "seit X bis heute" für den einmaligen Backfill.
    return [m async for m in telegram_client.iter_messages(gruppe, offset_date=seit, reverse=True)]


async def verarbeite_nachrichten(
    anthropic_client: anthropic.Anthropic,
    supabase,
    nachrichten: list,
    gruppenname: str,
    pruefungszentrum: str,
    letzte_id: int | None,
) -> tuple[int, int, int, int]:
    """Gibt (neue_letzte_id, geprüfte_nachrichten, erstellte_fragen, erstellte_wartezeit_meldungen) zurück."""
    neue_letzte_id = letzte_id or 0
    geprueft = 0
    erstellt = 0
    wartezeit_erstellt = 0

    for nachricht in nachrichten:
        if nachricht.id > neue_letzte_id:
            neue_letzte_id = nachricht.id

        text = (nachricht.text or "").strip()
        if len(text) < MIN_TEXT_LAENGE:
            continue

        geprueft += 1
        ergebnis = klassifiziere(anthropic_client, text)
        if not ergebnis:
            continue

        # Aufgabe 2 (Wartezeit) ist unabhängig von Aufgabe 1 (Prüfungsfrage) —
        # eine Nachricht kann beides, nur eins oder keins von beidem sein.
        if ergebnis.get("enthaelt_wartezeit_angabe") and wartezeit_meldung_einfuegen(supabase, ergebnis):
            wartezeit_erstellt += 1

        if not ergebnis.get("ist_pruefungsfrage"):
            continue
        if not ergebnis.get("frage") or not ergebnis.get("musterantwort"):
            print(f"  ! Frage/Musterantwort fehlt trotz Treffer, Nachricht {nachricht.id} übersprungen.")
            continue

        frage_einfuegen(supabase, ergebnis, gruppenname, pruefungszentrum)
        erstellt += 1

    return neue_letzte_id, geprueft, erstellt, wartezeit_erstellt


async def verarbeite_gruppe(
    telegram_client: TelegramClient,
    anthropic_client: anthropic.Anthropic,
    supabase,
    gruppe,
    gruppenname: str,
    pruefungszentrum: str,
    letzte_id: int | None,
) -> tuple[int, int, int, int]:
    nachrichten = await hole_neue_nachrichten(telegram_client, gruppe, letzte_id)
    return await verarbeite_nachrichten(
        anthropic_client, supabase, nachrichten, gruppenname, pruefungszentrum, letzte_id
    )


async def hauptlauf(seit: datetime | None = None, automatisch_bestaetigt: bool = False) -> None:
    konfig = lade_konfiguration()
    gruppen_konfiguriert = parse_gruppen(konfig["TELEGRAM_GROUPS"])
    if not gruppen_konfiguriert:
        sys.exit("TELEGRAM_GROUPS ist leer — mindestens eine Gruppe eintragen (setup.py erneut ausführen).")

    state = lade_state()
    supabase = create_client(konfig["SUPABASE_URL"], konfig["SUPABASE_SERVICE_ROLE_KEY"])
    anthropic_client = anthropic.Anthropic(api_key=konfig["ANTHROPIC_API_KEY"])

    telegram_client = TelegramClient(
        SESSION_NAME, int(konfig["TELEGRAM_API_ID"]), konfig["TELEGRAM_API_HASH"]
    )

    # client.start(phone=...) übernimmt den kompletten Login-Ablauf interaktiv:
    # beim allerersten Start fragt Telethon selbst nach dem per SMS/App
    # zugesandten Code (und ggf. dem 2FA-Passwort) und legt eine .session-Datei
    # an; bei jedem weiteren Start wird diese wiederverwendet, keine erneute
    # Eingabe nötig.
    await telegram_client.start(phone=konfig["TELEGRAM_PHONE"])
    print("Bei Telegram angemeldet.\n")

    # Dialoge einmal laden: Telethon kann eine Gruppe nur über ihre reine
    # Chat-ID auflösen, wenn es deren access_hash bereits aus einer
    # Dialog-Liste in dieser Session kennt (relevant für Gruppen ohne
    # öffentlichen @Namen, siehe list_groups.py).
    await telegram_client.get_dialogs()

    aufgeloeste_gruppen = []
    for gruppen_eintrag in gruppen_konfiguriert:
        state_schluessel = str(gruppen_eintrag)
        try:
            gruppe = await telegram_client.get_entity(gruppen_eintrag)
        except ValueError as fehler:
            print(
                f"-- {gruppen_eintrag}: konnte nicht aufgelöst werden ({fehler}). "
                "Bist du noch Mitglied? Bei numerischen IDs vorher list_groups.py laufen lassen."
            )
            continue
        anzeige = getattr(gruppe, "title", None) or getattr(gruppe, "username", None) or state_schluessel
        pruefungszentrum = erkenne_pruefungszentrum(anzeige)
        aufgeloeste_gruppen.append((state_schluessel, gruppe, anzeige, pruefungszentrum))

    gesamt_erstellt = 0
    gesamt_wartezeit = 0

    if seit is not None:
        # Backfill-Modus: erst ALLE Nachrichten je Gruppe laden und zählen
        # (kostet nur Telegram-API-Aufrufe), dann erst nach Bestätigung die
        # kostenpflichtige Claude-Klassifizierung starten.
        print(f"Lade Nachrichten seit {seit.date().isoformat()} ...\n")
        geladen = []
        gesamt_relevant = 0
        for state_schluessel, gruppe, anzeige, pruefungszentrum in aufgeloeste_gruppen:
            nachrichten = await hole_nachrichten_seit(telegram_client, gruppe, seit)
            relevant = zaehle_relevante(nachrichten)
            gesamt_relevant += relevant
            print(
                f"-- {anzeige} [{pruefungszentrum}]: {len(nachrichten)} Nachrichten insgesamt, "
                f"{relevant} davon werden klassifiziert (Claude-Aufrufe)"
            )
            geladen.append((state_schluessel, anzeige, pruefungszentrum, nachrichten))

        print(f"\nInsgesamt {gesamt_relevant} Claude-Klassifizierungs-Aufrufe über {len(geladen)} Gruppe(n).")
        if automatisch_bestaetigt:
            # --yes: für Hintergrund-Läufe, wo eine interaktive input()-Abfrage
            # nicht zuverlässig ankommt (z.B. bei per Pipe verbundenem stdin in
            # einem im Hintergrund gestarteten Prozess). Schätzung wurde bereits
            # oben ausgegeben, die eigentliche Bestätigung erfolgt dann vorher
            # explizit im Gespräch mit dem Nutzer, nicht mehr hier im Skript.
            print("--yes gesetzt: fahre ohne Rückfrage fort.")
        else:
            antwort = input("Mit der Klassifizierung fortfahren? [j/N]: ").strip().lower()
            if antwort not in ("j", "ja", "y", "yes"):
                print("Abgebrochen — es wurde nichts klassifiziert oder gespeichert.")
                await telegram_client.disconnect()
                return

        print()
        for state_schluessel, anzeige, pruefungszentrum, nachrichten in geladen:
            letzte_id = state.get(state_schluessel)
            print(f"-- {anzeige}")
            neue_letzte_id, geprueft, erstellt, wartezeit_erstellt = await verarbeite_nachrichten(
                anthropic_client, supabase, nachrichten, anzeige, pruefungszentrum, letzte_id
            )
            state[state_schluessel] = neue_letzte_id
            speichere_state(state)  # nach jeder Gruppe sichern, falls der Lauf abbricht
            print(
                f"  {geprueft} Nachricht(en) geprüft, {erstellt} Frage(n) live übernommen, "
                f"{wartezeit_erstellt} Wartezeit-Meldung(en) erfasst."
            )
            gesamt_erstellt += erstellt
            gesamt_wartezeit += wartezeit_erstellt
    else:
        # Normalmodus (täglicher Cron-Lauf): nur neue Nachrichten seit dem
        # jeweils letzten Lauf je Gruppe.
        for state_schluessel, gruppe, anzeige, pruefungszentrum in aufgeloeste_gruppen:
            letzte_id = state.get(state_schluessel)
            print(
                f"-- {anzeige} [{pruefungszentrum}] "
                + ("(erster Lauf, nur letzte Nachrichten)" if letzte_id is None else f"(neu seit ID {letzte_id})")
            )
            try:
                neue_letzte_id, geprueft, erstellt, wartezeit_erstellt = await verarbeite_gruppe(
                    telegram_client, anthropic_client, supabase, gruppe, anzeige, pruefungszentrum, letzte_id
                )
            except Exception as fehler:  # eine Gruppe darf den restlichen Lauf nicht abbrechen
                print(f"  ! Fehler bei {anzeige}, übersprungen: {fehler}")
                continue

            state[state_schluessel] = neue_letzte_id
            speichere_state(state)
            print(
                f"  {geprueft} Nachricht(en) geprüft, {erstellt} Frage(n) live übernommen, "
                f"{wartezeit_erstellt} Wartezeit-Meldung(en) erfasst."
            )
            gesamt_erstellt += erstellt
            gesamt_wartezeit += wartezeit_erstellt

    await telegram_client.disconnect()
    print(
        f"\nFertig. Insgesamt {gesamt_erstellt} neue Frage(n) — direkt live, sichtbar in "
        f"/admin/fragen (Quelle: Telegram). {gesamt_wartezeit} Wartezeit-Meldung(en) erfasst."
    )


def parse_argumente() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="KP-Trainer Telegram-Import")
    parser.add_argument(
        "--since",
        metavar="YYYY-MM-DD",
        help=(
            "Einmaliger Backfill: alle Nachrichten ab diesem Datum (statt nur neue "
            "seit dem letzten Lauf) durchsuchen. Zeigt vor dem eigentlichen Import "
            "eine Schätzung und fragt nochmal nach Bestätigung."
        ),
    )
    parser.add_argument(
        "--yes",
        "-y",
        action="store_true",
        help=(
            "Bestätigung bei --since überspringen und direkt fortfahren — z.B. für "
            "Hintergrund-Läufe, wo eine interaktive Eingabe nicht zuverlässig "
            "ankommt. Die Schätzung wird trotzdem ausgegeben (im Log sichtbar)."
        ),
    )
    return parser.parse_args()


if __name__ == "__main__":
    argumente = parse_argumente()
    seit_datum = None
    if argumente.since:
        try:
            seit_datum = datetime.strptime(argumente.since, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            sys.exit(f"Ungültiges Datum für --since: {argumente.since!r} (erwartet: YYYY-MM-DD)")

    try:
        asyncio.run(hauptlauf(seit_datum, automatisch_bestaetigt=argumente.yes))
    except KeyboardInterrupt:
        print("\nAbgebrochen.")
