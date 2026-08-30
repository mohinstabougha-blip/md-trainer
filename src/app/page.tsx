import Link from "next/link";
import { StartScreen } from "@/components/start-screen";
import { AppHeader } from "@/components/app-header";
import { WartezeitBadge } from "@/components/wartezeit-bereich";
import { FortschrittUebersicht } from "@/components/fortschritt-uebersicht";
import { getAlleFragenMeta } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";
import {
  getWartezeitDurchschnitt,
  getWartezeitVerlauf,
  formatiereWartezeitBadge,
} from "@/lib/wartezeit";
import { getUngeleseneNachrichtenAnzahl } from "@/lib/marktplatz";
import { getFortschrittProModul, getMeineLetzteBewertungen } from "@/lib/fortschritt";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const istGast = !user;

  const [
    fragenMeta,
    wartezeitDurchschnitt,
    wartezeitVerlauf,
    meineMeldungResult,
    ungeleseneNachrichten,
    modulFortschritt,
    meineBewertungen,
  ] = await Promise.all([
    getAlleFragenMeta(),
    getWartezeitDurchschnitt(),
    getWartezeitVerlauf(),
    user
      ? supabase.from("wartezeit_meldungen").select("*").eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user ? getUngeleseneNachrichtenAnzahl(user.id) : Promise.resolve(0),
    user ? getFortschrittProModul(user.id) : Promise.resolve([]),
    user ? getMeineLetzteBewertungen(user.id) : Promise.resolve({}),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-20 sm:pb-0">
      <AppHeader
        email={user?.email ?? undefined}
        ungeleseneNachrichten={ungeleseneNachrichten}
        istGast={istGast}
      />

      <div className="mx-auto flex w-full max-w-xl items-center justify-between px-6 pt-4">
        <Link
          href="/einreichen"
          aria-label="Frage oder Protokoll einreichen"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-medium leading-none text-accent shadow-sm"
        >
          +
        </Link>
        <WartezeitBadge
          badgeText={formatiereWartezeitBadge(wartezeitDurchschnitt)}
          verlauf={wartezeitVerlauf}
          initial={meineMeldungResult.data}
          istGast={istGast}
        />
      </div>

      <div className="mx-auto w-full max-w-xl pt-4">
        <FortschrittUebersicht
          stats={modulFortschritt}
          istGast={istGast}
          alleFragen={fragenMeta}
        />
      </div>

      <StartScreen
        fragenMeta={fragenMeta}
        meineBewertungen={meineBewertungen}
        istGast={istGast}
      />
    </div>
  );
}
