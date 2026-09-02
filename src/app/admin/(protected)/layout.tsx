import Link from "next/link";
import { LogoutButton } from "@/components/admin/logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-3">
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/admin/statistik" className="hover:underline">
            Statistik
          </Link>
          <Link href="/admin/fragen" className="hover:underline">
            Fragen
          </Link>
          <Link href="/admin/feedback" className="hover:underline">
            Gemeldetes Feedback
          </Link>
          <Link href="/admin/meldungen" className="hover:underline">
            Meldungen
          </Link>
          <Link href="/admin/einreichungen" className="hover:underline">
            Einreichungen
          </Link>
          <Link href="/admin/wartezeit" className="hover:underline">
            Wartezeit
          </Link>
        </nav>
        <LogoutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
