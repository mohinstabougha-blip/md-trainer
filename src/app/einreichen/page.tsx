import { AppHeader } from "@/components/app-header";
import { EinreichungForm } from "@/components/einreichung-form";
import { MeineEinreichungen } from "@/components/meine-einreichungen";
import { createClient } from "@/lib/supabase/server";
import { getMeineEinreichungen } from "@/lib/einreichungen";
import { getUngeleseneNachrichtenAnzahl } from "@/lib/marktplatz";

export const dynamic = "force-dynamic";

export default async function EinreichenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [einreichungen, ungelesen] = await Promise.all([
    user ? getMeineEinreichungen(user.id) : Promise.resolve([]),
    user ? getUngeleseneNachrichtenAnzahl(user.id) : Promise.resolve(0),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 sm:pb-0">
      <AppHeader
        email={user?.email ?? undefined}
        ungeleseneNachrichten={ungelesen}
        istGast={!user}
      />
      <main className="mx-auto max-w-2xl p-6">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-semibold">Frage oder Protokoll einreichen</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Deine Einreichung landet nicht direkt in der Fragendatenbank, sondern wird erst nach
              Prüfung freigegeben.
              {!user && " Du kannst auch als Gast einreichen."}
            </p>
          </div>
          <EinreichungForm />
          {user && <MeineEinreichungen einreichungen={einreichungen} />}
        </div>
      </main>
    </div>
  );
}
