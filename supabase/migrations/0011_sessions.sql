-- Phase E (Erweiterung v3): E2 Alle Sessions speichern (auch abgebrochene).
-- Kein FK von results.session_id hierher: results existierte schon vor dieser
-- Tabelle, alte Zeilen hätten keine passende sessions-Zeile.

do $$ begin
  create type session_status as enum ('laufend', 'abgeschlossen', 'abgebrochen');
exception
  when duplicate_object then null;
end $$;

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  modus text not null,
  filter_werte jsonb,
  gestartet_am timestamptz not null default now(),
  beendet_am timestamptz,
  status session_status not null default 'laufend'
);

create index if not exists sessions_user_idx on sessions (user_id);

alter table sessions enable row level security;

create policy "sessions_select_own" on sessions
  for select using (auth.uid() = user_id);

create policy "sessions_insert_own" on sessions
  for insert with check (auth.uid() = user_id);

create policy "sessions_update_own" on sessions
  for update using (auth.uid() = user_id);
