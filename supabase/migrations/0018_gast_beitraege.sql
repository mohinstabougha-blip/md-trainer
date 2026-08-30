-- Gast-Modus (Erweiterung v6): Nicht angemeldete Besucher dürfen zur Community
-- beitragen (Antwort-Kommentare, Einreichungen, Wartezeit-Meldungen). Die
-- Inserts laufen serverseitig über den Service-Role-Key NACH bestandener
-- Turnstile-Prüfung; user_id bleibt dann NULL.
--
-- einreichungen.user_id (0012) und wartezeit_meldungen.user_id (0014) sind
-- bereits nullable. Fehlt nur noch antwort_kommentare.

alter table antwort_kommentare alter column user_id drop not null;

-- Optionale Herkunftskennzeichnung, konsistent mit einreichungen/wartezeit.
alter table antwort_kommentare
  add column if not exists quelle_typ text not null default 'nutzer';

alter table antwort_kommentare
  drop constraint if exists antwort_kommentare_quelle_typ_check;
alter table antwort_kommentare
  add constraint antwort_kommentare_quelle_typ_check check (quelle_typ in ('nutzer', 'gast'));
