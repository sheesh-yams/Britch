/**
 * InstagramOEmbed — token-gated stub.
 *
 * Requires a Meta app token (oEmbed only — NOT analytics app-review).
 * Token stored in ProviderConfig.oembedTokens.instagram (admin-settable).
 *
 * API: https://graph.facebook.com/v21.0/instagram_oembed
 *      ?url=<post_url>&access_token=<token>
 *
 * Stub for MVP — works once a token is configured.
 */

import type { OEmbedProvider, OEmbedResult } from "./types";

interface IGOEmbedResponse {
  html: string;
  thumbnail_url?: string;
  title?: string;
  author_name?: string;
}

export class InstagramOEmbed implements OEmbedProvider {
  readonly name = "instagram";

  constructor(private readonly accessToken?: string) {}

  canHandle(url: string): boolean {
    return url.includes("instagram.com") || url.includes("instagr.am");
  }

  async resolve(url: string): Promise<OEmbedResult> {
    if (!this.accessToken) {
      // No token configured — return empty result, caller falls back to CoverImageFallback
      return {};
    }

    const apiUrl =
      `https://graph.facebook.com/v21.0/instagram_oembed` +
      `?url=${encodeURIComponent(url)}&access_token=${encodeURIComponent(this.accessToken)}` +
      `&maxwidth=540`;

    let resp: Response;
    try {
      resp = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
    } catch (err) {
      return {}; // network error → fallback
    }

    if (!resp.ok) return {}; // token error / not found → fallback

    const data = await resp.json() as IGOEmbedResponse;
    return {
      embedHtml:    data.html ?? undefined,
      thumbnailUrl: data.thumbnail_url ?? undefined,
      title:        data.title ?? undefined,
      authorName:   data.author_name ?? undefined,
    };
  }
}
