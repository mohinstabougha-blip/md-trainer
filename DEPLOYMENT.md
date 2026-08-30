# KP Baden – Veröffentlichung unter kpbaden.com

Diese Anleitung bringt die App produktiv ins Netz. Empfohlener Stack:
**Vercel** (Hosting/Build) + **Supabase** (Datenbank & Login) + **Cloudflare Turnstile** (Bot-Schutz).
Alle drei haben ausreichende kostenlose Kontingente für ein kleines Community-Projekt.
Domain: **kpbaden.com** (bei Namecheap registriert).

---

## 1. Supabase-Projekt einrichten

1. Konto auf [supabase.com](https://supabase.com) anlegen, **New project** – Region **EU (z.B. Frankfurt)** wählen.
2. Unter **Project Settings → API** notieren:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (geheim, nur serverseitig)
3. **Datenbankschema anlegen:** im **SQL Editor** die Migrationen aus `supabase/migrations/` in
   der Reihenfolge der Dateinamen (`0001_…` bis `0018_…`) nacheinander ausführen.
   `0018` schaltet Gast-Beiträge frei (Antwort-Kommentare ohne Anmeldung).
4. **Auth → Providers:** E-Mail aktivieren. E-Mail-Bestätigung nach Wunsch an/aus.
5. **Auth → Attack Protection → CAPTCHA protection:** Provider **Turnstile** aktivieren und den
   Turnstile-**Secret Key** (siehe Schritt 3) hier eintragen – damit prüft auch Supabase die
   Anmeldungen serverseitig.
6. **Auth → URL Configuration:** `Site URL` auf `https://kpbaden.com` setzen,
   Redirect-URLs entsprechend ergänzen (`https://kpbaden.com/**`).

## 2. Cloudflare Turnstile

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile** → **Add widget**.
2. Hostnames eintragen: `kpbaden.com`, `www.kpbaden.com` und für Vorschau-Deployments
   `*.vercel.app` sowie `localhost` (für lokale Entwicklung).
3. Ergebnis:
   - **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - **Secret Key** → `TURNSTILE_SECRET_KEY` (auch in Supabase eintragen, s.o.)

## 3. Fragen importieren (optional)

Lokal mit gesetzter `.env.local`:

```bash
npm run import:questions          # aus KP_Trainer_Fragen_Datenbank.xlsx
node scripts/import-einreichungen.mjs <datei.xlsx>   # weitere als Einreichungen
```

## 4. Vercel-Deployment

1. Repository zu GitHub/GitLab pushen.
2. Auf [vercel.com](https://vercel.com) **Add New… → Project** → Repo importieren.
   Framework wird als **Next.js** erkannt, Build-Command `next build`, keine Anpassung nötig.
3. **Environment Variables** setzen (Production **und** Preview) – Werte aus `.env.example`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `ADMIN_PASSWORD`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`,
   `NEXT_PUBLIC_SITE_URL` (= `https://kpbaden.com`).
4. **Deploy**.

## 5. Domain kpbaden.com (Namecheap) mit Vercel verbinden

1. In Vercel: **Project → Settings → Domains → Add** → `kpbaden.com` hinzufügen,
   danach nochmal `www.kpbaden.com` (Vercel richtet `www` → apex als Redirect ein).
   Vercel zeigt jetzt die benötigten DNS-Werte an – im Zweifel die aus dem Dialog nehmen.
2. Namecheap: **Dashboard → Domain List → Manage** bei `kpbaden.com` → Tab **Advanced DNS**.
3. Unter **Host Records** die von Namecheap vorbelegten Parking-Einträge löschen
   (der `CNAME`-Eintrag `www → parkingpage.namecheap.com` und ein evtl. `URL Redirect`
   auf `@`). Dann **Add New Record**:
   - `A Record` · Host `@` · Value `76.76.21.21` · TTL `Automatic`
   - `CNAME Record` · Host `www` · Value `cname.vercel-dns.com` · TTL `Automatic`
   (Tab **Domain** muss auf **Namecheap BasicDNS** stehen – nicht auf Custom DNS.)
4. Speichern (grüner Haken). DNS-Verbreitung dauert i.d.R. Minuten bis ~1 Stunde.
   In Vercel wird der Status dann **Valid Configuration**; das TLS-Zertifikat stellt
   Vercel automatisch aus.
5. `NEXT_PUBLIC_SITE_URL` in Vercel auf `https://kpbaden.com` setzen (falls noch nicht)
   und **Redeploy** auslösen, damit Metadaten/OpenGraph die finale Domain nutzen.

## 6. Nach dem Go-Live prüfen

- [ ] `/impressum` und `/datenschutz` öffnen – **alle `[Platzhalter]` durch echte Angaben ersetzen**
      (Impressum ist in DE Pflicht; ohne korrekte Angaben drohen Abmahnungen).
- [ ] Registrierung, Login, Logout, eine Trainings-Session, ein Kommentar, eine Einreichung testen.
- [ ] **Gast-Modus** (nicht angemeldet): Startseite, Training inkl. Selbstbewertung (bleibt nur im
      Browser), Antwort-Kommentar, Einreichung und Wartezeit-Meldung möglich; Marktplatz zeigt nur
      Titel; `/einstellungen`, `/marktplatz/neu`, `/marktplatz/nachrichten` leiten auf `/login`.
- [ ] Admin-Login unter `/kp-team-anmeldung` testen.
- [ ] In einem Formular absichtlich das Turnstile-Feld ignorieren → Absenden muss blockiert sein
      (Server antwortet 403, sobald `TURNSTILE_SECRET_KEY` gesetzt ist).
- [ ] `robots.txt` unter `https://kpbaden.com/robots.txt` erreichbar.
- [ ] Supabase: Row Level Security aktiv (die Migrationen setzen sie), `service_role`-Key
      nirgends im Client-Bundle.

## 7. Betrieb

- **Backups:** Supabase erstellt automatische Backups (Aufbewahrung je nach Plan) – bei
  wichtigem Datenbestand kostenpflichtigen Plan oder regelmäßigen `pg_dump` einrichten.
- **Kostenkontrolle:** Free-Tier-Limits von Supabase/Vercel im Blick behalten.
- **Updates:** Abhängigkeiten regelmäßig aktualisieren (`npm outdated`), `npm run lint` und
  `npx tsc --noEmit` vor jedem Deploy.
