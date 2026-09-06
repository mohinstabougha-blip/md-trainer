"use client";

import { useEffect, useState } from "react";
import { istGastFavorit, toggleGastFavorit } from "@/lib/favoriten";

// Stern-Umschalter für "Frage zu Favoriten hinzufügen".
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
      title={favorit ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      className={`text-lg leading-none transition-transform hover:scale-110 disabled:opacity-40 ${
        favorit ? "text-amber-500" : "text-zinc-300 hover:text-amber-400"
      } ${className}`}
    >
      {favorit ? "★" : "☆"}
    </button>
  );
}
