import Link from "next/link";
import { AngeboteListe } from "@/components/marktplatz/angebote-liste";
import { Rechtshinweis } from "@/components/marktplatz/rechtshinweis";
import {
  getAngeboteFuerUebersicht,
  getAngebotsTitelFuerGaeste,
  KATEGORIE_LABEL,
} from "@/lib/marktplatz";
import { getAnzeigenamen } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MarktplatzPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gast: nur Titel + Kategorie, nicht anklickbar, kein Kontakt/Kommentar.
  if (!user) {
    const titel = await getAngebotsTitelFuerGaeste();
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">Marktplatz</h1>
          <Link href="/login" className="kp-btn-primary py-1.5">
            Anmelden
          </Link>
        </div>
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Als Gast siehst du nur die Titel. Zum Öffnen, Kontaktieren, Kommentieren
          oder für ein eigenes Angebot bitte anmelden.
        </p>
        <div className="flex flex-col gap-2">
          {titel.length === 0 && (
            <p className="text-sm text-zinc-500">Noch keine Angebote.</p>
          )}
          {titel.map((a) => (
            <div key={a.id} className="kp-card flex flex-col gap-0.5">
              <span className="font-medium">{a.titel}</span>
              <span className="text-xs text-zinc-500">{KATEGORIE_LABEL[a.kategorie]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const angebote = await getAngeboteFuerUebersicht(user.id);
  const namen = await getAnzeigenamen(angebote.map((a) => a.user_id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Marktplatz</h1>
        <Link href="/marktplatz/neu" className="kp-btn-primary py-1.5">
          Angebot erstellen
        </Link>
      </div>
      <Rechtshinweis />
      <AngeboteListe angebote={angebote} aktuelleUserId={user.id} namen={namen} />
    </div>
  );
}
