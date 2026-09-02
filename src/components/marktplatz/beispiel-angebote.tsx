import { MARKTPLATZ_BEISPIELE } from "@/lib/marktplatz-beispiele";
import { KATEGORIE_LABEL } from "@/lib/marktplatz-types";

// Beispiel-Sektion: nur sichtbar, solange es wenige echte Angebote gibt.
// Nicht klickbar, kein Kontakt – dient nur der Veranschaulichung.
export function BeispielAngebote({ anzeigen }: { anzeigen: boolean }) {
  if (!anzeigen) return null;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-zinc-700">
          Beispiele – so kann ein Angebot aussehen
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Das sind Vorlagen, keine echten Inserate. Erstelle ein eigenes Angebot, um
          Kontakt aufzunehmen.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {MARKTPLATZ_BEISPIELE.map((b, i) => (
          <div key={i} className="kp-card flex flex-col gap-1 opacity-90">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-zinc-700">{b.titel}</span>
              <span className="shrink-0 rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                Beispiel
              </span>
            </div>
            <p className="line-clamp-3 text-sm text-zinc-600">{b.beschreibung}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
              <span>{KATEGORIE_LABEL[b.kategorie]}</span>
              {b.preis && <span>{b.preis}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
