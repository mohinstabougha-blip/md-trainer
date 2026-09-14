import type { ModulFortschritt } from "@/lib/fortschritt";

const GROESSE = 56;
const RADIUS = 22;
const STRICHBREITE = 6;
const UMFANG = 2 * Math.PI * RADIUS;

export function FortschrittRing({ stat }: { stat: ModulFortschritt }) {
  const segmente: { anzahl: number; farbe: string }[] = [
    { anzahl: stat.richtig, farbe: "#16a34a" },
    { anzahl: stat.teilweise, farbe: "#d97706" },
    { anzahl: stat.falsch, farbe: "#dc2626" },
    { anzahl: stat.gesamt - stat.bearbeitet, farbe: "unbearbeitet" },
  ];

  let offset = 0;

  return (
    <svg width={GROESSE} height={GROESSE} viewBox={`0 0 ${GROESSE} ${GROESSE}`}>
      <g transform={`rotate(-90 ${GROESSE / 2} ${GROESSE / 2})`}>
        {stat.gesamt === 0 ? (
          <circle
            cx={GROESSE / 2}
            cy={GROESSE / 2}
            r={RADIUS}
            fill="none"
            className="stroke-zinc-300 dark:stroke-zinc-700"
            strokeWidth={STRICHBREITE}
          />
        ) : (
          segmente.map((seg, i) => {
            if (seg.anzahl === 0) return null;
            const laenge = (seg.anzahl / stat.gesamt) * UMFANG;
            const dasharray = `${laenge} ${UMFANG - laenge}`;
            const kreis = (
              <circle
                key={i}
                cx={GROESSE / 2}
                cy={GROESSE / 2}
                r={RADIUS}
                fill="none"
                stroke={seg.farbe === "unbearbeitet" ? undefined : seg.farbe}
                className={seg.farbe === "unbearbeitet" ? "stroke-zinc-300 dark:stroke-zinc-700" : undefined}
                strokeWidth={STRICHBREITE}
                strokeDasharray={dasharray}
                strokeDashoffset={-offset}
              />
            );
            offset += laenge;
            return kreis;
          })
        )}
      </g>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-zinc-800 text-[11px] font-medium dark:fill-zinc-100"
      >
        {stat.bearbeitet}/{stat.gesamt}
      </text>
    </svg>
  );
}
