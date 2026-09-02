import type { UpdateInfo } from "@/lib/updates";

function datumLang(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Schmaler Streifen ganz oben: signalisiert, dass die Fragendatenbank laufend
// wächst – mit Datum der letzten Freigabe und Zuwachs pro Modul.
export function UpdateBanner({ info }: { info: UpdateInfo | null }) {
  if (!info) return null;

  const { letzteFreigabe, neuAnzahl, zeitraum, proModul, gesamtFragen } = info;
  const topModule = proModul.slice(0, 8);
  const rest = proModul.length - topModule.length;

  return (
    <div className="w-full border-b border-accent/20 bg-accent/[0.07] py-2 text-xs text-zinc-700 sm:text-[13px]">
      <p className="mx-auto max-w-3xl px-4 text-center">
        <span className="mr-1 inline-flex items-center gap-1.5 font-semibold text-accent">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
          Laufend erweitert
        </span>
        · zuletzt aktualisiert am {datumLang(letzteFreigabe)} ·{" "}
        <span className="font-medium">
          {neuAnzahl} {neuAnzahl === 1 ? "neue Frage" : "neue Fragen"}
        </span>{" "}
        {zeitraum === "fenster" ? "in den letzten 30 Tagen" : "zuletzt freigegeben"} · {gesamtFragen}{" "}
        Fragen insgesamt
      </p>
      {topModule.length > 0 && (
        <div className="scrollbar-hide mx-auto mt-1 flex max-w-3xl gap-1 overflow-x-auto px-4 sm:flex-wrap sm:justify-center">
          {topModule.map((m) => (
            <span
              key={m.modul}
              className="whitespace-nowrap rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-accent"
            >
              {m.modul} +{m.anzahl}
            </span>
          ))}
          {rest > 0 && (
            <span className="whitespace-nowrap rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
              +{rest} weitere
            </span>
          )}
        </div>
      )}
    </div>
  );
}
