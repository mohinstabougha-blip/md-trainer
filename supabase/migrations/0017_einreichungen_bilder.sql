-- Erlaubt das Hochladen von Frage-/Antwort-Bildern bereits in der
-- Freigabe-Warteschlange, bevor eine Einreichung nach questions übernommen wird.
alter table einreichungen
  add column if not exists bild_frage_url text;

alter table einreichungen
  add column if not exists bild_antwort_url text;
