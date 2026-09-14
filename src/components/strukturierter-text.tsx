import { musterantwortSaetze } from "@/lib/musterantwort-format";

// Zeigt Frage- bzw. Musterantwort-Text strukturiert an: jeder Satz als eigener
// Punkt mit dezentem Farbstreifen; führende GROSSBUCHSTABEN-Label wie
// "ANAMNESE:", "KU:", "DD:", "THERAPIE:" werden als farbige Pille gesetzt.
// Rein visuell – der in der DB gespeicherte Text bleibt unverändert.

type Farbe = { pill: string; border: string; dot: string };

const NEUTRAL: Farbe = {
  pill: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  border: "border-zinc-200 dark:border-zinc-700",
  dot: "bg-zinc-300 dark:bg-zinc-600",
};

// Feste Klassenstrings, damit Tailwind sie beim Scannen findet.
const PALETTE: Farbe[] = [
  {
    pill: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-800",
    dot: "bg-violet-300 dark:bg-violet-500",
  },
  {
    pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-300 dark:bg-blue-500",
  },
  {
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-400 dark:bg-emerald-500",
  },
  {
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-400 dark:bg-amber-500",
  },
  {
    pill: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    dot: "bg-rose-300 dark:bg-rose-500",
  },
  {
    pill: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
    dot: "bg-sky-300 dark:bg-sky-500",
  },
  {
    pill: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
    dot: "bg-teal-300 dark:bg-teal-500",
  },
  {
    pill: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
    dot: "bg-indigo-300 dark:bg-indigo-500",
  },
];

// Bekannte Abschnittslabels -> feste Farbe.
const LABEL_INDEX: Record<string, number> = {
  ANAMNESE: 0,
  KU: 1,
  UNTERSUCHUNG: 1,
  "KÖRPERLICHE UNTERSUCHUNG": 1,
  "KÖRPERLICHER BEFUND": 1,
  INSPEKTION: 1,
  VITALPARAMETER: 2,
  VITALZEICHEN: 2,
  LABOR: 3,
  LABORCHEMIE: 3,
  BEFUND: 3,
  BEFUNDE: 3,
  DD: 4,
  DIFFERENZIALDIAGNOSE: 4,
  DIFFERENZIALDIAGNOSEN: 4,
  DIFFERENTIALDIAGNOSE: 4,
  BILDGEBUNG: 5,
  DIAGNOSTIK: 5,
  SONOGRAFIE: 5,
  SONOGRAPHIE: 5,
  "RÖNTGEN": 5,
  CT: 5,
  MRT: 5,
  EKG: 5,
  THERAPIE: 6,
  BEHANDLUNG: 6,
  PROCEDERE: 6,
  PROZEDERE: 6,
  MANAGEMENT: 6,
  VORGEHEN: 6,
  KOMPLIKATIONEN: 7,
  PROGNOSE: 7,
  NACHSORGE: 7,
};

const LABEL_RE = /^([A-ZÄÖÜ][A-ZÄÖÜ0-9 .\/()–-]{0,30}?):\s+(.+)$/;

export type StrukturItem = { label: string | null; text: string; farbe: Farbe };

export function parseStrukturiert(text: string): StrukturItem[] {
  const zugewiesen = new Map<string, number>();
  let naechster = 0;

  return musterantwortSaetze(text).map((roh) => {
    const s = roh.replace(/^[-–•*]\s+/, "").trim();
    const m = s.match(LABEL_RE);
    const label = m ? m[1].trim().replace(/\s+/g, " ") : "";
    const istLabel =
      !!m && label.length <= 32 && label.replace(/[^A-ZÄÖÜ]/g, "").length >= 2;

    if (!istLabel) return { label: null, text: s, farbe: NEUTRAL };

    let idx = LABEL_INDEX[label];
    if (idx === undefined) {
      if (!zugewiesen.has(label)) {
        zugewiesen.set(label, naechster % PALETTE.length);
        naechster++;
      }
      idx = zugewiesen.get(label)!;
    }
    return { label, text: m![2].trim(), farbe: PALETTE[idx] };
  });
}

export function StrukturierterText({ text, className }: { text: string; className?: string }) {
  const items = parseStrukturiert(text);
  if (items.length === 0) return null;

  // Ein einzelner Satz ohne Label -> schlichter Absatz.
  if (items.length === 1 && !items[0].label) {
    return <p className={`leading-relaxed ${className ?? ""}`}>{items[0].text}</p>;
  }

  return (
    <ul className={`flex flex-col gap-3 ${className ?? ""}`}>
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            aria-hidden="true"
            className={`mt-[0.55em] h-1.5 w-1.5 flex-shrink-0 rounded-full ${it.farbe.dot}`}
          />
          <div className={`border-l-2 pl-3 ${it.farbe.border}`}>
            {it.label && (
              <span
                className={`mr-1.5 inline-block rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${it.farbe.pill}`}
              >
                {it.label}
              </span>
            )}
            <span className="leading-relaxed">{it.text}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
