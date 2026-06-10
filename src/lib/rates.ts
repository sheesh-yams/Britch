/**
 * Rate engine wiring — the side-effectful glue around src/lib/engine.ts.
 *
 * computeAndStoreDeliverables() reads the global pricing plane (CPM benchmark,
 * format multiplier, engine params) for each platform/format combination a
 * creator does, runs computeRate(), and upserts the result into Deliverable.
 *
 * Called from /api/onboarding after SocialAccounts are written so a fresh
 * creator lands on /rates with real numbers instead of "no deliverables yet".
 *
 * Safe to re-run — uses onConflictDoUpdate on the (accountId, platform, type)
 * unique index, so "Recompute rates" is a one-line operation.
 */

import { and, eq, isNull } from "drizzle-orm";
import { computeRate } from "@/lib/engine";
import type { DB } from "@/lib/db";
import {
  deliverable, engineParams as engineParamsTable,
  cpmBenchmark, formatMultiplier as formatMultiplierTable,
  postSample, socialAccount,
} from "@/db/schema";

export type Platform = "INSTAGRAM" | "TIKTOK";

/**
 * Default deliverable formats per platform — what we auto-create on onboarding.
 * Creators can disable, rename, or add others in /rates.
 */
export const DEFAULT_FORMATS: Record<Platform, string[]> = {
  INSTAGRAM: ["REEL", "CAROUSEL", "STORY"],
  TIKTOK:    ["VIDEO", "STORY",   "LIVE"],
};

/**
 * Map a follower count to a CpmBenchmark tier label.
 * Boundaries set per BRITCH_ARCHITECTURE.md "open items" — confirmed here.
 */
export function followerTier(followers: number): "NANO" | "MICRO" | "MID" | "MACRO" {
  if (followers < 10_000)   return "NANO";
  if (followers < 50_000)   return "MICRO";
  if (followers < 250_000)  return "MID";
  return "MACRO";
}

export interface SocialInput {
  platform:          Platform;
  followers:         number;
  engagementRateBps: number;
  avgViews:          number;
  /**
   * Optional: organic post views to use as the engine's reach sample. When
   * provided, this is the single source of truth — `avgViews` is ignored as a
   * fallback. When omitted, computeAndStoreDeliverables() looks up PostSample
   * rows for this account/platform and uses the organic subset.
   */
  organicPostViews?: number[];
}

/**
 * Generate (or refresh) Deliverable rows for one creator's social account.
 *
 * - Reads active EngineParams. If none exist (global plane unseeded), returns
 *   early instead of crashing — onboarding still succeeds, rates just aren't
 *   computed yet.
 * - One Deliverable row per default format for the platform.
 * - Reach comes from real post-view data: caller's organicPostViews array
 *   first, then PostSample rows in the DB. We do NOT fall back to followers —
 *   that would conflate audience size with reach and reintroduce the very
 *   thing Britch prices against.
 */
export async function computeAndStoreDeliverables(
  db: DB,
  accountId: string,
  social: SocialInput,
): Promise<{ created: number; skipped: boolean }> {
  const ep = await db.query.engineParams.findFirst({
    where: eq(engineParamsTable.isActive, true),
  });
  if (!ep) return { created: 0, skipped: true };

  const tier = followerTier(social.followers);

  // Prefer (platform, tier, nicheId NULL) generic CPM; fall back to any active
  // platform CPM if the tier-specific row is missing.
  let cpmRow = await db.query.cpmBenchmark.findFirst({
    where: and(
      eq(cpmBenchmark.platform, social.platform),
      eq(cpmBenchmark.followerTier, tier),
      isNull(cpmBenchmark.nicheId),
      eq(cpmBenchmark.isActive, true),
    ),
  });
  if (!cpmRow) {
    cpmRow = await db.query.cpmBenchmark.findFirst({
      where: and(eq(cpmBenchmark.platform, social.platform), eq(cpmBenchmark.isActive, true)),
    });
  }
  const cpmCents = cpmRow?.cpmCents ?? 1000;

  // Build organicPostViews. Priority:
  //   1) Caller-supplied array (e.g. just-entered onboarding sample).
  //   2) PostSample rows on this socialAccount, filtered to organic.
  //   3) [] — produces $0 rates so the creator sees they owe us view data.
  let organicPostViews: number[] = social.organicPostViews ?? [];
  if (organicPostViews.length === 0) {
    const sa = await db.query.socialAccount.findFirst({
      where: and(eq(socialAccount.accountId, accountId), eq(socialAccount.platform, social.platform)),
      columns: { id: true },
    });
    if (sa) {
      const samples = await db.query.postSample.findMany({
        where: and(eq(postSample.socialAccountId, sa.id), eq(postSample.isPaid, false)),
        columns: { views: true },
      });
      organicPostViews = samples.map(s => s.views);
    }
  }

  let created = 0;
  for (const format of DEFAULT_FORMATS[social.platform]) {
    const fmRow = await db.query.formatMultiplier.findFirst({
      where: and(
        eq(formatMultiplierTable.platform, social.platform),
        eq(formatMultiplierTable.deliverableType, format),
        eq(formatMultiplierTable.isActive, true),
      ),
    });
    const formatMultiplierBps = fmRow?.multiplierBps ?? 10000;

    const result = computeRate({
      platform:          social.platform,
      deliverableType:   format,
      followers:         social.followers,
      engagementRateBps: social.engagementRateBps,
      organicPostViews,
      cpmCents,
      formatMultiplierBps,
      reachWeightBps:         ep.reachWeightBps,
      followerWeightBps:      ep.followerWeightBps,
      benchmarkEngagementBps: ep.benchmarkEngagementBps,
      engAdjMinBps:           ep.engAdjMinBps,
      engAdjMaxBps:           ep.engAdjMaxBps,
      roundingCents:          ep.roundingCents,
      floorSpreadBps:         ep.floorSpreadBps,
      stretchSpreadBps:       ep.stretchSpreadBps,
    });

    await db
      .insert(deliverable)
      .values({
        accountId,
        platform:           social.platform,
        type:               format,
        isActive:           true,
        reachUsed:          result.breakdown.weightedReach,
        suggestedRateCents: result.targetCents,
        finalRateCents:     result.targetCents,
        floorCents:         result.floorCents,
        stretchCents:       result.stretchCents,
        breakdown:          result.breakdown,
      })
      .onConflictDoUpdate({
        target: [deliverable.accountId, deliverable.platform, deliverable.type],
        // Only overwrite the suggested/breakdown side of the row. Preserves
        // any creator overrides to floor/final/stretch from before recompute.
        set: {
          reachUsed:          result.breakdown.weightedReach,
          suggestedRateCents: result.targetCents,
          breakdown:          result.breakdown,
        },
      });
    created++;
  }

  return { created, skipped: false };
}
