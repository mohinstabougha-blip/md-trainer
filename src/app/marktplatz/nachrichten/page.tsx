import Link from "next/link";
import { getKonversationen } from "@/lib/marktplatz";
import { getAnzeigenamen } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { nutzerName } from "@/lib/pseudonym";

export const dynamic = "force-dynamic";

export default async function NachrichtenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const konversationen = await getKonversationen(user!.id);
  const namen = await getAnzeigenamen(konversationen.map((k) => k.partnerId));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Nachrichten</h1>
      {konversationen.length === 0 && (
        <p className="text-sm text-zinc-500">Noch keine Nachrichten.</p>
      )}
      <div className="flex flex-col gap-2">
        {konversationen.map((k) => (
          <Link
            key={`${k.angebotId}-${k.partnerId}`}
            href={`/marktplatz/nachrichten/${k.angebotId}/${k.partnerId}`}
            className="kp-card flex items-center justify-between text-sm hover:bg-zinc-50"
          >
            <div>
              <p className="font-medium">{k.angebotTitel}</p>
              <p className="text-zinc-500">
                {k.letzteNachrichtVonMir ? "Du" : nutzerName(k.partnerId, namen, user!.id)}:{" "}
                {k.letzteNachricht}
              </p>
            </div>
            {k.ungelesen > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                {k.ungelesen}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
