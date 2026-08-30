"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

let ladeVersprechen: Promise<void> | null = null;

function ladeTurnstileSkript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!ladeVersprechen) {
    ladeVersprechen = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Turnstile-Skript konnte nicht geladen werden"));
      document.head.appendChild(script);
    });
  }
  return ladeVersprechen;
}

/**
 * Cloudflare-Turnstile-Widget gegen automatisierte Massen-Kontoerstellung.
 * Rendert nichts, wenn kein Site-Key konfiguriert ist (z.B. lokale Entwicklung
 * ohne Turnstile-Setup) — Anmelden/Registrieren bleibt dann ohne CAPTCHA nutzbar.
 *
 * resetSignal hochzählen, um das Widget nach einem fehlgeschlagenen Versuch
 * zurückzusetzen (ein Token ist nur einmal gültig).
 */
export function TurnstileWidget({
  onToken,
  resetSignal,
}: {
  onToken: (token: string | null) => void;
  resetSignal: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let abgebrochen = false;

    ladeTurnstileSkript()
      .then(() => {
        if (abgebrochen || !window.turnstile || !containerRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
        });
      })
      .catch(() => onToken(null));

    return () => {
      abgebrochen = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      onToken(null);
      window.turnstile.reset(widgetIdRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="flex justify-center" />;
}

/**
 * Bequemer Wrapper für Formulare: liefert das fertige Widget, den aktuellen
 * Token, eine reset()-Funktion (nach fehlgeschlagenem Absenden aufrufen) und ob
 * ein Token verpflichtend ist (nur wenn ein Site-Key konfiguriert ist).
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const erforderlich = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const reset = useCallback(() => {
    setToken(null);
    setResetSignal((n) => n + 1);
  }, []);

  const widget = useMemo(
    () => <TurnstileWidget onToken={setToken} resetSignal={resetSignal} />,
    [resetSignal]
  );

  return { token, widget, reset, erforderlich };
}
