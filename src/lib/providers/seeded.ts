/**
 * SeededProvider
 *
 * Looks up a SeedCreator by handle + platform from D1 and returns a
 * normalized AnalyticsSnapshot. This is what powers the onboarding
 * "enter your handle → get demo rates" flow in MVP.
 *
 * The seed creator record stores the snapshot JSON and post sample JSON,
 * both written by scripts/seed.ts from BRITCH_ARCHITECTURE.md values.
 */

import type { AnalyticsProvider, AnalyticsSnapshot, Platform } from "./types";

// D1-compatible minimal Prisma interface (we only need findFirst here)
interface SeedCreatorRecord {
  handle: string;
  platform: string;
  displayName: string;
  snapshot: unknown;  // parsed JSON
  postSample: unknown;
}

interface PrismaLike {
  seedCreator: {
    findFirst(args: {
      where: { handle: string; platform: string; isActive: boolean };
    }): Promise<SeedCreatorRecord | null>;
  };
}

export class SeededProvider implements AnalyticsProvider {
  constructor(private readonly prisma: PrismaLike) {}

  async fetchSnapshot(handle: string, platform: Platform): Promise<AnalyticsSnapshot> {
    // Normalize handle — strip leading @ for lookup flexibility
    const normalized = handle.startsWith("@") ? handle : `@${handle}`;

    const record = await this.prisma.seedCreator.findFirst({
      where: { handle: normalized, platform, isActive: true },
    });

    if (!record) {
      throw new Error(
        `SeededProvider: no seed creator found for ${normalized} on ${platform}. ` +
        `Check that scripts/seed.ts has been applied.`
      );
    }

    // snapshot is stored as JSON text in D1 → Prisma parses it to object
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
   * Also expose post sample for use in rate engine computation.
   * Returns only organic posts (isPaid = false).
   */
  async fetchOrganicPostViews(handle: string, platform: Platform): Promise<number[]> {
    const normalized = handle.startsWith("@") ? handle : `@${handle}`;

    const record = await this.prisma.seedCreator.findFirst({
      where: { handle: normalized, platform, isActive: true },
    });

    if (!record) return [];

    const posts = record.postSample as Array<{ views: number; isPaid: boolean }>;
    return posts.filter((p) => !p.isPaid).map((p) => p.views);
  }
}
