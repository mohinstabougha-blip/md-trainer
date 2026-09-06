import { AppHeader } from "@/components/app-header";
import { FavoritenListe } from "@/components/favoriten-liste";
import { createClient } from "@/lib/supabase/server";
import { getUngeleseneNachrichtenAnzahl } from "@/lib/marktplatz";

export const dynamic = "force-dynamic";

export default async function FavoritenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ungelesen = user ? await getUngeleseneNachrichtenAnzahl(user.id) : 0;

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 sm:pb-0">
      <AppHeader
        email={user?.email ?? undefined}
        ungeleseneNachrichten={ungelesen}
        istGast={!user}
      />
      <main className="mx-auto max-w-2xl px-6 pt-6">
        <h1 className="text-xl font-semibold">Favoriten</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gemerkte Fragen – als Karteikarten neu lösen oder direkt mit Musterantwort ansehen.
        </p>
      </main>
      <FavoritenListe istGast={!user} />
    </div>
  );
}
