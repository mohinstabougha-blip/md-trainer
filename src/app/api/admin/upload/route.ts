import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { QUESTION_IMAGES_BUCKET, stelleBucketSicher } from "@/lib/storage";

const ERLAUBTE_TYPEN = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file fehlt" }, { status: 400 });
  }
  if (!ERLAUBTE_TYPEN.includes(file.type)) {
    return NextResponse.json({ error: "Nur PNG, JPEG, WebP oder GIF erlaubt" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Datei zu groß (max. 5 MB)" }, { status: 400 });
  }

  await stelleBucketSicher();

  const extension = file.name.split(".").pop() || "png";
  const pfad = `${crypto.randomUUID()}.${extension}`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(QUESTION_IMAGES_BUCKET)
    .upload(pfad, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(QUESTION_IMAGES_BUCKET).getPublicUrl(pfad);

  return NextResponse.json({ url: publicUrl });
}
