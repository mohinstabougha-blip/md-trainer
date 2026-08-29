import { WartezeitMeldungenListe } from "@/components/admin/wartezeit-meldungen-liste";
import { getWartezeitMeldungenAdmin } from "@/lib/admin-data";

// Admin-Daten dürfen nicht zur Build-Zeit eingefroren werden.
export const dynamic = "force-dynamic";

export default async function AdminWartezeitPage() {
  const meldungen = await getWartezeitMeldungenAdmin();
  return <WartezeitMeldungenListe meldungen={meldungen} />;
}
