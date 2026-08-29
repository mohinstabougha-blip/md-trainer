-- Ergänzt die Freigabe-Warteschlange um hilfe_hinweis, damit Strukturhilfen
-- aus Bulk-Importen (z.B. Radiologie-Fragen) nicht verloren gehen, wenn eine
-- Einreichung freigegeben und nach questions übernommen wird.
alter table einreichungen
  add column if not exists hilfe_hinweis text;
