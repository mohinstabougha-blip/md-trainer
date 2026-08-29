import { createAdminClient } from "@/lib/supabase/admin";
import type { Einreichung } from "@/lib/einreichungen-types";

export type QuestionQuelleTyp = "nutzer" | "telegram";

export type AdminQuestion = {
  id: number;
  modul: string;
  kurs: string;
  teil: number;
  frage: string;
  musterantwort: string;
  bild_frage_url: string | null;
  bild_antwort_url: string | null;
  quelle: string | null;
  haeufigkeit: number;
  hilfe_hinweis: string | null;
  quelle_typ: QuestionQuelleTyp;
  pruefungszentrum: string | null;
  erstellt_am: string;
  geprueft: boolean;
};

const ADMIN_QUESTION_SELECT =
  "id, modul, kurs, teil, frage, musterantwort, bild_frage_url, bild_antwort_url, quelle, haeufigkeit, hilfe_hinweis, quelle_typ, pruefungszentrum, erstellt_am, geprueft";

export async function getAllQuestionsAdmin(): Promise<AdminQuestion[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("questions")
    .select(ADMIN_QUESTION_SELECT)
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getQuestionByIdAdmin(id: number): Promise<AdminQuestion | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("questions")
    .select(ADMIN_QUESTION_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type OffenerFeedbackEintrag = {
  id: number;
  typ: string;
  kommentar: string | null;
  erstellt_am: string;
};

export type FeedbackGruppe = {
  questionId: number;
  frage: string;
  modul: string;
  kurs: string;
  eintraege: OffenerFeedbackEintrag[];
};

export async function getOffenesFeedbackGruppiert(): Promise<FeedbackGruppe[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("id, typ, kommentar, erstellt_am, question_id, questions(frage, modul, kurs)")
    .eq("status", "offen")
    .order("erstellt_am", { ascending: false });
  if (error) throw error;

  const gruppen = new Map<number, FeedbackGruppe>();
  for (const row of data as unknown as (OffenerFeedbackEintrag & {
    question_id: number;
    questions: { frage: string; modul: string; kurs: string } | null;
  })[]) {
    if (!row.questions) continue;
    const bestehend = gruppen.get(row.question_id);
    const eintrag = { id: row.id, typ: row.typ, kommentar: row.kommentar, erstellt_am: row.erstellt_am };
    if (bestehend) {
      bestehend.eintraege.push(eintrag);
    } else {
      gruppen.set(row.question_id, {
        questionId: row.question_id,
        frage: row.questions.frage,
        modul: row.questions.modul,
        kurs: row.questions.kurs,
        eintraege: [eintrag],
      });
    }
  }

  return [...gruppen.values()].sort((a, b) => b.eintraege.length - a.eintraege.length);
}

export type MeldeTyp = "angebot" | "nachricht" | "kommentar" | "antwort_kommentar";

export type Meldung = {
  id: number;
  inhaltTyp: MeldeTyp;
  inhaltId: number;
  gemeldetVon: string;
  grund: string;
  kommentar: string | null;
  erstelltAm: string;
  inhaltVorschau: string;
  inhaltExistiert: boolean;
};

const MELDE_TABELLE: Record<MeldeTyp, { name: string; spalte: string }> = {
  angebot: { name: "angebote", spalte: "titel" },
  nachricht: { name: "angebot_nachrichten", spalte: "text" },
  kommentar: { name: "angebot_kommentare", spalte: "text" },
  antwort_kommentar: { name: "antwort_kommentare", spalte: "text" },
};

/** Offene Meldungen für den Admin-Tab, mit einer Textvorschau des gemeldeten Inhalts.
 *  Läuft über den Service-Role-Client, sieht also auch bereits verborgene Inhalte. */
export async function getOffeneMeldungen(): Promise<Meldung[]> {
  const supabase = createAdminClient();
  const { data: meldungen, error } = await supabase
    .from("meldungen")
    .select("*")
    .eq("status", "offen")
    .order("erstellt_am", { ascending: false });
  if (error) throw error;

  const ergebnisse: Meldung[] = [];
  for (const m of meldungen) {
    const { name, spalte } = MELDE_TABELLE[m.inhalt_typ as MeldeTyp];
    const { data: inhalt } = await supabase
      .from(name)
      .select("*")
      .eq("id", m.inhalt_id)
      .maybeSingle();
    const inhaltRow = inhalt as unknown as Record<string, unknown> | null;

    ergebnisse.push({
      id: m.id,
      inhaltTyp: m.inhalt_typ,
      inhaltId: m.inhalt_id,
      gemeldetVon: m.gemeldet_von,
      grund: m.grund,
      kommentar: m.kommentar,
      erstelltAm: m.erstellt_am,
      inhaltVorschau: inhaltRow ? String(inhaltRow[spalte]) : "(Inhalt gelöscht)",
      inhaltExistiert: !!inhaltRow,
    });
  }

  return ergebnisse;
}

export async function getOffeneEinreichungen(): Promise<Einreichung[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("einreichungen")
    .select("*")
    .eq("status", "offen")
    .order("erstellt_am", { ascending: false });
  if (error) throw error;
  return data;
}

export type WartezeitQuelleTyp = "nutzer" | "telegram";

export type WartezeitMeldungAdmin = {
  id: number;
  user_id: string | null;
  antrag_datum: string;
  rechnung_erhalten: boolean;
  rechnung_datum: string | null;
  termin_erhalten: boolean;
  pruefungsdatum: string | null;
  quelle_typ: WartezeitQuelleTyp;
  erstellt_am: string;
};

export async function getWartezeitMeldungenAdmin(): Promise<WartezeitMeldungAdmin[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wartezeit_meldungen")
    .select(
      "id, user_id, antrag_datum, rechnung_erhalten, rechnung_datum, termin_erhalten, pruefungsdatum, quelle_typ, erstellt_am"
    )
    .order("erstellt_am", { ascending: false });
  if (error) throw error;
  return data;
}
