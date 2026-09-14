"use client";

import { useCallback, useEffect, useState } from "react";
import { istGastFavorit, toggleGastFavorit } from "@/lib/favoriten";

// Favoriten-Zustand einer Frage – zentral, damit mehrere Buttons (Vorder- und
// Rückseite der Karteikarte) denselben Zustand teilen.
// Gast  -> localStorage (kp_favoriten_v1)
// Nutzer -> POST /api/favoriten { questionId, favorit }
export function useFavorit(questionId: number, istGast: boolean, initialFavorit: boolean) {
  const [favorit, setFavorit] = useState(initialFavorit);
  const [speichert, setSpeichert] = useState(false);

  // Gast: localStorage steht beim SSR nicht zur Verfügung -> nach dem Mounten lesen.
  useEffect(() => {
    if (istGast) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setFavorit(istGastFavorit(questionId));
    }
  }, [istGast, questionId]);

  const umschalten = useCallback(async () => {
    if (speichert) return;

    if (istGast) {
      setFavorit(toggleGastFavorit(questionId));
      return;
    }

    const neu = !favorit;
    setFavorit(neu); // optimistisch
    setSpeichert(true);
    try {
      const res = await fetch("/api/favoriten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, favorit: neu }),
      });
      if (!res.ok) throw new Error("Favorit speichern fehlgeschlagen");
    } catch {
      setFavorit(!neu); // zurückrollen
    } finally {
      setSpeichert(false);
    }
  }, [favorit, istGast, questionId, speichert]);

  return { favorit, umschalten };
}

// Sichtbarer "Merken"-Pill. Sitzt auf der klickbaren Karteikarte, deshalb wird
// der Klick nicht durchgereicht (sonst würde die Karte umgedreht).
export function FavoritButton({
  favorit,
  onToggle,
  className = "",
}: {
  favorit: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onKeyDown={(e) => e.stopPropagation()}
      aria-pressed={favorit}
      aria-label={favorit ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
        favorit
          ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
          : "border-zinc-200 bg-white text-zinc-500 hover:border-amber-300 hover:text-amber-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-amber-700"
      } ${className}`}
    >
      <span className="text-sm leading-none">{favorit ? "★" : "☆"}</span>
      {favorit ? "Gemerkt" : "Merken"}
    </button>
  );
}
