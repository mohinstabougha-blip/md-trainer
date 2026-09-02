import { EinreichungenListe } from "@/components/admin/einreichungen-liste";
import {
  getOffeneEinreichungen,
  getAlleModulnamen,
  getFragenFuerDuplikatCheck,
} from "@/lib/admin-data";
import { findeDuplikate } from "@/lib/duplikat-check";
import { getAnzeigenamen } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function AdminEinreichungenPage() {
  const [einreichungen, alleModule, bestehendeFragen] = await Promise.all([
    getOffeneEinreichungen(),
    getAlleModulnamen(),
    getFragenFuerDuplikatCheck(),
  ]);
  const userIds = einreichungen
    .map((e) => e.user_id)
    .filter((id): id is string => id !== null);
  const namen = await getAnzeigenamen(userIds);

  const duplikate = findeDuplikate(einreichungen, bestehendeFragen);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Einreichungen</h1>
      <EinreichungenListe
        einreichungen={einreichungen}
        namen={namen}
        alleModule={alleModule}
        duplikate={duplikate}
      />
    </div>
  );
}
