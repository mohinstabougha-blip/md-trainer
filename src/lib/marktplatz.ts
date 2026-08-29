import { createClient } from "@/lib/supabase/server";
import type { Angebot, Kommentar, Nachricht } from "@/lib/marktplatz-types";

export type { AngebotKategorie, AngebotStatus, Angebot, Kommentar, Nachricht } from "@/lib/marktplatz-types";
export { KATEGORIE_LABEL } from "@/lib/marktplatz-types";

/** Aktive Angebote aller Nutzer + die eigenen (auch inaktive, zur Verwaltung). */
export async function getAngeboteFuerUebersicht(userId: string): Promise<Angebot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("angebote")
    .select("*")
    .or(`status.eq.aktiv,user_id.eq.${userId}`)
    .order("erstellt_am", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAngebot(id: number): Promise<Angebot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("angebote").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getKommentare(angebotId: number): Promise<Kommentar[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("angebot_kommentare")
    .select("*")
    .eq("angebot_id", angebotId)
    .order("erstellt_am", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getUngeleseneNachrichtenAnzahl(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("angebot_nachrichten")
    .select("*", { count: "exact", head: true })
    .eq("user_id_an", userId)
    .eq("gelesen", false);
  if (error) throw error;
  return count ?? 0;
}

export type Konversation = {
  angebotId: number;
  angebotTitel: string;
  partnerId: string;
  letzteNachricht: string;
  letzteNachrichtVonMir: boolean;
  letzteNachrichtAm: string;
  ungelesen: number;
};

/** Konversationen (gruppiert nach Angebot + Gesprächspartner) für die Postfach-Übersicht. */
export async function getKonversationen(userId: string): Promise<Konversation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("angebot_nachrichten")
    .select("*, angebote(titel)")
    .or(`user_id_von.eq.${userId},user_id_an.eq.${userId}`)
    .order("erstellt_am", { ascending: false });
  if (error) throw error;

  const rows = data as unknown as (Nachricht & { angebote: { titel: string } | null })[];
  const gruppen = new Map<string, Konversation>();

  for (const row of rows) {
    const partnerId = row.user_id_von === userId ? row.user_id_an : row.user_id_von;
    const key = `${row.angebot_id}::${partnerId}`;
    const bestehend = gruppen.get(key);
    const istUngelesen = row.user_id_an === userId && !row.gelesen;

    if (!bestehend) {
      gruppen.set(key, {
        angebotId: row.angebot_id,
        angebotTitel: row.angebote?.titel ?? "(gelöschtes Angebot)",
        partnerId,
        letzteNachricht: row.text,
        letzteNachrichtVonMir: row.user_id_von === userId,
        letzteNachrichtAm: row.erstellt_am,
        ungelesen: istUngelesen ? 1 : 0,
      });
    } else if (istUngelesen) {
      bestehend.ungelesen += 1;
    }
  }

  return [...gruppen.values()].sort(
    (a, b) => new Date(b.letzteNachrichtAm).getTime() - new Date(a.letzteNachrichtAm).getTime()
  );
}

export async function getKonversationsVerlauf(
  angebotId: number,
  userId: string,
  partnerId: string
): Promise<Nachricht[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("angebot_nachrichten")
    .select("*")
    .eq("angebot_id", angebotId)
    .or(
      `and(user_id_von.eq.${userId},user_id_an.eq.${partnerId}),and(user_id_von.eq.${partnerId},user_id_an.eq.${userId})`
    )
    .order("erstellt_am", { ascending: true });
  if (error) throw error;
  return data;
}
