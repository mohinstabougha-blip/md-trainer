-- Einfaches Profilsystem: Anzeigename pro Nutzer, öffentlich lesbar, nur vom
-- Besitzer änderbar. Wird automatisch bei Registrierung angelegt (Trigger auf
-- auth.users), damit es unabhängig davon funktioniert, ob E-Mail-Bestätigung
-- an- oder ausgeschaltet ist.

create table if not exists profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  anzeigename text not null,
  erstellt_am timestamptz not null default now()
);

alter table profile enable row level security;

create policy "profile_select_all" on profile for select using (true);
create policy "profile_insert_own" on profile for insert with check (auth.uid() = user_id);
create policy "profile_update_own" on profile for update using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profile (user_id, anzeigename)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'anzeigename'), ''), split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
