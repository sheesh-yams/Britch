/**
 * resolveOEmbed
 *
 * Tries TikTok → Instagram → CoverImageFallback in order.
 * On success, caller should immediately cache the thumbnail in R2
 * via getCachedThumbnail() to avoid hotlinking expiring CDN URLs.
 */

import type { OEmbedResult } from "./types";
import { TikTokOEmbed } from "./tiktok";
import { InstagramOEmbed } from "./instagram";
import { CoverImageFallback } from "./fallback";

export interface OEmbedOptions {
  instagramToken?: string;
  existingThumbnailKey?: string; // R2 key if already cached
}

export async function resolveOEmbed(
  url: string,
  opts: OEmbedOptions = {}
): Promise<OEmbedResult> {
  const tiktok    = new TikTokOEmbed();
  const instagram = new InstagramOEmbed(opts.instagramToken);
  const fallback  = new CoverImageFallback(opts.existingThumbnailKey);

  const providers = [tiktok, instagram, fallback];

  for (const provider of providers) {
    if (!provider.canHandle(url)) continue;
    try {
      const result = await provider.resolve(url);
      // Return as soon as we get embedHtml or thumbnailUrl
      if (result.embedHtml || result.thumbnailUrl) return result;
    } catch {
      // Try next provider
      continue;
    }
  }

  return {}; // nothing resolved — caller shows placeholder
}

export type { OEmbedResult };
