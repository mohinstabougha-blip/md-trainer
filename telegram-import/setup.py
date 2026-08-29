"""Interaktive Ersteinrichtung: fragt alle benötigten Zugangsdaten ab und
speichert sie in .env (niemals im Code, niemals committen)."""

import os
import stat
from getpass import getpass
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
APP_ENV_PATH = BASE_DIR.parent / ".env.local"


def lese_env_datei(pfad: Path) -> dict[str, str]:
    werte: dict[str, str] = {}
    if not pfad.exists():
        return werte
    for zeile in pfad.read_text(encoding="utf-8").splitlines():
        zeile = zeile.strip()
        if not zeile or zeile.startswith("#") or "=" not in zeile:
            continue
        schluessel, wert = zeile.split("=", 1)
        werte[schluessel.strip()] = wert.strip().strip('"').strip("'")
    return werte


def frage(prompt: str, standard: str | None = None) -> str:
    zusatz = f" [{standard}]" if standard else ""
    antwort = input(f"{prompt}{zusatz}: ").strip()
    return antwort or (standard or "")


def frage_geheim(prompt: str, standard: str | None = None) -> str:
    hinweis = " (Enter = vorhandenen Wert übernehmen)" if standard else ""
    antwort = getpass(f"{prompt}{hinweis}: ").strip()
    return antwort or (standard or "")


def main() -> None:
    print("KP-Trainer Telegram-Import — Einrichtung")
    print("=" * 50)

    bestehend = lese_env_datei(ENV_PATH)
    if bestehend:
        print(f"Vorhandene .env gefunden ({ENV_PATH.name}) — Werte können übernommen werden.\n")

    app_env = lese_env_datei(APP_ENV_PATH)

    print("-- Telegram-API-Zugang (https://my.telegram.org → API development tools) --")
    api_id = frage("api_id (Zahl)", bestehend.get("TELEGRAM_API_ID"))
    api_hash = frage_geheim("api_hash", bestehend.get("TELEGRAM_API_HASH"))
    telefon = frage(
        "Telefonnummer für den Telegram-Login (z.B. +491701234567)",
        bestehend.get("TELEGRAM_PHONE"),
    )
    gruppen = frage(
        "Zu überwachende Gruppen, Komma-getrennt (z.B. @kp_gruppe1,@kp_gruppe2)",
        bestehend.get("TELEGRAM_GROUPS"),
    )

    print("\n-- Supabase & Anthropic (dieselben Werte wie in der KP-Trainer-App) --")
    if app_env.get("NEXT_PUBLIC_SUPABASE_URL") and not bestehend.get("SUPABASE_URL"):
        print(f"Gefunden in ../{APP_ENV_PATH.name} der App — wird als Vorschlag übernommen.")
    supabase_url = frage(
        "SUPABASE_URL", bestehend.get("SUPABASE_URL") or app_env.get("NEXT_PUBLIC_SUPABASE_URL")
    )
    supabase_key = frage_geheim(
        "SUPABASE_SERVICE_ROLE_KEY",
        bestehend.get("SUPABASE_SERVICE_ROLE_KEY") or app_env.get("SUPABASE_SERVICE_ROLE_KEY"),
    )
    anthropic_key = frage_geheim(
        "ANTHROPIC_API_KEY", bestehend.get("ANTHROPIC_API_KEY") or app_env.get("ANTHROPIC_API_KEY")
    )

    inhalt = (
        "# Automatisch von setup.py erzeugt — enthält Geheimnisse, niemals committen.\n"
        f"TELEGRAM_API_ID={api_id}\n"
        f"TELEGRAM_API_HASH={api_hash}\n"
        f"TELEGRAM_PHONE={telefon}\n"
        f"TELEGRAM_GROUPS={gruppen}\n"
        f"SUPABASE_URL={supabase_url}\n"
        f"SUPABASE_SERVICE_ROLE_KEY={supabase_key}\n"
        f"ANTHROPIC_API_KEY={anthropic_key}\n"
    )
    ENV_PATH.write_text(inhalt, encoding="utf-8")

    try:
        os.chmod(ENV_PATH, stat.S_IRUSR | stat.S_IWUSR)
    except OSError:
        pass  # z.B. unter Windows ohne POSIX-Rechte wirkungslos, aber unschädlich

    print(f"\nGespeichert unter {ENV_PATH}.")
    print("Diese Datei enthält Geheimnisse (API-Keys) — niemals committen oder teilen.")
    print("\nWeiter mit: python import_telegram.py")


if __name__ == "__main__":
    main()
