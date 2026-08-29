-- Phase A (Erweiterung v2): A1 (Sortierung nach Häufigkeit) + A2 (Hilfe-Button)
alter table questions add column if not exists haeufigkeit int not null default 1;
alter table questions add column if not exists hilfe_hinweis text;
