-- Phase G Erweiterung 3: automatische Wartezeit-Meldungen aus Telegram.
-- user_id nullable, da Telegram-Meldungen keinen App-Nutzer haben (wie schon
-- bei einreichungen/questions). Der bestehende unique-Constraint auf user_id
-- bleibt unangetastet: Postgres erlaubt mehrere NULL-Werte in einer unique-
-- Spalte, blockiert also nicht mehrere Telegram-Meldungen.

alter table wartezeit_meldungen alter column user_id drop not null;

alter table wartezeit_meldungen
  add column if not exists quelle_typ text not null default 'nutzer';

alter table wartezeit_meldungen
  add constraint wartezeit_meldungen_quelle_typ_check check (quelle_typ in ('nutzer', 'telegram'));

create index if not exists wartezeit_meldungen_quelle_typ_idx on wartezeit_meldungen (quelle_typ);
