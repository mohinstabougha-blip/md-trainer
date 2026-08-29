import { AppHeader } from "@/components/app-header";
import { createClient } from "@/lib/supabase/server";
import { getUngeleseneNachrichtenAnzahl } from "@/lib/marktplatz";

export default async function MarktplatzLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ungelesen = user ? await getUngeleseneNachrichtenAnzahl(user.id) : 0;

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 sm:pb-0">
      {user?.email && <AppHeader email={user.email} ungeleseneNachrichten={ungelesen} />}
      <main className="mx-auto max-w-2xl p-6">{children}</main>
    </div>
  );
}
