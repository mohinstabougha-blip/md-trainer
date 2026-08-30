"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Zeilenauswahl für Admin-Tabellen mit Klick-und-Ziehen:
 * - Klick auf eine Zeile schaltet sie um.
 * - Maustaste gedrückt halten und über weitere Zeilen ziehen wählt/entwählt den
 *   ganzen überstrichenen Bereich (Zielzustand = Gegenteil der Startzeile).
 * - Shift+Klick wählt den Bereich vom letzten Ankerpunkt bis zur geklickten Zeile.
 *
 * `idsInReihenfolge` müssen die IDs in der aktuell angezeigten Zeilenreihenfolge sein.
 */
export function useZeilenAuswahl(idsInReihenfolge: number[]) {
  const [ausgewaehlt, setAusgewaehlt] = useState<Set<number>>(new Set());
  const dragRef = useRef<{ start: number; soll: boolean; basis: Set<number> } | null>(null);
  const ankerRef = useRef<number | null>(null);

  // Loslassen irgendwo auf der Seite beendet das Ziehen.
  useEffect(() => {
    const ende = () => {
      if (dragRef.current) {
        dragRef.current = null;
        document.body.style.userSelect = "";
      }
    };
    document.addEventListener("mouseup", ende);
    return () => document.removeEventListener("mouseup", ende);
  }, []);

  function bereichAnwenden(basis: Set<number>, a: number, b: number, soll: boolean) {
    const next = new Set(basis);
    const von = Math.min(a, b);
    const bis = Math.max(a, b);
    for (let i = von; i <= bis; i++) {
      const id = idsInReihenfolge[i];
      if (id == null) continue;
      if (soll) next.add(id);
      else next.delete(id);
    }
    setAusgewaehlt(next);
  }

  function zeileMausRunter(index: number, shift: boolean) {
    const id = idsInReihenfolge[index];
    if (id == null) return;

    if (shift && ankerRef.current !== null) {
      setAusgewaehlt((prev) => {
        const next = new Set(prev);
        const von = Math.min(ankerRef.current!, index);
        const bis = Math.max(ankerRef.current!, index);
        for (let i = von; i <= bis; i++) {
          const rid = idsInReihenfolge[i];
          if (rid != null) next.add(rid);
        }
        return next;
      });
      ankerRef.current = index;
      return;
    }

    const soll = !ausgewaehlt.has(id);
    const basis = new Set(ausgewaehlt);
    dragRef.current = { start: index, soll, basis };
    ankerRef.current = index;
    document.body.style.userSelect = "none";
    bereichAnwenden(basis, index, index, soll);
  }

  function zeileMausRein(index: number) {
    const d = dragRef.current;
    if (!d) return;
    bereichAnwenden(d.basis, d.start, index, d.soll);
  }

  function alleUmschalten() {
    setAusgewaehlt((prev) => {
      const alle = idsInReihenfolge.length > 0 && idsInReihenfolge.every((id) => prev.has(id));
      const next = new Set(prev);
      if (alle) idsInReihenfolge.forEach((id) => next.delete(id));
      else idsInReihenfolge.forEach((id) => next.add(id));
      return next;
    });
  }

  function auswahlLeeren() {
    setAusgewaehlt(new Set());
  }

  return {
    ausgewaehlt,
    setAusgewaehlt,
    zeileMausRunter,
    zeileMausRein,
    alleUmschalten,
    auswahlLeeren,
  };
}
