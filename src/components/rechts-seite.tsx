import Link from "next/link";
import { Logo } from "@/components/logo";

/** Gemeinsames Layout für Datenschutz / Impressum / Über (öffentlich, ohne Login). */
export function RechtsSeite({
  titel,
  children,
}: {
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-100 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/">
            <Logo size={24} />
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
            Zurück
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6 pb-16">
        <h1 className="text-2xl font-semibold">{titel}</h1>
        <div className="flex flex-col gap-6 text-sm leading-relaxed text-zinc-700 [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-zinc-400 [&_a]:text-accent [&_a]:hover:underline">
          {children}
        </div>

        <footer className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-200 pt-4 text-sm text-zinc-500">
          <Link href="/about" className="hover:text-zinc-900">
            Über KP Baden
          </Link>
          <Link href="/datenschutz" className="hover:text-zinc-900">
            Datenschutz
          </Link>
          <Link href="/impressum" className="hover:text-zinc-900">
            Impressum
          </Link>
        </footer>
      </main>
    </div>
  );
}
