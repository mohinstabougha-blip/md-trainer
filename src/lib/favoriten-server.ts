import { createClient } from "@/lib/supabase/server";

/** Favoriten-Frage-IDs des angemeldeten Nutzers, zuletzt hinzugefügte zuerst. */
export async function getFavoritenIds(userId: string): Promise<number[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favoriten")
    .select("question_id")
    .eq("user_id", userId)
    .order("erstellt_am", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => r.question_id as number);
}
