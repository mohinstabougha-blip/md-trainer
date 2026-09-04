"use client";

import { useEffect, useState } from "react";

/**
 * Bild mit Tippen-zum-Vergrößern: wichtig für Röntgen-/CT-Bilder, die man in
 * der kleinen Karteikarte kaum beurteilen kann. Öffnet eine Vollbild-Ansicht
 * (object-contain, nie beschnitten) statt einer festen Kartenhöhe.
 */
export function ZoombaresBild({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [offen, setOffen] = useState(false);

  useEffect(() => {
    if (!offen) return;
    function aufEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOffen(false);
    }
    document.addEventListener("keydown", aufEscape);
    return () => document.removeEventListener("keydown", aufEscape);
  }, [offen]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOffen(true);
        }}
        aria-label={`${alt} – antippen zum Vergrößern`}
        className="cursor-zoom-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`w-full rounded-xl object-contain ${className ?? ""}`}
        />
      </button>

      {offen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={(e) => {
            e.stopPropagation();
            setOffen(false);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOffen(false);
            }}
            aria-label="Schließen"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full cursor-zoom-out object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
