import type { WartezeitBeispiel, WartezeitVerlauf } from "@/lib/wartezeit";

const ROT = "#dc2626";
const GRUEN = "#16a34a";
const DUNKEL = "#3f3f46";
const GRAU = "#71717a";
const HELLGRAU = "#a1a1aa";
const TAGE_PRO_MONAT = 30.44;

// Zeichenfläche (viewBox-Einheiten ≈ px, da das SVG ~in Breite des Dialogs rendert)
const W = 340;
const GUTTER = 82; // linke Spalte: Zeilentitel + Antragsdatum
const RECHTS = 12;
const PLOT_L = GUTTER;
const PLOT_R = W - RECHTS;
const PLOT_B = PLOT_R - PLOT_L;
const TOP = 10;
const ROW_H = 46;
const GRID_LABEL_H = 13;

// Schriftgrößen (als echte SVG-Attribute, nicht via Tailwind – Utility-Klassen
// greifen auf <text> im Build nicht zuverlässig).
const FS_TITEL = 9;
const FS_DATUM = 8;
const FS_RASTER = 7;

function parseIso(s: string): Date {
  const [j, m, t] = s.split("-").map(Number);
  return new Date(j, m - 1, t);
}

function datumPlusTage(anker: Date, tage: number): Date {
  return new Date(anker.getFullYear(), anker.getMonth(), anker.getDate() + Math.round(tage));
}

function tageDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function formatLang(d: Date): string {
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatKurz(d: Date): string {
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function meldungenText(anzahl: number): string {
  if (anzahl === 0) return "Noch keine Meldungen in den letzten 3 Monaten";
  return `Beispiele & Prognose – Ø aus ${anzahl} Meldung${anzahl === 1 ? "" : "en"} der letzten 3 Monate`;
}

type Zeile = {
  titel: string;
  istPrognose: boolean;
  antrag: Date;
  rechnungTage: number | null;
  pruefungTage: number | null;
  rechnungDatum: Date | null;
  pruefungDatum: Date | null;
};

function beispielZuZeile(b: WartezeitBeispiel, i: number): Zeile {
  const antrag = parseIso(b.antrag);
  const rechnungDatum = b.rechnung ? parseIso(b.rechnung) : null;
  const pruefungDatum = b.pruefung ? parseIso(b.pruefung) : null;
  return {
    titel: `Beispiel ${i + 1}`,
    istPrognose: false,
    antrag,
    rechnungDatum,
    pruefungDatum,
    rechnungTage: rechnungDatum ? Math.max(tageDiff(antrag, rechnungDatum), 0) : null,
    pruefungTage: pruefungDatum ? Math.max(tageDiff(antrag, pruefungDatum), 0) : null,
  };
}

/**
 * Gestapelte horizontale Zeitleisten: bis zu drei echte Beispiel-Meldungen der
 * letzten 3 Monate, darunter die hochgerechnete Prognose ab dem eigenen
 * Antragsdatum. Alle Zeilen starten links beim Antrag; x = vergangene Zeit.
 * Grün = Antrag→Rechnung, Rot = Rechnung→Prüfung.
 */
export function WartezeitGraph({
  verlauf,
  antragDatum,
}: {
  verlauf: WartezeitVerlauf;
  antragDatum: string | null;
}) {
  const monat = [...verlauf.monate]
    .reverse()
    .find((m) => m.antragBisRechnungTage !== null || m.antragBisPruefungTage !== null);

  const zeilen: Zeile[] = verlauf.beispiele.map(beispielZuZeile);

  if (monat) {
    const heute = new Date();
    const antrag = antragDatum
      ? parseIso(antragDatum)
      : new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
    const rechnungTage = monat.antragBisRechnungTage;
    const pruefungTage = monat.antragBisPruefungTage;
    zeilen.push({
      titel: antragDatum ? "Prognose" : "Prognose ab heute",
      istPrognose: true,
      antrag,
      rechnungTage,
      pruefungTage,
      rechnungDatum: rechnungTage !== null ? datumPlusTage(antrag, rechnungTage) : null,
      pruefungDatum: pruefungTage !== null ? datumPlusTage(antrag, pruefungTage) : null,
    });
  }

  if (zeilen.length === 0) {
    return (
      <div className="mt-3 rounded-xl bg-zinc-50 px-3 py-6 text-center text-xs text-zinc-500">
        <p>Noch keine Daten für den Wartezeit-Verlauf.</p>
        <p className="mt-1">{meldungenText(verlauf.meldungenImZeitraum)}</p>
      </div>
    );
  }

  const maxTage = Math.max(30, ...zeilen.map((z) => z.pruefungTage ?? z.rechnungTage ?? 0));
  const gridN = Math.max(1, Math.ceil(maxTage / TAGE_PRO_MONAT));
  const skalaTage = gridN * TAGE_PRO_MONAT;
  const xFuer = (tage: number) => PLOT_L + (tage / skalaTage) * PLOT_B;
  const rasterSchritt = Math.max(1, Math.ceil(gridN / 6)); // höchstens ~6 Beschriftungen

  const H = TOP + zeilen.length * ROW_H + GRID_LABEL_H;
  const gridUnten = H - GRID_LABEL_H + 2;

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label="Wartezeit: Beispiele und Prognose"
      >
        <defs>
          <pattern id="wz-h-rot" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill={ROT} fillOpacity="0.1" />
            <line x1="0" y1="0" x2="0" y2="6" stroke={ROT} strokeWidth="2" />
          </pattern>
          <pattern id="wz-h-gruen" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill={GRUEN} fillOpacity="0.1" />
            <line x1="0" y1="0" x2="0" y2="6" stroke={GRUEN} strokeWidth="2" />
          </pattern>
        </defs>

        {/* Monats-Raster */}
        {Array.from({ length: gridN }, (_, k) => {
          const x = xFuer((k + 1) * TAGE_PRO_MONAT);
          const beschriften = (k + 1) % rasterSchritt === 0;
          return (
            <g key={`grid-${k}`}>
              <line x1={x} y1={TOP} x2={x} y2={gridUnten - 2} stroke="#e4e4e7" strokeWidth="1" />
              {beschriften && (
                <text x={x} y={H - 3} textAnchor="middle" fontSize={FS_RASTER} fill={HELLGRAU}>
                  {k + 1}
                </text>
              )}
            </g>
          );
        })}
        <line x1={PLOT_L} y1={TOP} x2={PLOT_L} y2={gridUnten - 2} stroke="#d4d4d8" strokeWidth="1" />
        <text x={4} y={H - 3} fontSize={FS_RASTER} fill={HELLGRAU}>
          Monate ab Antrag
        </text>

        {zeilen.map((z, r) => {
          const basisY = TOP + r * ROW_H;
          const yTitel = basisY + 10;
          const yBar = basisY + 24;
          const barH = 12;
          const yLabel = basisY + 45;
          const xA = xFuer(0);
          const xR = z.rechnungTage !== null ? xFuer(z.rechnungTage) : null;
          const xP = z.pruefungTage !== null ? xFuer(z.pruefungTage) : null;
          const zeigeRot = xP !== null && z.pruefungTage !== null && (z.rechnungTage ?? 0) < z.pruefungTage;
          const gruenFill = z.istPrognose ? "url(#wz-h-gruen)" : GRUEN;
          const rotFill = z.istPrognose ? "url(#wz-h-rot)" : ROT;
          const dash = z.istPrognose ? "3 2" : undefined;
          const nah = xR !== null && xP !== null && xP - xR < 52;
          const rechnungAnker: "start" | "middle" = xR !== null && xR - PLOT_L < 16 ? "start" : "middle";

          return (
            <g key={z.titel}>
              {r > 0 && z.istPrognose && !zeilen[r - 1].istPrognose && (
                <line
                  x1={4}
                  y1={basisY + 1}
                  x2={PLOT_R}
                  y2={basisY + 1}
                  stroke="#d4d4d8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}

              {/* linke Spalte */}
              <text
                x={4}
                y={yTitel}
                fontSize={FS_TITEL}
                fontWeight={z.istPrognose ? 700 : 600}
                fill={z.istPrognose ? DUNKEL : GRAU}
              >
                {z.titel}
              </text>
              <text x={4} y={yTitel + 11} fontSize={FS_DATUM} fill={GRAU}>
                {formatLang(z.antrag)}
              </text>

              {/* Balken */}
              {xR !== null && (
                <rect
                  x={xA}
                  y={yBar}
                  width={Math.max(xR - xA, 0.5)}
                  height={barH}
                  fill={gruenFill}
                  fillOpacity={z.istPrognose ? undefined : 0.16}
                  stroke={GRUEN}
                  strokeWidth={z.istPrognose ? 1.5 : 1.2}
                  strokeDasharray={dash}
                />
              )}
              {zeigeRot && xP !== null && xR !== null && (
                <rect
                  x={xR}
                  y={yBar}
                  width={xP - xR}
                  height={barH}
                  fill={rotFill}
                  fillOpacity={z.istPrognose ? undefined : 0.16}
                  stroke={ROT}
                  strokeWidth={z.istPrognose ? 1.5 : 1.2}
                  strokeDasharray={dash}
                />
              )}

              {/* Punkte + Datums-Labels */}
              <circle cx={xA} cy={yBar + barH / 2} r="2" fill={DUNKEL} />
              {xR !== null && z.rechnungDatum && (
                <>
                  <circle cx={xR} cy={yBar + barH / 2} r="2.2" fill={GRUEN} />
                  <text
                    x={xR}
                    y={yLabel}
                    textAnchor={rechnungAnker}
                    fontSize={FS_DATUM}
                    fontWeight={500}
                    fill={GRUEN}
                  >
                    {formatKurz(z.rechnungDatum)}
                  </text>
                </>
              )}
              {xP !== null && z.pruefungDatum && (
                <>
                  <circle cx={xP} cy={yBar + barH / 2} r="2.2" fill={ROT} />
                  <text
                    x={xP}
                    y={nah ? yLabel + 8 : yLabel}
                    textAnchor="end"
                    fontSize={FS_DATUM}
                    fontWeight={500}
                    fill={ROT}
                  >
                    {formatKurz(z.pruefungDatum)}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: DUNKEL }} />
          Antragsdatum
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: GRUEN }} />
          Rechnungsdatum
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: ROT }} />
          Prüfungstermin
        </span>
      </div>
      <p className="mt-1 text-center text-xs text-zinc-500">
        {meldungenText(verlauf.meldungenImZeitraum)}
      </p>
    </>
  );
}
