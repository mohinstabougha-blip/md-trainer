"""Listet alle Gruppen/Kanäle auf, in denen der eigene Telegram-Account
Mitglied ist, mit Name und Chat-ID — zum Befüllen von TELEGRAM_GROUPS in .env,
insbesondere für Gruppen ohne öffentlichen @Namen (nur über die Chat-ID
referenzierbar). Nutzt dieselbe .env/Session wie import_telegram.py.

Schreibt das Ergebnis selbst als UTF-8-Datei (gruppenliste.txt) statt über
stdout auszugeben: Namen können Arabisch, Emoji o.ä. enthalten, die auf der
Windows-Konsole (Standard-Codepage, meist nicht UTF-8) einen
UnicodeEncodeError auslösen — auch bei Umleitung über `> datei.txt` in
PowerShell, da die Konsole dabei genauso beteiligt ist."""

import asyncio
import sys
from pathlib import Path

from dotenv import dotenv_values
from telethon import TelegramClient, utils
from telethon.tl.types import Channel, Chat

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
SESSION_NAME = str(BASE_DIR / "telegram_import")
AUSGABE_PATH = BASE_DIR / "gruppenliste.txt"


def lade_konfiguration() -> dict[str, str]:
    if not ENV_PATH.exists():
        sys.exit("Keine .env gefunden. Erst ausführen: python setup.py")
    werte = dotenv_values(ENV_PATH)
    pflichtfelder = ["TELEGRAM_API_ID", "TELEGRAM_API_HASH", "TELEGRAM_PHONE"]
    fehlend = [f for f in pflichtfelder if not werte.get(f)]
    if fehlend:
        sys.exit(f"In .env fehlen: {', '.join(fehlend)}. Erneut ausführen: python setup.py")
    return werte  # type: ignore[return-value]


async def hauptlauf() -> None:
    konfig = lade_konfiguration()
    client = TelegramClient(
        SESSION_NAME, int(konfig["TELEGRAM_API_ID"]), konfig["TELEGRAM_API_HASH"]
    )
    await client.start(phone=konfig["TELEGRAM_PHONE"])
    print("Bei Telegram angemeldet. Lade Dialoge...")

    zeilen = [f"{'Name':<40} {'Typ':<12} {'Chat-ID':<18} Username", "-" * 90]

    gefunden = 0
    async for dialog in client.iter_dialogs():
        entity = dialog.entity
        if isinstance(entity, Channel):
            typ = "Supergruppe" if entity.megagroup else "Kanal"
        elif isinstance(entity, Chat):
            typ = "Gruppe"
        else:
            continue  # Einzelchats mit Personen/Bots interessieren hier nicht

        # get_peer_id liefert die "markierte" ID (z.B. -1001234567890 für
        # Supergruppen/Kanäle) — genau das Format, das import_telegram.py
        # (via TELEGRAM_GROUPS) und Telethon allgemein für get_entity() erwarten,
        # nicht die rohe entity.id.
        chat_id = utils.get_peer_id(entity)
        username = f"@{entity.username}" if getattr(entity, "username", None) else "—"
        zeilen.append(f"{dialog.name:<40.40} {typ:<12} {chat_id:<18} {username}")
        gefunden += 1

    await client.disconnect()

    # Bewusst per open(..., encoding="utf-8") statt print()/stdout-Umleitung:
    # so ist die Ausgabe unabhängig von der Konsolen-Codepage garantiert
    # korrekt, auch bei Namen mit Zeichen, die die Konsole nicht darstellen kann.
    with open(AUSGABE_PATH, "w", encoding="utf-8") as datei:
        datei.write("\n".join(zeilen) + "\n")

    print(f"{gefunden} Gruppe(n)/Kanal/Kanäle gefunden.")
    print(f"Ergebnis geschrieben nach: {AUSGABE_PATH}")
    print("In .env unter TELEGRAM_GROUPS eintragen: @username (falls vorhanden) oder Chat-ID, Komma-getrennt.")


if __name__ == "__main__":
    try:
        asyncio.run(hauptlauf())
    except KeyboardInterrupt:
        print("\nAbgebrochen.")
