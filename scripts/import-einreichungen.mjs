// Importiert Fragen aus einer Excel-Datei (Schema wie KP_Trainer_Fragen_Datenbank.xlsx,
// inkl. Hilfe_Hinweis) als offene Einreichungen — sie sind für Nutzer NICHT sichtbar,
// bis ein Admin sie im Admin-Bereich (/admin/einreichungen) einzeln freigibt.
//
// Nutzung: node scripts/import-einreichungen.mjs <Dateiname.xlsx> [Sheetname]
// Ohne Sheetname wird das erste Sheet der Datei verwendet.

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

const dateiname = process.argv[2];
if (!dateiname) {
  console.error("Nutzung: node scripts/import-einreichungen.mjs <Dateiname.xlsx> [Sheetname]");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const workbook = xlsx.readFile(new URL(`../${dateiname}`, import.meta.url));
const sheetName = process.argv[3] || workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
if (!sheet) {
  console.error(`Fehler: Sheet "${sheetName}" nicht gefunden. Vorhanden: ${workbook.SheetNames.join(", ")}`);
  process.exit(1);
}

const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
console.log(`${rows.length} Zeilen in Sheet "${sheetName}" gefunden.`);

const REQUIRED = ["Modul", "Kurs", "Teil", "Frage", "Musterantwort (Stichpunkte)"];
const einreichungen = [];
const fehler = [];

rows.forEach((row, index) => {
  const rowNum = index + 2; // +1 header, +1 1-indexiert
  const missing = REQUIRED.filter((col) => row[col] === null || row[col] === "");
  if (missing.length > 0) {
    fehler.push(`Zeile ${rowNum}: fehlende Felder ${missing.join(", ")}`);
    return;
  }
  const teil = Number(row["Teil"]);
  if (![1, 2, 3].includes(teil)) {
    fehler.push(`Zeile ${rowNum}: ungültiger Teil-Wert "${row["Teil"]}"`);
    return;
  }
  einreichungen.push({
    typ: "einzelfrage",
    user_id: null,
    quelle_typ: "nutzer",
    status: "offen",
    modul: String(row["Modul"]).trim(),
    kurs: String(row["Kurs"]).trim(),
    teil,
    frage: String(row["Frage"]).trim(),
    antwort_vorschlag: String(row["Musterantwort (Stichpunkte)"]).trim(),
    hilfe_hinweis: row["Hilfe_Hinweis"] ? String(row["Hilfe_Hinweis"]).trim() : null,
  });
});

if (fehler.length > 0) {
  console.error(`${fehler.length} Zeile(n) übersprungen:`);
  fehler.forEach((e) => console.error(`  - ${e}`));
}

if (einreichungen.length === 0) {
  console.error("Keine gültigen Zeilen zum Importieren gefunden.");
  process.exit(1);
}

console.log(`Lege ${einreichungen.length} offene Einreichungen an (status='offen', quelle_typ='nutzer')...`);

const { error } = await supabase.from("einreichungen").insert(einreichungen);

if (error) {
  console.error("Import fehlgeschlagen:", error.message);
  process.exit(1);
}

console.log(`Fertig: ${einreichungen.length} Einreichungen angelegt. Zur Prüfung: /admin/einreichungen`);
