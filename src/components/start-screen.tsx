"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FrageMeta } from "@/lib/questions";
import type { Bewertung } from "@/lib/bewertung-types";
import { getGastBewertungen } from "@/lib/gast-fortschritt";

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
  { value: "alle", label: "Alle" },
  { value: "falsch_beantwortet", label: "Falsch beantwortet" },
  { value: "nie_gesehen", label: "Noch nie gesehen" },
  { value: "schon_gesehen", label: "Schon gesehen" },
];

type Kriterien = {
  modus: Modus;
  ausgewaehlteModule: string[];
  ausgewaehlterKurs: string;
  teil: Teil;
  fortschrittFilter: FortschrittFilter;
};

// Kuratierte Themengruppen: trifft eines der Muster, wird der ganze Kurs unter
// dem Zielnamen einsortiert. Reihenfolge zählt (spezifischer vor allgemeiner).
const KURS_GRUPPEN: { ziel: string; test: RegExp }[] = [
  { ziel: "Hypophyse", test: /hypophys|akromegalie|prolaktinom|sheehan|hypopituitar|kraniopharyngeom|craniopharyngeom|diabetes insipidus/i },
  { ziel: "Nebenniere", test: /nebennier|\baddison\b|cushing|\bconn\b|hyperaldosteron|phäochromozytom|adrenogenital/i },
  { ziel: "Schilddrüsenkarzinom", test: /schilddrüsenkarzinom|schilddrüsen-?ca\b|struma maligna/i },
  { ziel: "Struma / Schilddrüsenknoten", test: /\bstruma\b|schilddrüsenknoten|schilddrüsenautonomie|knotenstruma|hyper-?\/?hypothyreose/i },
  { ziel: "Hyperthyreose", test: /hyperthyreose|hyperthyreot|morbus basedow|\bbasedow\b|thyreotoxi|schilddrüsenüberfunktion/i },
  { ziel: "Hypothyreose", test: /hypothyreose|hypothyreot|hashimoto|schilddrüsenunterfunktion|myxödem/i },
  { ziel: "Diabetes-Komplikationen", test: /ketoazidose|\bdka\b|hyperglykämisch|hyperosmolar|diabetisches koma|diabetische (nephro|retino|neuro)pathie|diabetische[rs]? fuß|malum perforans|hypoglykäm/i },
  { ziel: "Diabetes mellitus", test: /diabetes mellitus|\blada\b|\bmody\b|typ-?[12][ -]?diabetes|\bdm-?[12]\b|insulintherapie|orale antidiabetika|prädiabetes/i },
  { ziel: "Osteoporose", test: /osteoporose|osteomalazie|bisphosphonat|knochendichte/i },
  { ziel: "Kalzium-/Parathormon-Störungen", test: /hyperkalzämie|hypokalzämie|hyperparathyreoidismus|hypoparathyreoidismus/i },
  { ziel: "Gastrointestinale Blutung", test: /gi-?blutung|gastrointestinale blutung|obere gi|untere gi|forrest|varizenblutung|ösophagusvarizen|nsar-?ulkus|nsaid-?ulkus|hämatemesis|mel[aä]ena|teerstuhl/i },
  { ziel: "Ulkuskrankheit (Magen/Duodenum)", test: /ulkuskrankheit|ulkusleiden|ulcus (ventriculi|duodeni|pepticum)|magengeschwür|zwölffingerdarmgeschwür|peptische[rs]? ulkus|gastroduodenale[rs]? ulkus|helicobacter/i },
  { ziel: "Clostridioides-difficile-Kolitis", test: /clostridi|c\.?\s?difficile|pseudomembranöse kolitis|antibiotika-?assoziierte? kolitis/i },
  { ziel: "Chronisch-entzündliche Darmerkrankung", test: /morbus crohn|colitis ulcerosa|\bced\b|chronisch-?entzündliche darm/i },
  { ziel: "Leberzirrhose", test: /leberzirrhose|leberzhirrose|child-?pugh|portale hypertension|hepatische enzephalopathie|hepatorenale?s? syndrom/i },
  { ziel: "Divertikulitis", test: /divertikulitis|divertikelkrankheit|hinchey/i },
  { ziel: "Kolorektales Karzinom", test: /kolorektale?s? karzinom|kolonkarzinom|rektumkarzinom|kolorektal.*\bca\b/i },
  { ziel: "Pankreatitis", test: /pankreatitis/i },
  { ziel: "Cholezystitis / Gallenwege", test: /cholezystitis|cholangitis|chol(e|a)lithiasis|choledocholithiasis|gallenkolik|gallenstein|gallenblasen|courvoisier/i },
  { ziel: "Appendizitis", test: /appendizitis/i },
  { ziel: "Ileus", test: /\bileus\b|darmverschluss|volvulus|briden/i },
  { ziel: "Leistenhernie / Bauchwandhernien", test: /leistenhernie|inguinalhernie|nabelhernie|narbenhernie|schenkelhernie|bauchwandhernie|hernien/i },
  { ziel: "Akutes Koronarsyndrom", test: /koronarsyndrom|\bacs\b|\bstemi\b|\bnstemi\b|myokardinfarkt|herzinfarkt|instabile angina|vorderwandinfarkt|hinterwandinfarkt/i },
  { ziel: "Vorhofflimmern / -flattern", test: /vorhofflimmern|vorhofflatter|\bvhf\b|tachyarrhythmia absoluta/i },
  { ziel: "Herzinsuffizienz", test: /herzinsuffizienz|\bhfref\b|\bhfpef\b|kardiale dekompensation|lungenödem/i },
  { ziel: "Herzklappenerkrankungen", test: /aortenklappen|aortenstenose|aorteninsuffizienz|mitralklappen|mitralstenose|mitralinsuffizienz|trikuspidal|klappenprothes|klappenvitium|herzklappe/i },
  { ziel: "Bradykardie / Schrittmacher", test: /bradykard|av-?block|schrittmacher|sick-?sinus|herzschrittmacher/i },
  { ziel: "Reanimation", test: /reanimation|\bcpr\b|advanced life support|herz-?kreislauf-?stillstand|kammerflimmern|defibrill|asystolie/i },
  { ziel: "EKG / Herzrhythmusstörungen", test: /tachykard|kammertachykard|\bwpw\b|avnrt|torsade|reentry|\bekg\b|herzrhythmus|arrhythmi|extrasystol/i },
  { ziel: "Lungenembolie", test: /lungenembolie|lungenarterienembolie|\blae\b|pulmonalembolie/i },
  { ziel: "Tiefe Venenthrombose", test: /venenthrombose|\btvt\b|beinvenenthrombose|phlebothrombose/i },
  { ziel: "pAVK / akuter Arterienverschluss", test: /\bpavk\b|claudicatio|arterielle verschlusskrankheit|akuter arterieller verschluss|akute[rs]? extremitätenischämie/i },
  { ziel: "Aortendissektion / -aneurysma", test: /aortendissektion|aortenaneurysma|akutes aortensyndrom|\bbaa\b|bauchaortenaneurysma/i },
  { ziel: "Endokarditis", test: /endokarditis/i },
  { ziel: "Perikarditis / Perikarderguss", test: /perikarditis|perikarderguss|perikardtampon|herzbeuteltampon/i },
  { ziel: "Hypertensive Krise / Hypertonie", test: /hypertensive krise|hypertensiver notfall|arterielle hypertonie|blutdruckkrise|sekundäre hypertonie/i },
  { ziel: "Schock", test: /\bschock\b|schockindex/i },
  { ziel: "Synkope", test: /synkope|kollaps/i },
  { ziel: "Pneumonie", test: /pneumonie|lungenentzündung/i },
  { ziel: "COPD", test: /\bcopd\b|chronisch obstruktive lungen|aecopd|lungenemphysem/i },
  { ziel: "Asthma bronchiale", test: /asthma/i },
  { ziel: "Pneumothorax", test: /pneumothorax/i },
  { ziel: "Bronchialkarzinom / Lungenrundherd", test: /bronchialkarzinom|lungenkarzinom|lungenrundherd|lungentumor|pancoast/i },
  { ziel: "Tuberkulose", test: /tuberkulose|\btbc\b/i },
  { ziel: "Meningitis", test: /meningitis|meningoenzephalitis/i },
  { ziel: "Schlaganfall / TIA", test: /schlaganfall|apoplex|hirninfarkt|\btia\b|mediainfarkt|ischämischer insult|intrazerebrale blutung|subarachnoidalblutung/i },
  { ziel: "Bandscheibenvorfall", test: /bandscheiben|diskusprolaps|nucleus pulposus|lumboischialgie/i },
  { ziel: "Parkinson-Syndrom", test: /parkinson/i },
  { ziel: "Anämie", test: /\banämie\b|eisenmangel|perniziös|blutarmut|hämolytisch/i },
  { ziel: "Akute Nierenschädigung", test: /akute nierensch|akutes nierenversagen|\baki\b|\banv\b|kdigo/i },
  { ziel: "Chronische Niereninsuffizienz / Dialyse", test: /chronische niereninsuffizienz|chronische nierenerkrankung|\bckd\b|dialyse|nierenersatz/i },
  { ziel: "Nierentransplantation", test: /nierentransplantation|transplantatabstoßung|nach transplantation/i },
  { ziel: "Harnwegsinfekt / Pyelonephritis", test: /harnwegsinfekt|\bhwi\b|pyelonephritis|zystitis|urosepsis/i },
  { ziel: "Glomeruläre Erkrankungen", test: /nephrotische?s? syndrom|nephritische?s? syndrom|glomerulonephritis|iga-?nephropathie|minimal-?change|membranöse glomerulo|\bfsgs\b|purpura schönlein|schönlein-?henoch|granulomatose mit polyangiitis|\banca\b/i },
  { ziel: "Elektrolytstörungen (Kalium/Natrium)", test: /hyperkaliämie|hypokaliämie|hypernatriämie|hyponatriämie|\bsiadh\b|schwartz-?bartter/i },
  { ziel: "Sepsis", test: /\bsepsis\b|septische[rs]? schock|sofa-?score|\bqsofa\b/i },
  { ziel: "Anaphylaxie", test: /anaphyla|anaphylakt/i },
  { ziel: "Verbrennungen", test: /verbrennung|verbrühung/i },
  { ziel: "Polytrauma", test: /polytrauma|\batls\b|schockraum/i },
  { ziel: "Schädel-Hirn-Trauma", test: /schädel-?hirn-?trauma|\bsht\b|epiduralhämatom|subduralhämatom|commotio/i },
  { ziel: "Schenkelhalsfraktur", test: /schenkelhalsfraktur|\bshf\b|hüftfraktur|femurhalsfraktur/i },
  { ziel: "Sprunggelenkfraktur", test: /sprunggelenkfraktur|\bosg\b.*fraktur|weber-?[abc]|malleolarfraktur/i },
  { ziel: "Distale Radiusfraktur", test: /radiusfraktur|colles|handgelenksfraktur/i },
  { ziel: "Coxarthrose / Gonarthrose", test: /coxarthrose|gonarthrose|hüftgelenksarthrose|kniegelenksarthrose|hüftarthrose/i },
  { ziel: "Bissverletzung", test: /bissverletzung|katzenbiss|hundebiss|tierbiss|menschenbiss/i },
  { ziel: "Malaria / Tropenerkrankungen", test: /malaria|tropenkrankheit|tropische infektion|dengue|typhus/i },
  { ziel: "Impfungen", test: /\bimpfung|impfstoff|impfstatus|stiko|tetanusprophylaxe/i },
  { ziel: "Reisemedizin / Fieber unklarer Genese", test: /fieber unklarer genese|\bfuo\b|reisemedizin|reiseanamnese/i },
];

