"use server";
/**
 * BRITCH ADMIN ACTIONS — quarantined module
 *
 * ALL admin server actions live here. This module:
 *   - Is NEVER imported by creator actions or UI
 *   - Every export calls requireAdminRole() first — no exceptions
 *   - Writes directly to the global pricing plane via getDb() (not getScopedDb)
 *   - Makes a future /admin app extraction a file move, not a rewrite
 *
 * Two planes are NEVER crossed:
 *   - Creators call getScopedDb() for their own data
 *   - Admin calls getDb() for the global plane
 */

import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  niche, cpmBenchmark, formatMultiplier, engineParams,
  seedCreator, providerConfig,
} from "@/db/schema";

// ── Role guard ────────────────────────────────────────────────────────────────

export async function requireAdminRole(): Promise<void> {
  const { env } = getCloudflareContext();
  const session = await getSession(env.DB, await headers());
  if (!session?.user) throw new Error("Not authenticated");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden: admin only");
}

// ── Niche management ──────────────────────────────────────────────────────────

export async function createNiche(slug: string, label: string, order: number) {
  await requireAdminRole();
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const [row] = await db.insert(niche).values({ slug, label, order, isActive: true }).returning();
  return row;
}

export async function updateNiche(
  id: string,
  data: Partial<{ label: string; isActive: boolean; order: number }>,
) {
  await requireAdminRole();
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const [row] = await db.update(niche).set(data).where(eq(niche.id, id)).returning();
  return row;
}

// ── CPM benchmark management ──────────────────────────────────────────────────

export async function upsertCpmBenchmark(input: {
  platform: string;
  nicheId: string | null;
  followerTier: string;
  cpmCents: number;
  source?: string;
}) {
  await requireAdminRole();
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);

  const existing = await db.query.cpmBenchmark.findFirst({
    where: and(
      eq(cpmBenchmark.platform, input.platform),
      eq(cpmBenchmark.followerTier, input.followerTier),
      // nicheId may be null — eq() handles `IS NULL` correctly when the value is null
      input.nicheId === null
        ? // drizzle-orm: use `isNull` for SQL `IS NULL`
          // imported lazily here since this is the only call site
          (await import("drizzle-orm")).isNull(cpmBenchmark.nicheId)
        : eq(cpmBenchmark.nicheId, input.nicheId),
    ),
  });

  if (existing) {
    const [row] = await db.update(cpmBenchmark)
      .set({ cpmCents: input.cpmCents, source: input.source })
      .where(eq(cpmBenchmark.id, existing.id))
      .returning();
    return row;
  }
  const [row] = await db.insert(cpmBenchmark).values({
    platform: input.platform,
    nicheId: input.nicheId,
    followerTier: input.followerTier,
    cpmCents: input.cpmCents,
    source: input.source,
    isActive: true,
    effectiveDate: new Date(),
  }).returning();
  return row;
}

// ── Format multiplier management ──────────────────────────────────────────────

export async function upsertFormatMultiplier(input: {
  platform: string;
  deliverableType: string;
  multiplierBps: number;
}) {
  await requireAdminRole();
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);

  // SQLite supports ON CONFLICT only on UNIQUE constraints; we have a unique
  // index on (platform, deliverableType) so onConflictDoUpdate works here.
  const [row] = await db.insert(formatMultiplier)
    .values({ ...input, isActive: true })
    .onConflictDoUpdate({
      target: [formatMultiplier.platform, formatMultiplier.deliverableType],
      set: { multiplierBps: input.multiplierBps },
    })
    .returning();
  return row;
}

// ── Engine params management ──────────────────────────────────────────────────

export async function updateEngineParams(
  id: string,
  data: Partial<{
    reachWeightBps: number;
    followerWeightBps: number;
    benchmarkEngagementBps: number;
    engAdjMinBps: number;
    engAdjMaxBps: number;
    roundingCents: number;
    floorSpreadBps: number;
    stretchSpreadBps: number;
    label: string;
  }>,
) {
  await requireAdminRole();
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const [row] = await db.update(engineParams).set(data).where(eq(engineParams.id, id)).returning();
  return row;
}

export async function getActiveEngineParams() {
  // Engine params reads don't require admin — but this fn lives here for locality
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  return db.query.engineParams.findFirst({ where: eq(engineParams.isActive, true) });
}

// ── Seed creator management ───────────────────────────────────────────────────

export async function upsertSeedCreator(input: {
  handle: string;
  platform: string;
  displayName: string;
  snapshot: object;
  postSample: object[];
}) {
  await requireAdminRole();
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);

  const [row] = await db.insert(seedCreator)
    .values({ ...input, isActive: true })
    .onConflictDoUpdate({
      target: [seedCreator.handle, seedCreator.platform],
      set: {
        displayName: input.displayName,
        snapshot: input.snapshot,
        postSample: input.postSample,
      },
    })
    .returning();
  return row;
}

// ── Provider config management ────────────────────────────────────────────────

export async function updateProviderConfig(input: {
  activeAnalyticsProvider?: string;
  oembedTokens?: object;
}) {
  await requireAdminRole();
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const existing = await db.query.providerConfig.findFirst();

  if (!existing) {
    const [row] = await db.insert(providerConfig).values({
      activeAnalyticsProvider: input.activeAnalyticsProvider ?? "SEEDED",
      oembedTokens: input.oembedTokens ?? {},
    }).returning();
    return row;
  }
  const [row] = await db.update(providerConfig)
    .set({
      ...(input.activeAnalyticsProvider !== undefined && { activeAnalyticsProvider: input.activeAnalyticsProvider }),
      ...(input.oembedTokens !== undefined && { oembedTokens: input.oembedTokens }),
    })
    .where(eq(providerConfig.id, existing.id))
    .returning();
  return row;
}
