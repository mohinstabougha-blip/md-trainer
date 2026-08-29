export type EinreichungTyp = "einzelfrage" | "protokoll";
export type EinreichungStatus = "offen" | "freigegeben" | "abgelehnt";
export type EinreichungQuelle = "nutzer" | "telegram";

export const STATUS_LABEL: Record<EinreichungStatus, string> = {
  offen: "Offen",
  freigegeben: "Freigegeben",
  abgelehnt: "Abgelehnt",
};

export const QUELLE_LABEL: Record<EinreichungQuelle, string> = {
  nutzer: "Nutzer",
  telegram: "Telegram",
};

export type Einreichung = {
  id: number;
  user_id: string | null;
  typ: EinreichungTyp;
  modul: string | null;
  kurs: string | null;
  teil: number | null;
  frage: string | null;
  antwort_vorschlag: string | null;
  protokoll_text: string | null;
  hilfe_hinweis: string | null;
  bild_frage_url: string | null;
  bild_antwort_url: string | null;
  status: EinreichungStatus;
  admin_kommentar: string | null;
  quelle_typ: EinreichungQuelle;
  erstellt_am: string;
};
