import { MeldungenListe } from "@/components/admin/meldungen-liste";
import { getOffeneMeldungen } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminMeldungenPage() {
  const meldungen = await getOffeneMeldungen();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Meldungen</h1>
      <MeldungenListe meldungen={meldungen} />
    </div>
  );
}
