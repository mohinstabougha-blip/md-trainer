"use client";

import { useMemo, useState } from "react";
import type { NutzerZeile } from "@/lib/admin-statistik";

type SortKey =
  | "anzeigename"
  | "email"
  | "registriertAm"
  | "beantworteteFragen"
  | "sessions"
  | "sessionsAbgeschlossen"
  | "module";

const SPALTEN: { key: SortKey; label: string; numerisch?: boolean }[] = [
  { key: "anzeigename", label: "Name" },
  { key: "email", label: "E-Mail" },
  { key: "registriertAm", label: "Registriert", numerisch: true },
  { key: "beantworteteFragen", label: "Fragen", numerisch: true },
  { key: "sessions", label: "Sessions", numerisch: true },
  { key: "sessionsAbgeschlossen", label: "Sessions abgeschl.", numerisch: true },
  { key: "module", label: "Geübte Module", numerisch: true },
];

function wert(n: NutzerZeile, key: SortKey): number | string {
  switch (key) {
    case "registriertAm":
      return Date.parse(n.registriertAm);
    case "beantworteteFragen":
      return n.beantworteteFragen;
    case "sessions":
      return n.sessions;
    case "sessionsAbgeschlossen":
      return n.sessionsAbgeschlossen;
    case "module":
      return n.module.length;
    case "anzeigename":
      return (n.anzeigename ?? "").toLowerCase();
    case "email":
      return (n.email ?? "").toLowerCase();
  }
}

export function NutzerTabelle({ nutzer }: { nutzer: NutzerZeile[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("registriertAm");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function klick(key: SortKey, numerisch?: boolean) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(numerisch ? "desc" : "asc");
    }
  }

  const sortiert = useMemo(() => {
    const kopie = [...nutzer];
    kopie.sort((a, b) => {
      const va = wert(a, sortKey);
      const vb = wert(b, sortKey);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return kopie;
  }, [nutzer, sortKey, sortDir]);

  return (
    <div className="kp-card overflow-x-auto">
      <div className="mb-2 text-sm font-medium text-zinc-700">
        Registrierte Nutzer ({nutzer.length})
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-zinc-400">
            {SPALTEN.map((sp) => (
              <th
                key={sp.key}
                className={`cursor-pointer select-none whitespace-nowrap py-2 pr-4 font-medium hover:text-zinc-700 ${
                  sp.numerisch ? "text-right" : "text-left"
                }`}
                onClick={() => klick(sp.key, sp.numerisch)}
              >
                {sp.label}
                {sortKey === sp.key && (sortDir === "asc" ? " ▲" : " ▼")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortiert.length === 0 && (
            <tr className="border-t border-zinc-100">
              <td colSpan={SPALTEN.length} className="py-6 text-center text-zinc-500">
                Noch keine registrierten Nutzer.
              </td>
            </tr>
          )}
          {sortiert.map((n) => (
            <tr key={n.userId} className="border-t border-zinc-100 align-top">
              <td className="py-2 pr-4">{n.anzeigename ?? <span className="text-zinc-300">–</span>}</td>
              <td className="py-2 pr-4 text-zinc-600">
                {n.email ?? <span className="text-zinc-300">–</span>}
              </td>
              <td className="whitespace-nowrap py-2 pr-4 text-right tabular-nums">
                {new Date(n.registriertAm).toLocaleDateString("de-DE")}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">{n.beantworteteFragen}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{n.sessions}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{n.sessionsAbgeschlossen}</td>
              <td className="py-2 pr-4">
                {n.module.length === 0 ? (
                  <span className="text-zinc-300">–</span>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    {n.module.map((m) => (
                      <span
                        key={m}
                        className="whitespace-nowrap rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                      >
                        {m}
                      </span>
                    ))}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
