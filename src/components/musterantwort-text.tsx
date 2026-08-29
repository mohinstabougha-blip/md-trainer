import { musterantwortSaetze } from "@/lib/musterantwort-format";

/**
 * Zeigt eine Musterantwort als saubere Stichpunkt-Liste (Notion-Stil: dezente
 * Bullets, großzügiger Zeilenabstand) statt als einzelnen Fließtext-Absatz.
 * Rein visuell — der gespeicherte Text in der DB bleibt unverändert.
 */
export function MusterantwortText({ text, className }: { text: string; className?: string }) {
  const saetze = musterantwortSaetze(text);

  return (
    <ul className={`flex flex-col gap-2 ${className ?? ""}`}>
      {saetze.map((satz, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-300" />
          <span className="leading-relaxed">{satz}</span>
        </li>
      ))}
    </ul>
  );
}
