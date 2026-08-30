import { redirect } from "next/navigation";
import { getKonversationsVerlauf } from "@/lib/marktplatz";
import { getAnzeigenamen } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { nutzerName } from "@/lib/pseudonym";
import { NachrichtenThread } from "@/components/marktplatz/nachrichten-thread";

export const dynamic = "force-dynamic";

export default async function KonversationPage({
  params,
}: {
  params: Promise<{ angebotId: string; partnerId: string }>;
}) {
  const { angebotId, partnerId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Eingehende Nachrichten dieser Konversation beim Öffnen als gelesen markieren.
  await supabase
    .from("angebot_nachrichten")
    .update({ gelesen: true })
    .eq("angebot_id", Number(angebotId))
    .eq("user_id_von", partnerId)
    .eq("user_id_an", user!.id)
    .eq("gelesen", false);

  const verlauf = await getKonversationsVerlauf(Number(angebotId), user!.id, partnerId);
  const namen = await getAnzeigenamen([partnerId]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">
        Konversation mit {nutzerName(partnerId, namen, user!.id)}
      </h1>
      <NachrichtenThread
        angebotId={Number(angebotId)}
        partnerId={partnerId}
        aktuelleUserId={user!.id}
        initial={verlauf}
      />
    </div>
  );
}
