import { FragenListe } from "@/components/admin/fragen-liste";
import { getAllQuestionsAdmin } from "@/lib/admin-data";

// Admin-Daten dürfen nicht zur Build-Zeit eingefroren werden.
export const dynamic = "force-dynamic";

export default async function AdminFragenPage() {
  const fragen = await getAllQuestionsAdmin();
  return <FragenListe fragen={fragen} />;
}
