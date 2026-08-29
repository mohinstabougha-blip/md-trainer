-- Phase G (Erweiterung v5): Telegram-Import als zusätzliche Einreichungsquelle.
-- Telegram-Einreichungen haben keinen zugehörigen App-Nutzer, daher user_id nullable.

alter table einreichungen alter column user_id drop not null;

alter table einreichungen
  add column if not exists quelle_typ text not null default 'nutzer';

alter table einreichungen
  add constraint einreichungen_quelle_typ_check check (quelle_typ in ('nutzer', 'telegram'));

create index if not exists einreichungen_quelle_typ_idx on einreichungen (quelle_typ);
