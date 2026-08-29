"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FrageMeta } from "@/lib/questions";
import type { Bewertung } from "@/lib/bewertung-types";

type Modus = "zufaellig" | "modul" | "kurs";
type Teil = "1" | "2" | "3" | "voll";
type Sortierung = "zufaellig" | "neueste" | "aelteste" | "haeufigste";
type FortschrittFilter = "alle" | "nie_gesehen" | "schon_gesehen" | "falsch_beantwortet";
type PickerName = "faecher" | "teil" | "reihenfolge" | "fortschritt" | null;

const TEIL_OPTIONEN: { value: Teil; label: string }[] = [
  { value: "voll", label: "Alle" },
  { value: "1", label: "Teil 1" },
  { value: "2", label: "Teil 2" },
  { value: "3", label: "Teil 3" },
];

const SORTIER_OPTIONEN: { value: Sortierung; label: string }[] = [
  { value: "haeufigste", label: "Häufigste zuerst" },
  { value: "neueste", label: "Neueste zuerst" },
  { value: "aelteste", label: "Älteste zuerst" },
  { value: "zufaellig", label: "Zufällig" },
];

const FORTSCHRITT_OPTIONEN: { value: FortschrittFilter; label: string }[] = [
  { value: "falsch_beantwortet", label: "Falsch beantwortet" },
  { value: "nie_gesehen", label: "Noch nie gesehen" },
  { value: "schon_gesehen", label: "Schon gesehen" },
  { value: "alle", label: "Alle" },
];

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5 9-9" />
    </svg>
  );
}

function AuswahlZeile({
  label,
  wert,
  onClick,
}: {
  label: string;
  wert: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="kp-card flex w-full items-center justify-between text-sm"
    >
      <span className="text-zinc-500">{label}</span>
      <span className="flex items-center gap-1 font-medium text-zinc-900">
        {wert}
        <ChevronRight />
      </span>
    </button>
  );
}

