-- Der Import hat IDs explizit gesetzt, daher zählt die Identity-Sequenz
-- noch nicht mit. Sonst würde die erste im Admin-Bereich neu angelegte
-- Frage versuchen, id=1 zu vergeben und mit einer bestehenden Zeile kollidieren.
select setval(
  pg_get_serial_sequence('questions', 'id'),
  (select max(id) from questions)
);
