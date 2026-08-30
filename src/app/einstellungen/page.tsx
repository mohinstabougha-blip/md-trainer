import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { AbmeldenButton } from "@/components/abmelden-button";
import { EinstellungenForm } from "@/components/einstellungen-form";
import { createClient } from "@/lib/supabase/server";
import { getMeinAnzeigename } from "@/lib/profile";
import { getUngeleseneNachrichtenAnzahl } from "@/lib/marktplatz";

export const dynamic = "force-dynamic";

export default async function EinstellungenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [anzeigename, ungelesen] = await Promise.all([
    getMeinAnzeigename(user!.id),
    getUngeleseneNachrichtenAnzahl(user!.id),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 sm:pb-0">
      <AppHeader email={user!.email!} ungeleseneNachrichten={ungelesen} />
      <main className="mx-auto max-w-md p-6">
        <div className="flex flex-col gap-6">
          <h1 className="text-xl font-semibold">Einstellungen</h1>
          <EinstellungenForm initialAnzeigename={anzeigename ?? ""} />
          <div className="kp-card flex flex-col gap-2">
            <h2 className="text-sm font-medium text-zinc-500">Mehr</h2>
            <Link href="/einreichen" className="text-sm text-accent hover:underline">
              Frage einreichen
            </Link>
            <Link href="/about" className="text-sm text-accent hover:underline">
              Über KP Baden
            </Link>
          </div>
          <AbmeldenButton className="w-fit text-sm text-red-600 hover:underline sm:hidden" />
        </div>
      </main>
    </div>
  );
}
