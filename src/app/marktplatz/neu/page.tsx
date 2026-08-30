import { redirect } from "next/navigation";
import { AngebotForm } from "@/components/marktplatz/angebot-form";
import { Rechtshinweis } from "@/components/marktplatz/rechtshinweis";
import { createClient } from "@/lib/supabase/server";

export default async function NeuesAngebotPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Neues Angebot</h1>
      <Rechtshinweis />
      <AngebotForm />
    </div>
  );
}
