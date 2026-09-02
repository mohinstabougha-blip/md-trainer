import { getAdminStatistik, type Zeitreihe } from "@/lib/admin-statistik";

export const dynamic = "force-dynamic";

const SPALTEN: { key: keyof Zeitreihe; label: string }[] = [
  { key: "heute", label: "Heute" },
  { key: "sieben", label: "7 Tage" },
  { key: "dreissig", label: "30 Tage" },
  { key: "gesamt", label: "Gesamt" },
];

function Zeile({
  name,
  werte,
}: {
  name: string;
  werte: Partial<Zeitreihe>;
}) {
  return (
    <tr className="border-t border-zinc-100">
      <th scope="row" className="py-2 pr-4 text-left font-medium text-zinc-700">
        {name}
      </th>
      {SPALTEN.map((sp) => (
        <td key={sp.key} className="py-2 pl-4 text-right tabular-nums">
          {werte[sp.key] ?? <span className="text-zinc-300">–</span>}
        </td>
      ))}
    </tr>
  );
}

export default async function StatistikPage() {
  const s = await getAdminStatistik();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Statistik</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Stand: {new Date(s.standIso).toLocaleString("de-DE")} · Zeitfenster ab 00:00 Uhr
          (Europe/Berlin).
        </p>
      </div>

      <div className="kp-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-zinc-400">
              <td className="py-2 pr-4" />
              {SPALTEN.map((sp) => (
                <td key={sp.key} className="py-2 pl-4 text-right">
                  {sp.label}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            <Zeile name="Neue Registrierungen" werte={s.registrierungen} />
            <Zeile name="Aktive angemeldete Nutzer" werte={s.aktiveNutzer} />
            <Zeile name="Sessions gestartet" werte={s.sessions} />
            <Zeile name="davon abgeschlossen" werte={s.sessionsAbgeschlossen} />
            <Zeile name="Beantwortete Fragen" werte={s.beantworteteFragen} />
          </tbody>
        </table>
      </div>

      <div className="kp-card flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700">Offene Einreichungen</span>
        <span className="tabular-nums">{s.offeneEinreichungen}</span>
      </div>

      <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
        Nicht angemeldete Besucher (Gäste) haben kein Konto und keine Session in der
        Datenbank und sind hier <strong>nicht</strong> enthalten. Besucherzahlen,
        Seitenaufrufe und Herkunft findest du in{" "}
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Vercel → Analytics
        </a>
        .
      </p>
    </div>
  );
}
