"use server";
/**
 * BRITCH ADMIN ACTIONS — quarantined module
 *
 * ALL admin server actions live here. This module:
 *   - Is NEVER imported by creator actions or UI
 *   - Every export calls requireAdminRole() first — no exceptions
 *   - Writes directly to the global pricing plane via getPrisma() (not getScopedDb)
 *   - Makes a future /admin app extraction a file move, not a rewrite
 *
 * Two planes are NEVER crossed:
 *   - Creators call getScopedDb() for their own data
 *   - Admin calls getPrisma() for the global plane
 */

import { getPrisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { headers }    from "next/headers";
import { getRequestContext } from "@opennextjs/cloudflare";

// ── Role guard ────────────────────────────────────────────────────────────────

export async function requireAdminRole(): Promise<void> {
  const { env } = getRequestContext();
  const session = await getSession(env.DB, await headers());
  if (!session?.user) throw new Error("Not authenticated");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden: admin only");
}

// ── Niche management ──────────────────────────────────────────────────────────

export async function createNiche(slug: string, label: string, order: number) {
  await requireAdminRole();
  const { env } = getRequestContext(); const prisma = getPrisma(env.DB);
  return prisma.niche.create({ data: { slug, label, order, isActive: true } });
}

export async function updateNiche(
  id: string,
  data: Partial<{ label: string; isActive: boolean; order: number }>
) {
  await requireAdminRole();
  const { env } = getRequestContext(); const prisma = getPrisma(env.DB);
  return prisma.niche.update({ where: { id }, data });
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
  const { env } = getRequestContext(); const prisma = getPrisma(env.DB);
  return prisma.cpmBenchmark.upsert({
    where: {
      platform_nicheId_followerTier: {
        platform:     input.platform,
        nicheId:      input.nicheId ?? "",  // D1 upsert treats NULL as ""
        followerTier: input.followerTier,
      },
    },
    update:  { cpmCents: input.cpmCents, source: input.source },
    create:  { ...input, isActive: true, effectiveDate: new Date() },
  });
}

// ── Format multiplier management ──────────────────────────────────────────────

export async function upsertFormatMultiplier(input: {
  platform: string;
  deliverableType: string;
  multiplierBps: number;
}) {
  await requireAdminRole();
  const { env } = getRequestContext(); const prisma = getPrisma(env.DB);
  return prisma.formatMultiplier.upsert({
    where: { platform_deliverableType: { platform: input.platform, deliverableType: input.deliverableType } },
    update: { multiplierBps: input.multiplierBps },
    create: { ...input, isActive: true },
  });
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
  }>
) {
  await requireAdminRole();
  const { env } = getRequestContext(); const prisma = getPrisma(env.DB);
  return prisma.engineParams.update({ where: { id }, data });
}

export async function getActiveEngineParams() {
  // Engine params reads don't require admin — but this fn lives here for locality
  const { env } = getRequestContext(); const prisma = getPrisma(env.DB);
  return prisma.engineParams.findFirst({ where: { isActive: true } });
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
  const { env } = getRequestContext(); const prisma = getPrisma(env.DB);
  return prisma.seedCreator.upsert({
    where: { handle_platform: { handle: input.handle, platform: input.platform } },
    update: { displayName: input.displayName, snapshot: input.snapshot, postSample: input.postSample },
    create: { ...input, isActive: true },
  });
}

// ── Provider config management ────────────────────────────────────────────────

export async function updateProviderConfig(input: {
  activeAnalyticsProvider?: string;
  oembedTokens?: object;
}) {
  await requireAdminRole();
  const { env } = getRequestContext(); const prisma = getPrisma(env.DB);
  const existing = await prisma.providerConfig.findFirst();
  if (!existing) {
    return prisma.providerConfig.create({
      data: { id: "provider_config_1", ...input, updatedAt: new Date() },
    });
  }
  return prisma.providerConfig.update({
    where: { id: existing.id },
    data:  { ...input, updatedAt: new Date() },
  });
}
