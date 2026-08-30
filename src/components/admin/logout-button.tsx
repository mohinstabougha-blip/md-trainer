"use client";

import { useRouter } from "next/navigation";
import { ADMIN_LOGIN_PFAD } from "@/lib/admin-login-pfad";

export function LogoutButton() {
  const router = useRouter();

  async function abmelden() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push(ADMIN_LOGIN_PFAD);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={abmelden}
      className="text-sm text-zinc-500 hover:underline"
    >
      Abmelden
    </button>
  );
}
