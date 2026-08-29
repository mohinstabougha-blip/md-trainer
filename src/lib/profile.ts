import { createClient } from "@/lib/supabase/server";

export async function getAnzeigenamen(userIds: string[]): Promise<Record<string, string>> {
  const eindeutig = [...new Set(userIds)];
  if (eindeutig.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile")
    .select("user_id, anzeigename")
    .in("user_id", eindeutig);
  if (error) throw error;

  const map: Record<string, string> = {};
  for (const row of data) map[row.user_id] = row.anzeigename;
  return map;
}

export async function getMeinAnzeigename(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile")
    .select("anzeigename")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.anzeigename ?? null;
}
