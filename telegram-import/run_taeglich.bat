@echo off
echo ---------------------------------------------- >> "%~dp0lauf.log"
echo %date% %time% >> "%~dp0lauf.log"
"%~dp0.venv\Scripts\python.exe" "%~dp0import_telegram.py" >> "%~dp0lauf.log" 2>&1
