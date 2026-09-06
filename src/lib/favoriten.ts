// Favoriten eines nicht angemeldeten Besuchers: nur im localStorage.
// Angemeldete Nutzer nutzen die favoriten-Tabelle (lib/favoriten-server.ts +
// /api/favoriten).

const KEY = "kp_favoriten_v1";

function lesen(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const roh = window.localStorage.getItem(KEY);
    if (!roh) return [];
    const parsed = JSON.parse(roh);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "number") : [];
  } catch {
    return [];
  }
}

function schreiben(ids: number[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // ignorieren
  }
}

/** Favoriten-IDs, zuletzt hinzugefügte zuerst. */
export function getGastFavoriten(): number[] {
  return lesen();
}

export function istGastFavorit(frageId: number): boolean {
  return lesen().includes(frageId);
}

/** Fügt hinzu bzw. entfernt und gibt den neuen Zustand (true = Favorit) zurück. */
export function toggleGastFavorit(frageId: number): boolean {
  const aktuell = lesen();
  if (aktuell.includes(frageId)) {
    schreiben(aktuell.filter((id) => id !== frageId));
    return false;
  }
  schreiben([frageId, ...aktuell]);
  return true;
}
