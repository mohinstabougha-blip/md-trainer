import { createAdminClient } from "@/lib/supabase/admin";

export const QUESTION_IMAGES_BUCKET = "question-images";

let bucketBereit = false;

export async function stelleBucketSicher() {
  if (bucketBereit) return;
  const supabase = createAdminClient();
  const { error } = await supabase.storage.createBucket(QUESTION_IMAGES_BUCKET, {
    public: true,
  });
  // Bucket existiert bereits -> ok, alle anderen Fehler weiterwerfen.
  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
  bucketBereit = true;
}
