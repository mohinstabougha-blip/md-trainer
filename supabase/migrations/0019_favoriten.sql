-- Erweiterung v7: Favoriten. Angemeldete Nutzer können einzelne Fragen
-- markieren und später gezielt wiederholen. Gäste speichern ihre Favoriten
-- ausschließlich im localStorage (kein Server-Eintrag).

create table if not exists favoriten (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id bigint not null references questions (id) on delete cascade,
  erstellt_am timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists favoriten_user_idx on favoriten (user_id, erstellt_am desc);

alter table favoriten enable row level security;

create policy "favoriten_select_own" on favoriten
  for select using (auth.uid() = user_id);

create policy "favoriten_insert_own" on favoriten
  for insert with check (auth.uid() = user_id);

create policy "favoriten_delete_own" on favoriten
  for delete using (auth.uid() = user_id);
