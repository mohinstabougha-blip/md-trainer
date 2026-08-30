#!/bin/bash
# macOS-Äquivalent zu run_taeglich.bat (Windows), für launchd.
# Läuft inhaltlich nur einmal pro Kalendertag, auch wenn launchd öfter auslöst
# (fester 6:00-Uhr-Slot + Nachhol-Trigger bei jedem Login/Start).
cd "$(dirname "$0")" || exit 1

HEUTE=$(date +%Y-%m-%d)
MARKER=".letzter_lauf"

if [ -f "$MARKER" ] && [ "$(cat "$MARKER")" = "$HEUTE" ]; then
  echo "$(date): bereits heute gelaufen, überspringe." >> lauf.log
  exit 0
fi

echo "----------------------------------------------" >> lauf.log
echo "$(date)" >> lauf.log
.venv/bin/python3 import_telegram.py >> lauf.log 2>&1
echo "$HEUTE" > "$MARKER"
