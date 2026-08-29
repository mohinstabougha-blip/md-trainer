// Fallback-Anzeige, falls (noch) kein Profil-Anzeigename hinterlegt ist
// (z.B. Alt-Accounts von vor dem Profilsystem).
export function kurzeUserKennung(userId: string, aktuelleUserId: string | null): string {
  if (aktuelleUserId && userId === aktuelleUserId) return "Du";
  return `Nutzer-${userId.slice(0, 6)}`;
}

/** Anzeigename aus der übergebenen Namens-Map, sonst Fallback-Kennung. */
export function nutzerName(
  userId: string,
  namen: Record<string, string>,
  aktuelleUserId: string | null
): string {
  if (aktuelleUserId && userId === aktuelleUserId) return "Du";
  return namen[userId] ?? kurzeUserKennung(userId, aktuelleUserId);
}
