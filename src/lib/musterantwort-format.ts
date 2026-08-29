// Bekannte Abkürzungen, die NICHT als Satzende gelten sollen (Punkt gehört
// zur Abkürzung, nicht zum Satzschluss).
const ABKUERZUNGEN = new Set([
  "z.b",
  "u.a",
  "d.h",
  "bzw",
  "ca",
  "etc",
  "usw",
  "nr",
  "abb",
  "tab",
  "v.a",
  "z.n",
  "i.d.r",
  "inkl",
  "exkl",
  "min",
  "max",
  "evtl",
  "ggf",
  "s.o",
  "s.u",
  "vgl",
  "std",
  "mio",
  "mrd",
]);

/**
 * Formatiert eine Musterantwort NUR für die Anzeige: jeder Satz (Punkt +
 * Leerzeichen, gefolgt von einem Großbuchstaben) beginnt eine neue Zeile.
 * Der in der DB gespeicherte Text bleibt unverändert — diese Funktion wird
 * nirgends beim Speichern aufgerufen, nur beim Rendern.
 *
 * Bekannte Abkürzungen (z.B., bzw., V.a., ...) werden nicht als Satzende
 * gewertet, damit sie nicht fälschlich umgebrochen werden.
 */
// Rein numerische/Ordnungszahl-Angaben vor dem Punkt (z.B. "2.-3." bei
// Interkostalraum-Angaben wie "2.-3. ICR") sind kein Satzende.
const NUR_ZAHL = /^[\d.\-–]+$/;

export function musterantwortFuerAnzeige(text: string): string {
  return musterantwortSaetze(text).join("\n");
}

/**
 * Wie musterantwortFuerAnzeige, gibt die einzelnen Sätze aber als Array
 * zurück (für eine Listen-Darstellung statt eines einzelnen Textblocks).
 */
export function musterantwortSaetze(text: string): string[] {
  const mitZeilenumbruechen = text.replace(
    /(\S*)\.\s+(?=[A-ZÄÖÜ])/g,
    (treffer, wortDavor: string) => {
      if (NUR_ZAHL.test(wortDavor)) return treffer;
      const bereinigt = wortDavor.toLowerCase().replace(/[(),;:„"]/g, "");
      if (ABKUERZUNGEN.has(bereinigt)) return treffer;
      return treffer.trimEnd() + "\n";
    }
  );
  return mitZeilenumbruechen
    .split("\n")
    .map((satz) => satz.trim())
    .filter((satz) => satz !== "");
}
