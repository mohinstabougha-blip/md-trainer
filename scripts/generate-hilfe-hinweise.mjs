// Einmaliges Backfill-Skript: generiert für alle Fragen mit leerem
// `hilfe_hinweis` einen kurzen Strukturhinweis (max. 15 Wörter) über Claude
// Haiku und schreibt ihn in die Supabase-Tabelle `questions`.
//
// Nutzung: node scripts/generate-hilfe-hinweise.mjs

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

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
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
  console.error(
    "Fehler: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ANTHROPIC_API_KEY fehlen in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Gleiches Modell wie die Einzelbewertung (GRADING_MODEL in src/lib/anthropic.ts) —
// für eine 15-Wörter-Strukturhilfe reicht das kleine, schnelle Modell locker.
const MODEL = "claude-haiku-4-5-20251001";

function woerterZaehlen(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function aufWoerterKuerzen(text, maxWoerter) {
  const woerter = text.trim().split(/\s+/).filter(Boolean);
  if (woerter.length <= maxWoerter) return text.trim();
  return woerter.slice(0, maxWoerter).join(" ") + "…";
}

async function generiereHinweis(frage, musterantwort) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 100,
    system:
      "Du bist ein erfahrener Prüfer für die medizinische Kenntnisprüfung (KP) in Deutschland.",
    messages: [
      {
        role: "user",
        content: `Frage: ${frage}\n\nMusterantwort (nur zur Orientierung, NICHT verraten): ${musterantwort}\n\nFormuliere einen kurzen Strukturhinweis (max. 15 Wörter), der sagt, WELCHE Kategorien/Aspekte die Antwort abdecken sollte — OHNE die eigentlichen Inhalte der Musterantwort zu verraten. Beispiel: "Nenne: Schnittführung, zu unterbindendes Gefäß, OP-Schritte in Reihenfolge."`,
      },
    ],
    tools: [
      {
        name: "hilfe_hinweis_abgeben",
        description: "Gib den kurzen Strukturhinweis ab.",
        input_schema: {
          type: "object",
          properties: {
            hinweis: {
              type: "string",
              description: "Max. 15 Wörter, nennt nur Kategorien/Aspekte, keine Lösung.",
            },
          },
          required: ["hinweis"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "hilfe_hinweis_abgeben" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Keine strukturierte Antwort erhalten.");
  }
  const hinweis = toolUse.input.hinweis?.trim();
  if (!hinweis) throw new Error("Leerer Hinweis erhalten.");
  return aufWoerterKuerzen(hinweis, 15);
}

const { data: fragen, error: fetchError } = await supabase
  .from("questions")
  .select("id, frage, musterantwort")
  .or("hilfe_hinweis.is.null,hilfe_hinweis.eq.")
  .order("id", { ascending: true });

if (fetchError) {
  console.error("Fehler beim Laden der Fragen:", fetchError.message);
  process.exit(1);
}

if (fragen.length === 0) {
  console.log("Keine Fragen ohne hilfe_hinweis gefunden — nichts zu tun.");
  process.exit(0);
}

console.log(`${fragen.length} Frage(n) ohne hilfe_hinweis gefunden. Generiere Hinweise...`);

let erfolge = 0;
const fehler = [];

for (const frage of fragen) {
  try {
    const hinweis = await generiereHinweis(frage.frage, frage.musterantwort);
    const { error: updateError } = await supabase
      .from("questions")
      .update({ hilfe_hinweis: hinweis })
      .eq("id", frage.id);
    if (updateError) throw updateError;
    console.log(`  #${frage.id} (${woerterZaehlen(hinweis)} Wörter): ${hinweis}`);
    erfolge++;
  } catch (err) {
    console.error(`  #${frage.id} fehlgeschlagen: ${err.message}`);
    fehler.push(frage.id);
  }
}

console.log(`\nFertig: ${erfolge} von ${fragen.length} Hinweisen gespeichert.`);
if (fehler.length > 0) {
  console.error(`Fehlgeschlagen: ${fehler.join(", ")}`);
  process.exit(1);
}
