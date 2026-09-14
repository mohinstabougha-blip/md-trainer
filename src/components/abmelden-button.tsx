"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AbmeldenButton({ className }: { className?: string }) {
  const router = useRouter();

  async function abmelden() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={abmelden}
      className={className ?? "text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"}
    >
      Abmelden
    </button>
  );
}
