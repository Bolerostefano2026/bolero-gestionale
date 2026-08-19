import { createClient } from "@supabase/supabase-js";

const BUCKET = "bolero-uploads";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

let bucketReady: Promise<void> | null = null;

async function ensureBucket(client: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { data: buckets } = await client.storage.listBuckets();
      if (!buckets?.some((b) => b.name === BUCKET)) {
        await client.storage.createBucket(BUCKET, { public: true });
      }
    })();
  }
  return bucketReady;
}

export const storageConfigured = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Uploads a file to Supabase Storage and returns its public URL. Falls back
 * to a base64 data URI when Storage isn't configured (local dev without
 * Supabase, or before the bucket is set up) so photo upload always works —
 * just without the scalability of real object storage.
 */
export async function uploadPhoto(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const client = getSupabaseAdmin();

  if (client) {
    await ensureBucket(client);
    const path = `measurements/${filename}`;
    const { error } = await client.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: false });

    if (!error) {
      return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }
    // Falls through to data URI on error so uploads never hard-fail.
  }

  return `data:${contentType};base64,${buffer.toString("base64")}`;
}
