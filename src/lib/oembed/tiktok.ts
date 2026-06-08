/**
 * TikTokOEmbed — open endpoint, no auth required.
 *
 * API: https://www.tiktok.com/oembed?url=<video_url>
 * Returns embedHtml (iframe) and thumbnail_url.
 *
 * Rate limits: ~100 req/min per IP (undocumented but observed).
 * Workers have a single IP per PoP — implement R2 cache before production use.
 */

import type { OEmbedProvider, OEmbedResult } from "./types";

interface TikTokOEmbedResponse {
  html: string;
  thumbnail_url: string;
  title?: string;
  author_name?: string;
  author_url?: string;
}

export class TikTokOEmbed implements OEmbedProvider {
  readonly name = "tiktok";

  canHandle(url: string): boolean {
    return url.includes("tiktok.com") || url.includes("vm.tiktok.com");
  }

  async resolve(url: string): Promise<OEmbedResult> {
    const apiUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;

    let resp: Response;
    try {
      resp = await fetch(apiUrl, {
        headers: { "Accept": "application/json" },
        // Workers: no keepalive needed
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      throw new Error(`TikTok oEmbed fetch failed: ${(err as Error).message}`);
    }

    if (!resp.ok) {
      throw new Error(`TikTok oEmbed HTTP ${resp.status} for ${url}`);
    }

    const data = await resp.json() as TikTokOEmbedResponse;

    return {
      embedHtml:    data.html ?? undefined,
      thumbnailUrl: data.thumbnail_url ?? undefined,
      title:        data.title ?? undefined,
      authorName:   data.author_name ?? undefined,
    };
  }
}
