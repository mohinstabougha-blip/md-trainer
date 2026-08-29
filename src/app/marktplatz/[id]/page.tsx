import { notFound } from "next/navigation";
import { Rechtshinweis } from "@/components/marktplatz/rechtshinweis";
import { NachrichtSenden } from "@/components/marktplatz/nachricht-senden";
import { Kommentare } from "@/components/marktplatz/kommentare";
import { MeldenButton } from "@/components/melden-button";
import { getAngebot, getKommentare, KATEGORIE_LABEL } from "@/lib/marktplatz";
import { getAnzeigenamen } from "@/lib/profile";
import { nutzerName } from "@/lib/pseudonym";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AngebotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const angebot = await getAngebot(Number(id));
  if (!angebot) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const kommentare = await getKommentare(angebot.id);
  const namen = await getAnzeigenamen([angebot.user_id, ...kommentare.map((k) => k.user_id)]);
  const istEigenes = user!.id === angebot.user_id;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs text-zinc-500">{KATEGORIE_LABEL[angebot.kategorie]}</span>
          <h1 className="text-xl font-semibold">{angebot.titel}</h1>
          <p className="text-sm text-zinc-500">
            von {nutzerName(angebot.user_id, namen, user!.id)}
            {angebot.preis && ` · ${angebot.preis}`}
            {angebot.status === "inaktiv" && " · inaktiv"}
          </p>
        </div>
        {!istEigenes && <MeldenButton inhaltTyp="angebot" inhaltId={angebot.id} />}
      </div>

      <Rechtshinweis />

      <p className="whitespace-pre-wrap text-sm leading-relaxed">{angebot.beschreibung}</p>

      {!istEigenes && <NachrichtSenden angebotId={angebot.id} anUserId={angebot.user_id} />}

      <hr className="border-zinc-100" />

      <Kommentare
        angebotId={angebot.id}
        kommentare={kommentare}
        aktuelleUserId={user!.id}
        namen={namen}
      />
    </div>
  );
}
