import { z } from "zod";

// ─── Enum unions (Prisma String + TS union + Zod guard) ─────────────────────

export const PlatformEnum = z.enum(["INSTAGRAM", "TIKTOK"]);
export type Platform = z.infer<typeof PlatformEnum>;

export const DeliverableTypeEnum = z.enum([
  "REEL", "CAROUSEL", "STORY", "VIDEO", "LIVE", "SLIDE",
]);
export type DeliverableType = z.infer<typeof DeliverableTypeEnum>;

export const AvailabilityStatusEnum = z.enum(["AVAILABLE", "BOOKED", "OFF"]);
export type AvailabilityStatus = z.infer<typeof AvailabilityStatusEnum>;

export const AnalyticsSourceEnum = z.enum([
  "SEEDED", "SELF_REPORTED", "VERIFIED", "THIRD_PARTY",
]);
export type AnalyticsSource = z.infer<typeof AnalyticsSourceEnum>;

export const RatePageStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);
export type RatePageStatus = z.infer<typeof RatePageStatusEnum>;

export const ProposalStatusEnum = z.enum([
  "DRAFT", "SENT", "VIEWED", "CHANGES_NEEDED", "APPROVED", "LOST", "EXPIRED",
]);
export type ProposalStatus = z.infer<typeof ProposalStatusEnum>;

export const AddOnTypeEnum = z.enum([
  "USAGE_RIGHTS", "WHITELISTING", "RUSH", "EXCLUSIVITY", "OTHER",
]);
export type AddOnType = z.infer<typeof AddOnTypeEnum>;

export const ProviderNameEnum = z.enum([
  "SEEDED", "MANUAL", "PHYLLO", "HYPE_AUDITOR", "DIRECT_PLATFORM",
]);
export type ProviderName = z.infer<typeof ProviderNameEnum>;

// ─── Follower tiers for CpmBenchmark ────────────────────────────────────────
export const FollowerTierEnum = z.enum([
  "NANO",   // < 10K
  "MICRO",  // 10K–50K
  "MID",    // 50K–250K
  "MACRO",  // 250K+
]);
export type FollowerTier = z.infer<typeof FollowerTierEnum>;

export function getFollowerTier(followers: number): FollowerTier {
  if (followers < 10_000)  return "NANO";
  if (followers < 50_000)  return "MICRO";
  if (followers < 250_000) return "MID";
  return "MACRO";
}

// ─── Misc helpers ────────────────────────────────────────────────────────────

/** Assert a value is never — useful for exhaustive switch checks */
export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}