/**
 * Fasst die sehr feingliedrigen Kursnamen zu einem Basis-Thema zusammen, damit
 * die Kursauswahl kompakt bleibt – erst über kuratierte Themengruppen, sonst
 * über eine allgemeine Normalisierung (Untertitel abschneiden usw.).
 */
export function kursBasis(kurs: string): string {
  for (const g of KURS_GRUPPEN) {
    if (g.test.test(kurs)) return g.ziel;
  }
  return kursGrundform(kurs);
}

function kursGrundform(kurs: string): string {
  let s = kurs.trim();
  // klar abtrennbare Kompositum-Suffixe (mit Bindestrich, ohne Leerzeichen)
  s = s.replace(/-(Komplikationen|Management|Diagnostik|Therapie|Klinik|Grundlagen)$/i, "");
  // Untertitel bzw. Kontextzusatz nach Trenner abschneiden
  const trenner = s.search(
    /\s[–—-]\s|\s\/\s|\/|\s\(|:\s|\s(?:und|sowie|bei|nach|versus|vs\.?)\s|\s&\s/i
  );
  if (trenner > 0) s = s.slice(0, trenner);
  // führende Qualifier entfernen
  s = s
    .replace(
      /^(akut(?:e|er|es)?|chronisch(?:e|er|es)?|infektiöse[rs]?|primäre[rs]?|sekundäre[rs]?|mechanisch(?:e|er|es)?|obere[rs]?|untere[rs]?|rechtsseitige[rs]?|linksseitige[rs]?|distale[rs]?|proximale[rs]?|bilaterale[rs]?|toxische[rs]?|antibiotika-assoziierte[rs]?)\s+/i,
      ""
    )
    .replace(/[\s–—\-,;:]+$/, "")
    .trim();
  return s || kurs.trim();
}

function frageErfuelltKriterien(
  f: FrageMeta,
  k: Kriterien,
  bewertungen: Record<number, Bewertung>
): boolean {
  if (k.modus === "modul") {
    if (k.ausgewaehlteModule.length > 0 && !k.ausgewaehlteModule.includes(f.modul)) return false;
  } else if (k.modus === "kurs" && k.ausgewaehlterKurs) {
    const [modul, basis] = k.ausgewaehlterKurs.split("|||");
    if (f.modul !== modul || kursBasis(f.kurs) !== basis) return false;
  }
  if (k.teil !== "voll" && String(f.teil) !== k.teil) return false;
  if (k.fortschrittFilter !== "alle") {
    const b = bewertungen[f.id];
    if (k.fortschrittFilter === "nie_gesehen") return !b;
    if (k.fortschrittFilter === "schon_gesehen") return !!b;
    return b === "falsch" || b === "teilweise";
  }
  return true;
}

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
  anzahl,
  onClick,
}: {
  label: string;
  aktiv: boolean;
  anzahl?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
        aktiv ? "bg-accent/10 font-medium text-accent" : "hover:bg-zinc-50"
      }`}
    >
      <span className="flex-1 text-left">{label}</span>
      {anzahl !== undefined && (
        <span className={`text-xs tabular-nums ${aktiv ? "text-accent" : "text-zinc-400"}`}>
          {anzahl}
        </span>
      )}
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{titel}</h2>
          <button type="button" onClick={onClose} className="text-sm text-accent">
            Fertig
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function StartScreen({
  fragenMeta,
  meineBewertungen,
  istGast = false,
}: {
  fragenMeta: FrageMeta[];
  meineBewertungen: Record<number, Bewertung>;
  istGast?: boolean;
}) {
  const router = useRouter();
  // Gast: Fortschritt liegt im localStorage, wird erst nach dem Mounten geladen.
  const [bewertungen, setBewertungen] = useState<Record<number, Bewertung>>(meineBewertungen);
  useEffect(() => {
    // localStorage ist beim SSR nicht verfügbar -> erst nach dem Mounten lesen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (istGast) setBewertungen(getGastBewertungen());
  }, [istGast]);

  const [modus, setModus] = useState<Modus>("zufaellig");
  const [ausgewaehlteModule, setAusgewaehlteModule] = useState<string[]>([]);
  const [ausgewaehlterKurs, setAusgewaehlterKurs] = useState<string>("");
  const [teil, setTeil] = useState<Teil>("voll");
  const [sortierung, setSortierung] = useState<Sortierung>("haeufigste");
  const [fortschrittFilter, setFortschrittFilter] = useState<FortschrittFilter>("alle");
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

  const zaehle = (over: Partial<Kriterien> = {}) => {
    const k: Kriterien = {
      modus,
      ausgewaehlteModule,
      ausgewaehlterKurs,
      teil,
      fortschrittFilter,
      ...over,
    };
    let n = 0;
    for (const f of fragenMeta) {
      if (frageErfuelltKriterien(f, k, bewertungen)) n++;
    }
    return n;
  };

  const verfuegbareAnzahl = useMemo(
    () => {
      const k: Kriterien = { modus, ausgewaehlteModule, ausgewaehlterKurs, teil, fortschrittFilter };
      let n = 0;
      for (const f of fragenMeta) {
        if (frageErfuelltKriterien(f, k, bewertungen)) n++;
      }
      return n;
    },
    [fragenMeta, modus, ausgewaehlteModule, ausgewaehlterKurs, teil, fortschrittFilter, bewertungen]
  );

  function starten() {
    const params = new URLSearchParams();
    params.set("teil", teil);
    params.set("sortierung", sortierung);
    if (modus === "modul") {
      params.set("modus", "modul");
      params.set("module", ausgewaehlteModule.join(","));
    } else if (modus === "kurs") {
      // Ein kompaktierter Kurs kann mehreren gespeicherten Kursnamen entsprechen
      // -> als Liste (modus "kurse") übergeben.
      const [modul, basis] = ausgewaehlterKurs.split("|||");
      const paare = [
        ...new Map(
          fragenMeta
            .filter((f) => f.modul === modul && kursBasis(f.kurs) === basis)
            .map((f) => [`${f.modul}|||${f.kurs}`, { modul: f.modul, kurs: f.kurs }])
        ).values(),
      ];
      params.set("modus", "kurse");
      params.set("kurse", JSON.stringify(paare));
    } else {
      params.set("modus", "zufaellig");
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
              anzahl={zaehle({ modus: "zufaellig" })}
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
                    <span className="flex-1">{modul}</span>
                    <span className="text-xs tabular-nums text-zinc-400">
                      {zaehle({ modus: "modul", ausgewaehlteModule: [modul] })}
                    </span>
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
                    {[...new Set(fragen.map((f) => kursBasis(f.kurs)))]
                      .sort((a, b) => a.localeCompare(b, "de"))
                      .map((basis) => (
                        <option key={`${modul}|||${basis}`} value={`${modul}|||${basis}`}>
                          {basis} ({zaehle({ modus: "kurs", ausgewaehlterKurs: `${modul}|||${basis}` })})
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
                anzahl={zaehle({ teil: opt.value })}
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
                anzahl={zaehle({ fortschrittFilter: opt.value })}
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
