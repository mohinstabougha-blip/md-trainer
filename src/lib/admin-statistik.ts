import { createAdminClient } from "@/lib/supabase/admin";

// Kennzahlen für den Adminbereich. Service-Role -> umgeht RLS.
// Hinweis: nicht angemeldete Besucher ("Gäste") entstehen ohne Konto und ohne
// Session-Zeile und sind hier daher NICHT enthalten – dafür Vercel Web Analytics.

export type Zeitreihe = { heute: number; sieben: number; dreissig: number; gesamt: number };

export type AdminStatistik = {
  registrierungen: Zeitreihe;
  aktiveNutzer: Omit<Zeitreihe, "gesamt">; // eindeutige angemeldete Nutzer mit Session
  sessions: Zeitreihe;
  sessionsAbgeschlossen: Zeitreihe;
  beantworteteFragen: Zeitreihe;
  offeneEinreichungen: number;
  standIso: string;
};

/** Beginn des Tages vor `tageZurueck` Tagen in Europe/Berlin, als echte UTC-Zeit.
 *  DST-sicher, weil die Berliner Wanduhr aus dem aktuellen Datum abgeleitet wird. */
function berlinTagStart(tageZurueck = 0): Date {
  const jetzt = Date.now();
  const berlinAlsLokal = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" })
  ).getTime();
  const versatz = jetzt - berlinAlsLokal;
  const b = new Date(berlinAlsLokal);
  b.setHours(0, 0, 0, 0);
  b.setDate(b.getDate() - tageZurueck);
  return new Date(b.getTime() + versatz);
}

function zaehleNach(zeitpunkte: number[], grenzen: { heute: number; sieben: number; dreissig: number }) {
  let heute = 0;
  let sieben = 0;
  let dreissig = 0;
  for (const t of zeitpunkte) {
    if (t >= grenzen.dreissig) dreissig++;
    if (t >= grenzen.sieben) sieben++;
    if (t >= grenzen.heute) heute++;
  }
  return { heute, sieben, dreissig, gesamt: zeitpunkte.length };
}

export async function getAdminStatistik(): Promise<AdminStatistik> {
  const supabase = createAdminClient();

  const grenzen = {
    heute: berlinTagStart(0).getTime(),
    sieben: berlinTagStart(6).getTime(),
    dreissig: berlinTagStart(29).getTime(),
  };
  const seit30Iso = new Date(grenzen.dreissig).toISOString();

  const [profileRes, sessionsRes, resultsRes, einreichungenOffen, profileGesamt, sessionsGesamt, resultsGesamt] =
    await Promise.all([
      supabase.from("profile").select("erstellt_am").gte("erstellt_am", seit30Iso),
      supabase
        .from("sessions")
        .select("user_id, gestartet_am, status")
        .gte("gestartet_am", seit30Iso),
      supabase.from("results").select("erstellt_am").gte("erstellt_am", seit30Iso),
      supabase.from("einreichungen").select("*", { count: "exact", head: true }).eq("status", "offen"),
      supabase.from("profile").select("*", { count: "exact", head: true }),
      supabase.from("sessions").select("*", { count: "exact", head: true }),
      supabase.from("results").select("*", { count: "exact", head: true }),
    ]);

  for (const r of [profileRes, sessionsRes, resultsRes]) {
    if (r.error) throw r.error;
  }

  const profileZeiten = (profileRes.data ?? []).map((r) => Date.parse(r.erstellt_am));
  const registrierungen = {
    ...zaehleNach(profileZeiten, grenzen),
    gesamt: profileGesamt.count ?? profileZeiten.length,
  };

  const sessionRows = sessionsRes.data ?? [];
  const sessionZeiten = sessionRows.map((r) => Date.parse(r.gestartet_am));
  const sessions = {
    ...zaehleNach(sessionZeiten, grenzen),
    gesamt: sessionsGesamt.count ?? sessionZeiten.length,
  };
  const abgeschlossenZeiten = sessionRows
    .filter((r) => r.status === "abgeschlossen")
    .map((r) => Date.parse(r.gestartet_am));
  const sessionsAbgeschlossen = {
    ...zaehleNach(abgeschlossenZeiten, grenzen),
    gesamt: abgeschlossenZeiten.length,
  };

  // eindeutige angemeldete Nutzer mit mindestens einer Session je Fenster
  const aktivHeute = new Set<string>();
  const aktivSieben = new Set<string>();
  const aktivDreissig = new Set<string>();
  for (const r of sessionRows) {
    const t = Date.parse(r.gestartet_am);
    if (t >= grenzen.dreissig) aktivDreissig.add(r.user_id);
    if (t >= grenzen.sieben) aktivSieben.add(r.user_id);
    if (t >= grenzen.heute) aktivHeute.add(r.user_id);
  }

  const resultZeiten = (resultsRes.data ?? []).map((r) => Date.parse(r.erstellt_am));
  const beantworteteFragen = {
    ...zaehleNach(resultZeiten, grenzen),
    gesamt: resultsGesamt.count ?? resultZeiten.length,
  };

  return {
    registrierungen,
    aktiveNutzer: {
      heute: aktivHeute.size,
      sieben: aktivSieben.size,
      dreissig: aktivDreissig.size,
    },
    sessions,
    sessionsAbgeschlossen,
    beantworteteFragen,
    offeneEinreichungen: einreichungenOffen.count ?? 0,
    standIso: new Date().toISOString(),
  };
}

