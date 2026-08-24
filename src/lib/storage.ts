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
 * Uploads a file to Supabase Storage and returns its public URL.
 * Throws if Supabase is not configured or if the upload fails.
 */
export async function uploadPhoto(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error(
      "Upload foto non disponibile: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY non configurati. Configurali nelle variabili d'ambiente."
    );
  }

  await ensureBucket(client);
  const path = `measurements/${filename}`;
  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false });

  if (error) {
    throw new Error(`Upload foto fallito: ${error.message}`);
  }

  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
