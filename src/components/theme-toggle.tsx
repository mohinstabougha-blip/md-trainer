"use client";

import { useEffect, useState } from "react";

const KEY = "kp_theme";

function IconSonne() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" />
    </svg>
  );
}

function IconMond() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 14.3A8.5 8.5 0 1 1 9.7 3.5a6.8 6.8 0 0 0 10.8 10.8Z" />
    </svg>
  );
}

/** Umschalter Nachtmodus. Der eigentliche Zustand steckt in der .dark-Klasse
 *  am <html> (siehe layout.tsx-Inline-Script für den ersten Render) – diese
 *  Komponente liest ihn nur nach dem Mounten aus, um SSR/Client konsistent
 *  zu halten, und spiegelt Klicks in localStorage. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dunkel, setDunkel] = useState(false);
  const [bereit, setBereit] = useState(false);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setDunkel(document.documentElement.classList.contains("dark"));
    setBereit(true);
  }, []);

  function umschalten() {
    const neu = !dunkel;
    setDunkel(neu);
    document.documentElement.classList.toggle("dark", neu);
    try {
      localStorage.setItem(KEY, neu ? "dark" : "light");
    } catch {
      // privater Modus / Speicher voll – Umschalten funktioniert trotzdem,
      // nur die Präferenz bleibt nicht über den nächsten Besuch erhalten.
    }
  }

  return (
    <button
      type="button"
      onClick={umschalten}
      disabled={!bereit}
      aria-label={dunkel ? "Zu hellem Modus wechseln" : "Zu dunklem Modus wechseln"}
      title={dunkel ? "Heller Modus" : "Dunkler Modus"}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-0 dark:text-zinc-400 dark:hover:bg-zinc-800 ${className}`}
    >
      {dunkel ? <IconSonne /> : <IconMond />}
    </button>
  );
}
