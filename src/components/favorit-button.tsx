"use client";

import { useEffect, useState } from "react";
import { istGastFavorit, toggleGastFavorit } from "@/lib/favoriten";

// Umschalter "Frage zu Favoriten hinzufügen".
// Gast  -> localStorage (kp_favoriten_v1)
// Nutzer -> POST /api/favoriten { questionId, favorit }
export function FavoritButton({
  questionId,
  istGast,
  initialFavorit,
  className = "",
}: {
  questionId: number;
  istGast: boolean;
  initialFavorit: boolean;
  className?: string;
}) {
  const [favorit, setFavorit] = useState(initialFavorit);
  const [speichert, setSpeichert] = useState(false);

  // Gast: localStorage steht beim SSR nicht zur Verfügung -> nach dem Mounten lesen.
  useEffect(() => {
    if (istGast) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setFavorit(istGastFavorit(questionId));
    }
  }, [istGast, questionId]);

  async function umschalten() {
    if (speichert) return;

    if (istGast) {
      const neu = toggleGastFavorit(questionId);
      setFavorit(neu);
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
  }

  return (
    <button
      type="button"
      onClick={umschalten}
      aria-pressed={favorit}
      aria-label={favorit ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-40 ${
        favorit
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-zinc-200 bg-white text-zinc-500 hover:border-amber-300 hover:text-amber-600"
      } ${className}`}
    >
      <span className="text-sm leading-none">{favorit ? "★" : "☆"}</span>
      {favorit ? "Gemerkt" : "Merken"}
    </button>
  );
}
