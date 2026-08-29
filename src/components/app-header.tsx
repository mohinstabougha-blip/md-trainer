"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AbmeldenButton } from "@/components/abmelden-button";

function IconHome({ aktiv }: { aktiv: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth={aktiv ? 2.2 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9v-6h6v6h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function IconBag({ aktiv }: { aktiv: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth={aktiv ? 2.2 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8h12l1 12.5a1 1 0 0 1-1 1.5H6a1 1 0 0 1-1-1.5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function IconInbox({ aktiv }: { aktiv: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth={aktiv ? 2.2 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 20.5 20.5 12 3.5 3.5l3 8.5-3 8.5Z" />
      <path d="M6.5 12h14" />
    </svg>
  );
}

function IconUser({ aktiv }: { aktiv: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={aktiv ? 2.2 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </svg>
  );
}

export function AppHeader({
  email,
  ungeleseneNachrichten,
}: {
  email: string;
  ungeleseneNachrichten: number;
}) {
  const pathname = usePathname();

  function desktopLinkKlasse(aktiv: boolean) {
    return aktiv
      ? "font-semibold text-accent"
      : "text-zinc-500 hover:text-zinc-900";
  }

  const nachrichtenAktiv = pathname.startsWith("/marktplatz/nachrichten");
  const marktplatzAktiv = pathname.startsWith("/marktplatz") && !nachrichtenAktiv;
  const profilAktiv = pathname === "/einstellungen";
  const homeAktiv = pathname === "/";

  return (
    <>
      {/* Desktop: klare Top-Leiste mit Textlinks */}
      <header className="hidden border-b border-zinc-100 bg-white px-6 py-3 text-sm sm:flex sm:items-center sm:justify-between sm:gap-3">
        <nav className="flex items-center gap-5">
          <Link href="/" className="mr-1 text-base font-semibold tracking-tight text-accent">
            KP-Trainer
          </Link>
          <Link href="/" className={desktopLinkKlasse(homeAktiv)}>
            Training
          </Link>
          <Link href="/marktplatz" className={desktopLinkKlasse(marktplatzAktiv)}>
            Marktplatz
          </Link>
          <Link
            href="/marktplatz/nachrichten"
            className={desktopLinkKlasse(nachrichtenAktiv)}
          >
            Nachrichten{ungeleseneNachrichten > 0 && ` (${ungeleseneNachrichten})`}
          </Link>
          <Link href="/einreichen" className={desktopLinkKlasse(pathname === "/einreichen")}>
            Einreichen
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-zinc-500">
          <span>{email}</span>
          <Link href="/einstellungen" className={desktopLinkKlasse(profilAktiv)}>
            Einstellungen
          </Link>
          <AbmeldenButton className="hover:text-zinc-900" />
        </div>
      </header>

      {/* Mobile: schlanke Kopfzeile (Profil-Icon statt Abmelden-Text — Abmelden
          liegt jetzt auf der Einstellungen-Seite) + Bottom-Navigation mit den
          drei Hauptpunkten statt Hamburger-Menü. */}
      <header className="flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-3 sm:hidden">
        <span className="text-base font-semibold tracking-tight text-accent">KP-Trainer</span>
        <Link
          href="/einstellungen"
          aria-label="Profil/Einstellungen"
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            profilAktiv ? "bg-accent/10 text-accent" : "text-zinc-500"
          }`}
        >
          <IconUser aktiv={profilAktiv} />
        </Link>
      </header>
      <nav
        aria-label="Hauptnavigation"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-zinc-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <Link
          href="/"
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${
            homeAktiv ? "text-accent" : "text-zinc-500"
          }`}
        >
          <IconHome aktiv={homeAktiv} />
          Home
        </Link>
        <Link
          href="/marktplatz/nachrichten"
          className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${
            nachrichtenAktiv ? "text-accent" : "text-zinc-500"
          }`}
        >
          <IconInbox aktiv={nachrichtenAktiv} />
          Nachrichten
          {ungeleseneNachrichten > 0 && (
            <span className="absolute right-[22%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {ungeleseneNachrichten}
            </span>
          )}
        </Link>
        <Link
          href="/marktplatz"
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${
            marktplatzAktiv ? "text-accent" : "text-zinc-500"
          }`}
        >
          <IconBag aktiv={marktplatzAktiv} />
          Marktplatz
        </Link>
      </nav>
    </>
  );
}
