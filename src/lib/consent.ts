// Einwilligung für optionale Marketing-/Tracking-Cookies (Meta Pixel).
// Nur clientseitig. Bis eine Wahl getroffen wurde, gilt "keine Einwilligung"
// und es wird nichts geladen.

export type ConsentValue = "granted" | "denied";

const STORAGE_KEY = "kp_consent_marketing_v1";
const COOKIE_KEY = "kp_consent_marketing";
const MAX_AGE = 60 * 60 * 24 * 180; // 180 Tage
export const CONSENT_EVENT = "kp-consent-change";

export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

// Von Meta gesetzte Marketing-Cookies entfernen (bei Ablehnung/Widerruf).
function loescheMetaCookies(): void {
  const host = window.location.hostname;
  const domains = ["", `; domain=${host}`, `; domain=.${host}`];
  for (const name of ["_fbp", "_fbc"]) {
    for (const d of domains) {
      document.cookie = `${name}=; max-age=0; path=/${d}; SameSite=Lax`;
    }
  }
}

export function setConsent(value: ConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // privater Modus – dann greift nur das Cookie unten
  }
  document.cookie = `${COOKIE_KEY}=${value}; max-age=${MAX_AGE}; path=/; SameSite=Lax`;
  if (value === "denied") loescheMetaCookies();
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function resetConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignorieren
  }
  document.cookie = `${COOKIE_KEY}=; max-age=0; path=/; SameSite=Lax`;
  loescheMetaCookies();
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
