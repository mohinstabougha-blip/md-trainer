import { createClient } from "@/lib/supabase/server";
import type { Einreichung } from "@/lib/einreichungen-types";

export async function getMeineEinreichungen(userId: string): Promise<Einreichung[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("einreichungen")
    .select("*")
    .eq("user_id", userId)
    .order("erstellt_am", { ascending: false });
  if (error) throw error;
  return data;
}
