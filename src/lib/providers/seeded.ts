/**
 * SeededProvider
 *
 * Looks up a SeedCreator by handle + platform from D1 and returns a
 * normalized AnalyticsSnapshot. This is what powers the onboarding
 * "enter your handle → get demo rates" flow in MVP.
 */

import { and, eq } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { seedCreator } from "@/db/schema";
import type { AnalyticsProvider, AnalyticsSnapshot, Platform } from "./types";

export class SeededProvider implements AnalyticsProvider {
  constructor(private readonly db: DB) {}

  async fetchSnapshot(handle: string, platform: Platform): Promise<AnalyticsSnapshot> {
    const normalized = handle.startsWith("@") ? handle : `@${handle}`;

    const record = await this.db.query.seedCreator.findFirst({
      where: and(
        eq(seedCreator.handle, normalized),
        eq(seedCreator.platform, platform),
        eq(seedCreator.isActive, true),
      ),
    });

    if (!record) {
      throw new Error(
        `SeededProvider: no seed creator found for ${normalized} on ${platform}. ` +
        `Check that the seed has been applied.`
      );
    }

    const snap = record.snapshot as {
      followers: number;
      engagementRateBps: number;
      avgViews: number;
      audience?: {
        gender: Record<string, number>;
        ageBands: Record<string, number>;
        topCountries: Array<{ code: string; label: string; pct: number }>;
      };
    };

    return {
      platform,
      handle: normalized,
      followers: snap.followers,
      engagementRateBps: snap.engagementRateBps,
      avgViews: snap.avgViews,
      audience: snap.audience ?? undefined,
      source: "SEEDED",
      fetchedAt: new Date(),
    };
  }

  /**
   * Returns only organic posts (isPaid = false). Used by the rate engine
   * to compute avgReach from the last-20 sample.
   */
  async fetchOrganicPostViews(handle: string, platform: Platform): Promise<number[]> {
    const normalized = handle.startsWith("@") ? handle : `@${handle}`;

    const record = await this.db.query.seedCreator.findFirst({
      where: and(
        eq(seedCreator.handle, normalized),
        eq(seedCreator.platform, platform),
        eq(seedCreator.isActive, true),
      ),
    });

    if (!record) return [];

    const posts = record.postSample as Array<{ views: number; isPaid: boolean }>;
    return posts.filter((p) => !p.isPaid).map((p) => p.views);
  }
}
