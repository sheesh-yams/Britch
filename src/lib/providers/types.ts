// AnalyticsProvider interface + normalized snapshot type

export type Platform = "INSTAGRAM" | "TIKTOK";
export type AnalyticsSource = "SEEDED" | "SELF_REPORTED" | "VERIFIED" | "THIRD_PARTY";

export interface AudienceData {
  gender: Record<string, number>;    // { "Female": 64, "Male": 32, "Other": 4 }
  ageBands: Record<string, number>;  // { "18-24": 38, "25-34": 42, ... }
  topCountries: Array<{ code: string; label: string; pct: number }>;
}

export interface AnalyticsSnapshot {
  platform: Platform;
  handle: string;
  followers: number;
  engagementRateBps: number;   // e.g. 450 = 4.5%
  avgViews: number;             // drives pricing — reach, not followers
  audience?: AudienceData;
  source: AnalyticsSource;
  fetchedAt: Date;
}

export interface AnalyticsProvider {
  fetchSnapshot(handle: string, platform: Platform): Promise<AnalyticsSnapshot>;
}