// ── Nutzerliste ─────────────────────────────────────────────────────────────

export type NutzerZeile = {
  userId: string;
  email: string | null;
  anzeigename: string | null;
  registriertAm: string; // ISO
  sessions: number;
  sessionsAbgeschlossen: number;
  beantworteteFragen: number;
  module: string[]; // geübte Module, alphabetisch
};

/** Alle registrierten Nutzer mit Aktivitätskennzahlen (nur Adminbereich). */
export async function getNutzerListe(): Promise<NutzerZeile[]> {
  const supabase = createAdminClient();

  // auth.users durchpaginieren
  const users: { id: string; email: string | null; created_at: string }[] = [];
  const perPage = 200;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    for (const u of data.users) {
      users.push({ id: u.id, email: u.email ?? null, created_at: u.created_at });
    }
    if (data.users.length < perPage) break;
  }

  const [profileRes, sessionsRes, resultsRes, questionsRes] = await Promise.all([
    supabase.from("profile").select("user_id, anzeigename"),
    supabase.from("sessions").select("user_id, status"),
    supabase.from("results").select("user_id, question_id"),
    supabase.from("questions").select("id, modul"),
  ]);
  for (const r of [profileRes, sessionsRes, resultsRes, questionsRes]) {
    if (r.error) throw r.error;
  }

  const anzeigename = new Map<string, string>();
  for (const p of profileRes.data ?? []) anzeigename.set(p.user_id, p.anzeigename);

  const modulVonFrage = new Map<number, string>();
  for (const q of questionsRes.data ?? []) modulVonFrage.set(q.id, q.modul);

  type Agg = { s: number; sa: number; f: number; module: Set<string> };
  const proNutzer = new Map<string, Agg>();
  const agg = (id: string): Agg => {
    let x = proNutzer.get(id);
    if (!x) {
      x = { s: 0, sa: 0, f: 0, module: new Set() };
      proNutzer.set(id, x);
    }
    return x;
  };
  for (const se of sessionsRes.data ?? []) {
    const x = agg(se.user_id);
    x.s++;
    if (se.status === "abgeschlossen") x.sa++;
  }
  for (const re of resultsRes.data ?? []) {
    const x = agg(re.user_id);
    x.f++;
    const m = modulVonFrage.get(re.question_id);
    if (m) x.module.add(m);
  }

  return users
    .map((u) => {
      const x = proNutzer.get(u.id);
      return {
        userId: u.id,
        email: u.email,
        anzeigename: anzeigename.get(u.id) ?? null,
        registriertAm: u.created_at,
        sessions: x?.s ?? 0,
        sessionsAbgeschlossen: x?.sa ?? 0,
        beantworteteFragen: x?.f ?? 0,
        module: x ? [...x.module].sort((a, b) => a.localeCompare(b, "de")) : [],
      };
    })
    .sort((a, b) => Date.parse(b.registriertAm) - Date.parse(a.registriertAm));
}