function OptionZeile({
  label,
  aktiv,
  onClick,
}: {
  label: string;
  aktiv: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
        aktiv ? "bg-accent/10 font-medium text-accent" : "hover:bg-zinc-50"
      }`}
    >
      {label}
      {aktiv && <CheckIcon />}
    </button>
  );
}

function PickerOverlay({
  titel,
  onClose,
  children,
}: {
  titel: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{titel}</h2>
          <button type="button" onClick={onClose} className="text-sm text-accent">
            Fertig
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StartScreen({
  fragenMeta,
  meineBewertungen,
}: {
  fragenMeta: FrageMeta[];
  meineBewertungen: Record<number, Bewertung>;
}) {
  const router = useRouter();
  const [modus, setModus] = useState<Modus>("zufaellig");
  const [ausgewaehlteModule, setAusgewaehlteModule] = useState<string[]>([]);
  const [ausgewaehlterKurs, setAusgewaehlterKurs] = useState<string>("");
  const [teil, setTeil] = useState<Teil>("voll");
  const [sortierung, setSortierung] = useState<Sortierung>("haeufigste");
  const [fortschrittFilter, setFortschrittFilter] = useState<FortschrittFilter>("falsch_beantwortet");
  const [offenerPicker, setOffenerPicker] = useState<PickerName>(null);

  const alleModule = useMemo(
    () => [...new Set(fragenMeta.map((f) => f.modul))],
    [fragenMeta]
  );

  const moduleNachName = useMemo(() => {
    const map = new Map<string, FrageMeta[]>();
    for (const f of fragenMeta) {
      const liste = map.get(f.modul) ?? [];
      liste.push(f);
      map.set(f.modul, liste);
    }
    return map;
  }, [fragenMeta]);

  function toggleModul(modul: string) {
    setAusgewaehlteModule((prev) =>
      prev.includes(modul) ? prev.filter((m) => m !== modul) : [...prev, modul]
    );
  }

  const kannStarten =
    modus === "zufaellig" ||
    (modus === "modul" && ausgewaehlteModule.length > 0) ||
    (modus === "kurs" && ausgewaehlterKurs !== "");

  const verfuegbareAnzahl = useMemo(() => {
    let pool = fragenMeta;
    if (modus === "modul") {
      pool = pool.filter((f) => ausgewaehlteModule.includes(f.modul));
    } else if (modus === "kurs" && ausgewaehlterKurs) {
      const [modul, kurs] = ausgewaehlterKurs.split("|||");
      pool = pool.filter((f) => f.modul === modul && f.kurs === kurs);
    }
    if (teil !== "voll") {
      pool = pool.filter((f) => String(f.teil) === teil);
    }
    if (fortschrittFilter !== "alle") {
      pool = pool.filter((f) => {
        const bewertung = meineBewertungen[f.id];
        if (fortschrittFilter === "nie_gesehen") return !bewertung;
        if (fortschrittFilter === "schon_gesehen") return !!bewertung;
        return bewertung === "falsch" || bewertung === "teilweise";
      });
    }
    return pool.length;
  }, [fragenMeta, modus, ausgewaehlteModule, ausgewaehlterKurs, teil, fortschrittFilter, meineBewertungen]);

  function starten() {
    const params = new URLSearchParams();
    params.set("modus", modus);
    params.set("teil", teil);
    params.set("sortierung", sortierung);
    if (modus === "modul") {
      params.set("module", ausgewaehlteModule.join(","));
    }
    if (modus === "kurs") {
      const [modul, kurs] = ausgewaehlterKurs.split("|||");
      params.set("modul", modul);
      params.set("kurs", kurs);
    }
    if (fortschrittFilter !== "alle") {
      params.set("fortschritt", fortschrittFilter);
    }
    router.push(`/session?${params.toString()}`);
  }

  const faecherLabel =
    modus === "zufaellig"
      ? "Zufällig"
      : modus === "modul"
        ? ausgewaehlteModule.length === 0
          ? "Auswählen…"
          : ausgewaehlteModule.length === 1
            ? ausgewaehlteModule[0]
            : `${ausgewaehlteModule.length} Module`
        : ausgewaehlterKurs
          ? ausgewaehlterKurs.split("|||")[1]
          : "Auswählen…";

  const teilLabel = TEIL_OPTIONEN.find((o) => o.value === teil)?.label ?? "Alle";
  const sortierungLabel = SORTIER_OPTIONEN.find((o) => o.value === sortierung)?.label ?? "";
  const fortschrittLabel = FORTSCHRITT_OPTIONEN.find((o) => o.value === fortschrittFilter)?.label ?? "";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3 p-6 pt-2">
      <AuswahlZeile label="Fächer" wert={faecherLabel} onClick={() => setOffenerPicker("faecher")} />
      <AuswahlZeile label="Teil" wert={teilLabel} onClick={() => setOffenerPicker("teil")} />
      <AuswahlZeile
        label="Reihenfolge"
        wert={sortierungLabel}
        onClick={() => setOffenerPicker("reihenfolge")}
      />
      <AuswahlZeile
        label="Fortschritt"
        wert={fortschrittLabel}
        onClick={() => setOffenerPicker("fortschritt")}
      />

      <button
        type="button"
        disabled={!kannStarten || verfuegbareAnzahl === 0}
        onClick={starten}
        className="kp-btn-primary mt-2 py-3.5"
      >
        {kannStarten
          ? `${verfuegbareAnzahl} Frage${verfuegbareAnzahl === 1 ? "" : "n"} starten`
          : "Bitte Fächer auswählen"}
      </button>

      {offenerPicker === "faecher" && (
        <PickerOverlay titel="Fächer" onClose={() => setOffenerPicker(null)}>
          <div className="flex flex-col gap-1">
            <OptionZeile
              label="Zufällig (alle Module)"
              aktiv={modus === "zufaellig"}
              onClick={() => {
                setModus("zufaellig");
                setOffenerPicker(null);
              }}
            />
            <OptionZeile
              label="Bestimmte Module"
              aktiv={modus === "modul"}
              onClick={() => setModus("modul")}
            />
            {modus === "modul" && (
              <div className="ml-2 flex max-h-48 flex-col gap-1 overflow-y-auto rounded-xl bg-zinc-50 p-2">
                {alleModule.map((modul) => (
                  <label
                    key={modul}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-100"
                  >
                    <input
                      type="checkbox"
                      checked={ausgewaehlteModule.includes(modul)}
                      onChange={() => toggleModul(modul)}
                      className="h-4 w-4 accent-[#3797f0]"
                    />
                    {modul}
                  </label>
                ))}
              </div>
            )}
            <OptionZeile
              label="Bestimmter Kurs"
              aktiv={modus === "kurs"}
              onClick={() => setModus("kurs")}
            />
            {modus === "kurs" && (
              <select
                value={ausgewaehlterKurs}
                onChange={(e) => setAusgewaehlterKurs(e.target.value)}
                className="kp-input ml-2"
              >
                <option value="">Kurs auswählen…</option>
                {[...moduleNachName.entries()].map(([modul, fragen]) => (
                  <optgroup key={modul} label={modul}>
                    {[...new Set(fragen.map((f) => f.kurs))].map((kurs) => (
                      <option key={`${modul}|||${kurs}`} value={`${modul}|||${kurs}`}>
                        {kurs}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>
        </PickerOverlay>
      )}

      {offenerPicker === "teil" && (
        <PickerOverlay titel="Teil" onClose={() => setOffenerPicker(null)}>
          <div className="flex flex-col gap-1">
            {TEIL_OPTIONEN.map((opt) => (
              <OptionZeile
                key={opt.value}
                label={opt.label}
                aktiv={teil === opt.value}
                onClick={() => {
                  setTeil(opt.value);
                  setOffenerPicker(null);
                }}
              />
            ))}
          </div>
        </PickerOverlay>
      )}

      {offenerPicker === "reihenfolge" && (
        <PickerOverlay titel="Reihenfolge" onClose={() => setOffenerPicker(null)}>
          <div className="flex flex-col gap-1">
            {SORTIER_OPTIONEN.map((opt) => (
              <OptionZeile
                key={opt.value}
                label={opt.label}
                aktiv={sortierung === opt.value}
                onClick={() => {
                  setSortierung(opt.value);
                  setOffenerPicker(null);
                }}
              />
            ))}
          </div>
        </PickerOverlay>
      )}

      {offenerPicker === "fortschritt" && (
        <PickerOverlay titel="Fortschritt" onClose={() => setOffenerPicker(null)}>
          <div className="flex flex-col gap-1">
            {FORTSCHRITT_OPTIONEN.map((opt) => (
              <OptionZeile
                key={opt.value}
                label={opt.label}
                aktiv={fortschrittFilter === opt.value}
                onClick={() => {
                  setFortschrittFilter(opt.value);
                  setOffenerPicker(null);
                }}
              />
            ))}
          </div>
        </PickerOverlay>
      )}
    </div>
  );
}
