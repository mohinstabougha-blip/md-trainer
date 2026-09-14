import { cookies } from "next/headers";
import { QuestionRunner } from "@/components/question-runner";
import {
  getSessionQuestions,
  type FortschrittFilter,
  type ModulKurs,
  type SessionFilter,
  type Sortierung,
  type Teil,
} from "@/lib/questions";
import { getUngeleseneNachrichtenAnzahl } from "@/lib/marktplatz";
import { getFavoritenIds } from "@/lib/favoriten-server";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";

type SearchParams = { [key: string]: string | string[] | undefined };

function parseFilter(params: SearchParams): SessionFilter {
  const modus = String(params.modus ?? "zufaellig");
  if (modus === "modul") {
    const moduleListe = params.module ? String(params.module).split(",").filter(Boolean) : [];
    return { modus: "modul", module: moduleListe };
  }
  if (modus === "kurs") {
    return {
      modus: "kurs",
      modul: String(params.modul ?? ""),
      kurs: String(params.kurs ?? ""),
    };
  }
  if (modus === "kurse") {
    let kurse: ModulKurs[] = [];
    try {
      kurse = JSON.parse(String(params.kurse ?? "[]"));
    } catch {
      kurse = [];
    }
    return { modus: "kurse", kurse };
  }
  if (modus === "ids") {
    const ids = String(params.ids ?? "")
      .split(",")
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n));
    return { modus: "ids", ids };
  }
  return { modus: "zufaellig" };
}

/** Baut die URL, mit der genau dieser Lauf fortgesetzt werden kann. */
function baueResumeHref(params: SearchParams): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === "resume" || v == null) continue;
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, x));
    else usp.set(k, v);
  }
  usp.set("resume", "1");
  return `/session?${usp.toString()}`;
}

export default async function SessionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filter = parseFilter(params);
  const teil = (params.teil ? String(params.teil) : "voll") as Teil;
  const sortierung = (params.sortierung ? String(params.sortierung) : "zufaellig") as Sortierung;
  const fortschrittFilter = (
    params.fortschritt ? String(params.fortschritt) : "alle"
  ) as FortschrittFilter;
  const resume = params.resume === "1";
  const mischen = params.mischen === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [questions, ungeleseneNachrichten, favoritenIds, cookieStore] = await Promise.all([
    getSessionQuestions(filter, teil, sortierung, fortschrittFilter, user?.id, mischen),
    user ? getUngeleseneNachrichtenAnzahl(user.id) : Promise.resolve(0),
    user ? getFavoritenIds(user.id) : Promise.resolve([]),
    cookies(),
  ]);

  const istAdmin = isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* key erzwingt einen vollständigen Remount bei neuer Session-Konfiguration
          (z.B. "Nochmal üben"), sonst bliebe der interne State von QuestionRunner
          über die Navigation hinweg bestehen. */}
      <QuestionRunner
        key={JSON.stringify(params)}
        questions={questions}
        teil={teil}
        modus={filter.modus}
        filterWerte={{ ...filter, teil, sortierung, fortschrittFilter }}
        fortschrittFilter={fortschrittFilter}
        istAdmin={istAdmin}
        istGast={!user}
        ungeleseneNachrichten={ungeleseneNachrichten}
        favoritenIds={favoritenIds}
        resume={resume}
        resumeHref={baueResumeHref(params)}
      />
    </div>
  );
}
