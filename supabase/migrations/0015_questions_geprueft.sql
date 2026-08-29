-- Fügt ein Flag hinzu, mit dem im Admin-Bereich markiert werden kann, ob eine
-- Frage bereits inhaltlich geprüft wurde (z.B. nach Telegram-Import).
alter table questions
  add column if not exists geprueft boolean not null default false;

create index if not exists questions_geprueft_idx on questions (geprueft);
