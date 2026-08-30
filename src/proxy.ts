import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";
import { ADMIN_LOGIN_PFAD } from "@/lib/admin-login-pfad";

function pruefeAdminZugang(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === ADMIN_LOGIN_PFAD || pathname.startsWith("/api/admin/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidAdminToken(token)) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PFAD, request.url));
  }

  return NextResponse.next();
}

// Öffentlich auch ohne Anmeldung nutzbar (Gast-Modus): Training, Fragen-Session,
// Marktplatz-Übersicht (nur Titel) und das Einreichen-Formular. Alles andere
// unter den gematchten Pfaden bleibt angemeldeten Nutzern vorbehalten.
function istOeffentlich(pathname: string): boolean {
  if (pathname === "/" || pathname === "/marktplatz" || pathname === "/einreichen") {
    return true;
  }
  if (pathname === "/session" || pathname.startsWith("/session/")) {
    return true;
  }
  return false;
}

async function pruefeNutzerZugang(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Session-Cookie ggf. auffrischen (setAll oben), aber Gäste nicht abweisen.
  if (istOeffentlich(request.nextUrl.pathname)) {
    return response;
  }

  // is_anonymous: schließt alte anonyme Test-Sessions aus Phase 1 aus, die
  // Supabase sonst als gültigen "user" durchwinken würde.
  if (!user || user.is_anonymous) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname === ADMIN_LOGIN_PFAD
  ) {
    return pruefeAdminZugang(request);
  }

  return pruefeNutzerZugang(request);
}

export const config = {
  matcher: [
    "/",
    "/session/:path*",
    "/marktplatz/:path*",
    "/einstellungen",
    "/einreichen",
    "/admin/:path*",
    "/api/admin/:path*",
    "/kp-team-anmeldung",
  ],
};
