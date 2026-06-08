/**
 * CoverImageFallback
 *
 * Used when oEmbed is unavailable (no token, platform blocked, etc.).
 * Creator can upload a cover image for the work item, stored in R2.
 * Returns the R2 key as the "thumbnailUrl" for consistent rendering.
 */

import type { OEmbedProvider, OEmbedResult } from "./types";

export class CoverImageFallback implements OEmbedProvider {
  readonly name = "fallback";

  constructor(private readonly r2ThumbnailKey?: string) {}

  canHandle(_url: string): boolean {
    return true; // always a valid fallback
  }

  async resolve(_url: string): Promise<OEmbedResult> {
    return {
      embedHtml:    undefined,
      thumbnailUrl: this.r2ThumbnailKey ?? undefined,
    };
  }
}
