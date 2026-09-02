// Heuristische Duplikat-Erkennung für die Einreichungs-Warteschlange:
// vergleicht den Fragetext einer Einreichung mit allen bestehenden Fragen und
// markiert wahrscheinliche Dubletten ("suspekt Duplikat"). Rein textbasiert,
// keine KI – dient nur als Hinweis für die manuelle Freigabe.

export type FrageKurz = { id: number; modul: string; kurs: string; frage: string };

export type DuplikatTreffer = {
  questionId: number;
  modul: string;
  kurs: string;
  frage: string;
  score: number; // 0..1
};

const STOPP = new Set([
  "eine", "einen", "einem", "einer", "eines", "welche", "welcher", "welches",
  "nennen", "nach", "sind", "wird", "werden", "haben", "bitte", "welchen",
  "stellt", "stellen", "sich", "dann", "beim", "diese", "dieser", "dieses",
  "kann", "können", "warum", "wieso", "wozu", "womit", "worauf", "sowie",
  "oder", "und", "der", "die", "das", "den", "dem", "des", "mit", "für",
  "von", "vom", "auf", "aus", "ist", "war", "sie", "ein", "auch", "als",
  "zum", "zur", "bei", "über", "unter", "beschreiben", "erklären", "gehen",
  "vorgehen", "machen", "geben", "achten", "grenzen", "unterscheiden",
  "patient", "patientin", "jahre", "jährige", "jähriger", "jährigen", "alte",
  // generische Frage-Verben/Rahmen – als Unterscheidungsmerkmal wertlos
  "erkennen", "erkannt", "behandeln", "behandelt", "behandlung", "therapie",
  "diagnostizieren", "diagnostik", "diagnose", "klinik", "klinische",
  "klinischen", "klinisches", "typisch", "typische", "typischer", "typisches",
  "erläutern", "gehören", "kennen", "setzen", "besprechen", "denken",
]);

function tokens(text: string): Set<string> {
  const roh = (text || "")
    .toLowerCase()
    .replace(/[^a-zäöüß0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length >= 4 && !STOPP.has(w));
  return new Set(roh);
}

/** Sørensen-Dice-Koeffizient + Größe der Schnittmenge. */
function vergleich(a: Set<string>, b: Set<string>): { dice: number; schnitt: number } {
  if (a.size === 0 || b.size === 0) return { dice: 0, schnitt: 0 };
  let schnitt = 0;
  for (const t of a) if (b.has(t)) schnitt++;
  return { dice: (2 * schnitt) / (a.size + b.size), schnitt };
}

const SCHWELLE = 0.42;
const MIN_SCHNITT = 3; // mind. 3 gemeinsame Fachbegriffe – außer bei sehr hoher Ähnlichkeit

/** Findet zu jeder Einreichung (id -> Fragetext) den ähnlichsten bestehenden
 *  Frage-Eintrag; nur Treffer über der Schwelle werden zurückgegeben. */
export function findeDuplikate(
  einreichungen: { id: number; frage: string | null; modul: string | null; kurs: string | null }[],
  bestehendeFragen: FrageKurz[]
): Record<number, DuplikatTreffer> {
  const bestehendMitTokens = bestehendeFragen.map((f) => ({ f, tok: tokens(f.frage) }));
  const ergebnis: Record<number, DuplikatTreffer> = {};

  for (const e of einreichungen) {
    if (!e.frage || e.frage.trim().length < 15) continue;
    const eTok = tokens(e.frage);
    let best: DuplikatTreffer | null = null;

    for (const { f, tok } of bestehendMitTokens) {
      const { dice: d, schnitt } = vergleich(eTok, tok);
      if (d === 0) continue;
      if (schnitt < MIN_SCHNITT && d < 0.7) continue;
      let s = d;
      // gleiches Modul/gleicher Kurs erhöht die Trefferwahrscheinlichkeit
      if (e.modul && f.modul && e.modul === f.modul) s *= 1.15;
      if (e.kurs && f.kurs && e.kurs.toLowerCase() === f.kurs.toLowerCase()) s *= 1.25;
      s = Math.min(s, 1);
      if (s >= SCHWELLE && (!best || s > best.score)) {
        best = { questionId: f.id, modul: f.modul, kurs: f.kurs, frage: f.frage, score: s };
      }
    }

    if (best) ergebnis[e.id] = best;
  }

  return ergebnis;
}
