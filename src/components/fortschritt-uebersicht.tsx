"use client";

import { useRef } from "react";
import Link from "next/link";
import type { ModulFortschritt } from "@/lib/fortschritt";
import { FortschrittRing } from "@/components/fortschritt-ring";

function ChevronIcon({ richtung }: { richtung: "links" | "rechts" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {richtung === "links" ? <path d="m15 5-7 7 7 7" /> : <path d="m9 5 7 7-7 7" />}
    </svg>
  );
}

export function FortschrittUebersicht({ stats }: { stats: ModulFortschritt[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (stats.length === 0) return null;

  function scrollen(richtung: "links" | "rechts") {
    scrollRef.current?.scrollBy({ left: richtung === "links" ? -240 : 240, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollen("links")}
        aria-label="Nach links scrollen"
        className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-1.5 text-zinc-600 shadow-md sm:flex"
      >
        <ChevronIcon richtung="links" />
      </button>

      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-5 overflow-x-auto scroll-smooth px-6 pb-2 sm:px-11"
      >
        {stats.map((stat) => (
          <Link
            key={stat.modul}
            href={`/session?modus=modul&module=${encodeURIComponent(stat.modul)}&teil=voll&sortierung=haeufigste`}
            title={stat.modul}
            className="flex w-20 flex-shrink-0 flex-col items-center gap-1 text-center"
          >
            <FortschrittRing stat={stat} />
            <span className="line-clamp-2 w-full break-words text-[11px] leading-tight text-zinc-600">
              {stat.modul}
            </span>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollen("rechts")}
        aria-label="Nach rechts scrollen"
        className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-1.5 text-zinc-600 shadow-md sm:flex"
      >
        <ChevronIcon richtung="rechts" />
      </button>
    </div>
  );
}
