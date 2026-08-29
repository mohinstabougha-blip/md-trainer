-- Phase G Erweiterung 2: Telegram-Fragen werden nicht mehr über die
-- einreichungen-Warteschlange freigegeben, sondern direkt live in questions
-- geschrieben. quelle_typ/pruefungszentrum ermöglichen nachträgliche Prüfung.

alter table questions
  add column if not exists quelle_typ text not null default 'nutzer';

alter table questions
  add constraint questions_quelle_typ_check check (quelle_typ in ('nutzer', 'telegram'));

alter table questions add column if not exists pruefungszentrum text;

create index if not exists questions_quelle_typ_idx on questions (quelle_typ);
