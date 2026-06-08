/**
 * R2 storage utilities
 *
 * All blob storage goes through here — avatars, PDFs, work thumbnails.
 * Never hotlink expiring platform CDN URLs (TikTok/Instagram thumbnails
 * expire within hours). Always fetch-once and cache in R2.
 *
 * Key naming conventions:
 *   avatars/         {accountId}/avatar.{ext}
 *   thumbnails/      {workItemId}.{ext}
 *   pdfs/            {proposalId}/v{version}.pdf
 *   logos/           {accountId}/logo.{ext}
 *   brand-logos/     {brandId}.{ext}
 */

// ── Core R2 ops ───────────────────────────────────────────────────────────────

export async function r2Put(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer | ReadableStream,
  contentType: string
): Promise<void> {
  await bucket.put(key, data, { httpMetadata: { contentType } });
}

export async function r2Get(
  bucket: R2Bucket,
  key: string
): Promise<R2ObjectBody | null> {
  return bucket.get(key);
}

export async function r2Delete(
  bucket: R2Bucket,
  key: string
): Promise<void> {
  await bucket.delete(key);
}

/**
 * Check if a key exists in R2 without fetching the body.
 * Uses a HEAD-style get and immediately checks for null.
 */
export async function r2Exists(
  bucket: R2Bucket,
  key: string
): Promise<boolean> {
  const obj = await bucket.get(key);
  return obj !== null;
}

// ── Thumbnail cache util ──────────────────────────────────────────────────────

/**
 * getCachedThumbnail
 *
 * Fetch-once thumbnail caching pattern:
 *   1. Check R2 — if key exists, return it (no re-fetch).
 *   2. Fetch from sourceUrl (platform CDN).
 *   3. Store in R2.
 *   4. Return the R2 key.
 *
 * Web view: use live embed (embedHtml) when available, R2 image otherwise.
 * PDF:      always use R2 key (no live embeds in PDF).
 *
 * Call this right after resolveOEmbed() returns a thumbnailUrl.
 */
export async function getCachedThumbnail(
  bucket: R2Bucket,
  key: string,
  sourceUrl: string
): Promise<string> {
  // Already cached — skip fetch
  const existing = await r2Get(bucket, key);
  if (existing !== null) return key;

  // Fetch from platform CDN
  let resp: Response;
  try {
    resp = await fetch(sourceUrl, { signal: AbortSignal.timeout(8000) });
  } catch (err) {
    throw new Error(
      `Thumbnail fetch failed for ${key}: ${(err as Error).message}`
    );
  }

  if (!resp.ok) {
    throw new Error(
      `Thumbnail fetch HTTP ${resp.status} for ${sourceUrl}`
    );
  }

  const buf = await resp.arrayBuffer();
  const ct  = resp.headers.get("content-type") ?? "image/jpeg";
  await r2Put(bucket, key, buf, ct);

  return key;
}

// ── R2 public URL helper ──────────────────────────────────────────────────────

/**
 * Build a public URL for an R2 key.
 *
 * In production: R2 bucket configured with a custom domain
 * (e.g. assets.britch.co/{key}).
 *
 * In development: wrangler dev serves R2 objects at localhost.
 * Pass the bucket public hostname via env or fall back to a path-based URL.
 */
export function r2PublicUrl(key: string, baseUrl: string): string {
  // Strip trailing slash from baseUrl
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/${key}`;
}

// ── Key builders (consistent naming across the app) ──────────────────────────

export const r2Keys = {
  avatar:    (accountId: string, ext = "jpg")      => `avatars/${accountId}/avatar.${ext}`,
  thumbnail: (workItemId: string, ext = "jpg")     => `thumbnails/${workItemId}.${ext}`,
  pdf:       (proposalId: string, version: number) => `pdfs/${proposalId}/v${version}.pdf`,
  logo:      (accountId: string, ext = "png")      => `logos/${accountId}/logo.${ext}`,
  brandLogo: (brandId: string, ext = "png")        => `brand-logos/${brandId}.${ext}`,
};
