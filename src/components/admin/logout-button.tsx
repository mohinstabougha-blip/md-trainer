"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function abmelden() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
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
