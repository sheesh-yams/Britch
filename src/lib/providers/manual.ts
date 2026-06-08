/**
 * ManualProvider
 *
 * Accepts creator-entered stats directly — no external API call.
 * Used when the creator fills in followers/engagement/avgViews manually
 * in the onboarding form. Source is marked SELF_REPORTED.
 *
 * Also stores the post sample (last 20 posts) entered by the creator.
 */

import type { AnalyticsProvider, AnalyticsSnapshot, Platform, AudienceData } from "./types";

export interface ManualInputData {
  platform: Platform;
  handle: string;
  followers: number;
  engagementRateBps: number;  // e.g. 380 = 3.8%
  avgViews: number;
  audience?: AudienceData;
}

export class ManualProvider implements AnalyticsProvider {
  constructor(private readonly data: ManualInputData) {}

  async fetchSnapshot(_handle: string, _platform: Platform): Promise<AnalyticsSnapshot> {
    return {
      platform:          this.data.platform,
      handle:            this.data.handle,
      followers:         this.data.followers,
      engagementRateBps: this.data.engagementRateBps,
      avgViews:          this.data.avgViews,
      audience:          this.data.audience,
      source:            "SELF_REPORTED",
      fetchedAt:         new Date(),
    };
  }
}

/**
 * Validate manual input data before creating a ManualProvider.
 * Returns an error string or null if valid.
 */
export function validateManualInput(data: Partial<ManualInputData>): string | null {
  if (!data.followers || data.followers < 0)
    return "Followers must be a positive integer";
  if (!data.engagementRateBps || data.engagementRateBps < 0)
    return "Engagement rate must be a positive value";
  if (data.engagementRateBps > 10000)
    return "Engagement rate seems too high (>100%) — check your input";
  if (!data.avgViews || data.avgViews < 0)
    return "Average views must be a positive integer";
  if (!data.handle || data.handle.trim().length === 0)
    return "Handle is required";
  return null;
}
