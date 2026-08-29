// Importiert KP_Trainer_Fragen_Datenbank.xlsx (Sheet "Fragen") in die
// Supabase-Tabelle `questions`. Idempotent: upsert über die Spalte `id`,
// die aus der Excel-Spalte "ID" übernommen wird.
//
// Nutzung: node scripts/import-questions.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import xlsx from "xlsx";

function loadEnvLocal() {
  const content = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i);
    const value = trimmed.slice(i + 1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Fehler: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const XLSX_PATH = new URL("../KP_Trainer_Fragen_Datenbank.xlsx", import.meta.url);
const workbook = xlsx.readFile(XLSX_PATH);
const sheet = workbook.Sheets["Fragen"];
if (!sheet) {
  console.error('Fehler: Sheet "Fragen" nicht in der Excel-Datei gefunden.');
  process.exit(1);
}

const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
console.log(`${rows.length} Zeilen in "Fragen" gefunden.`);

const REQUIRED = ["ID", "Modul", "Kurs", "Teil", "Frage", "Musterantwort (Stichpunkte)"];
const questions = [];
const errors = [];

rows.forEach((row, index) => {
  const rowNum = index + 2; // +1 header, +1 1-indexiert
  const missing = REQUIRED.filter((col) => row[col] === null || row[col] === "");
  if (missing.length > 0) {
    errors.push(`Zeile ${rowNum}: fehlende Felder ${missing.join(", ")}`);
    return;
  }
  const teil = Number(row["Teil"]);
  if (![1, 2, 3].includes(teil)) {
    errors.push(`Zeile ${rowNum}: ungültiger Teil-Wert "${row["Teil"]}"`);
    return;
  }
  questions.push({
    id: Number(row["ID"]),
    modul: String(row["Modul"]).trim(),
    kurs: String(row["Kurs"]).trim(),
    teil,
    frage: String(row["Frage"]).trim(),
    bild_frage_url: row["Bild_Frage (URL/Dateiname)"] || null,
    musterantwort: String(row["Musterantwort (Stichpunkte)"]).trim(),
    bild_antwort_url: row["Bild_Antwort (URL/Dateiname)"] || null,
    quelle: row["Quelle (Standort)"] || null,
  });
});

if (errors.length > 0) {
  console.error(`${errors.length} Zeile(n) übersprungen:`);
  errors.forEach((e) => console.error(`  - ${e}`));
}

if (questions.length === 0) {
  console.error("Keine gültigen Fragen zum Importieren gefunden.");
  process.exit(1);
}

console.log(`Importiere ${questions.length} Fragen nach Supabase (upsert über id)...`);

const { error } = await supabase.from("questions").upsert(questions, { onConflict: "id" });

if (error) {
  console.error("Import fehlgeschlagen:", error.message);
  process.exit(1);
}

console.log(`Fertig: ${questions.length} Fragen importiert.`);
