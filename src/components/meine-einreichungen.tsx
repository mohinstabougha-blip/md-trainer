import type { Einreichung } from "@/lib/einreichungen-types";
import { STATUS_LABEL } from "@/lib/einreichungen-types";

const STATUS_KLASSE: Record<string, string> = {
  offen: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
  freigegeben: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  abgelehnt: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function MeineEinreichungen({ einreichungen }: { einreichungen: Einreichung[] }) {
  if (einreichungen.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Meine Einreichungen</h2>
      <div className="flex flex-col gap-2">
        {einreichungen.map((e) => (
          <div key={e.id} className="kp-card text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">
                {e.typ === "einzelfrage" ? `${e.modul} / ${e.kurs}` : "Protokoll-Einreichung"}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_KLASSE[e.status]}`}>
                {STATUS_LABEL[e.status]}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-zinc-600 dark:text-zinc-400">
              {e.typ === "einzelfrage" ? e.frage : e.protokoll_text}
            </p>
            {e.status === "abgelehnt" && e.admin_kommentar && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">Grund: {e.admin_kommentar}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
