"use client";

import { useState } from "react";

export async function bildHochladen(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload fehlgeschlagen");
  const data = await res.json();
  return data.url as string;
}

export function BildFeld({
  label,
  url,
  onChange,
}: {
  label: string;
  url: string | null;
  onChange: (url: string | null) => void;
}) {
  const [ladt, setLadt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-500">{label}</label>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="max-h-40 w-fit rounded-xl" />
      )}
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setLadt(true);
            setFehler(null);
            try {
              const uploadedUrl = await bildHochladen(file);
              onChange(uploadedUrl);
            } catch {
              setFehler("Upload fehlgeschlagen");
            } finally {
              setLadt(false);
              e.target.value = "";
            }
          }}
          className="text-sm"
        />
        {ladt && <span className="text-sm text-zinc-500">Lädt…</span>}
        {url && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-sm text-red-600 hover:underline"
          >
            Entfernen
          </button>
        )}
      </div>
      {fehler && <p className="text-sm text-red-600">{fehler}</p>}
    </div>
  );
}
