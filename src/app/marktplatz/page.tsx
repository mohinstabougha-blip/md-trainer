import Link from "next/link";
import { AngeboteListe } from "@/components/marktplatz/angebote-liste";
import { Rechtshinweis } from "@/components/marktplatz/rechtshinweis";
import { getAngeboteFuerUebersicht } from "@/lib/marktplatz";
import { getAnzeigenamen } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MarktplatzPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const angebote = await getAngeboteFuerUebersicht(user!.id);
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
      <AngeboteListe angebote={angebote} aktuelleUserId={user!.id} namen={namen} />
    </div>
  );
}
