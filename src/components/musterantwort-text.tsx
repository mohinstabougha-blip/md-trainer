import { StrukturierterText } from "@/components/strukturierter-text";

/**
 * Zeigt eine Musterantwort strukturiert an (farbige Abschnitts-Label als Pille,
 * dezenter Farbstreifen pro Punkt). Rein visuell – der gespeicherte Text in der
 * DB bleibt unverändert.
 */
export function MusterantwortText({ text, className }: { text: string; className?: string }) {
  return <StrukturierterText text={text} className={className} />;
}
