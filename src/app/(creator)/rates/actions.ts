"use server";
/**
 * Rates page server actions — update one Deliverable row, recompute all
 * Deliverables from current global pricing plane, and publish a snapshot
 * RatePage at /r/[token].
 *
 * Every action re-resolves session → accountId; nothing trusts a hidden
 * field for ownership. Updates are gated on the row's accountId matching
 * so a malicious form post can't reach another creator's rates.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq, desc, isNull } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth";
import { getScopedDb, getDb } from "@/lib/db";
import { generateToken } from "@/lib/tokens";
import { computeAndStoreDeliverables, type Platform } from "@/lib/rates";
import {
  deliverable, ratePage,
  socialAccount, creatorProfile,
} from "@/db/schema";

async function requireScoped() {
  const { env } = getCloudflareContext();
  const session = await getSession(env.DB, await headers());
  if (!session?.user) throw new Error("Not authenticated");
  const scoped = await getScopedDb(env.DB, session.user.id);
  if (!scoped) throw new Error("No creator account — complete onboarding first");
  return { ...scoped, env };
}

function dollarsToCents(value: FormDataEntryValue | null): number {
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/[$,\s]/g, "");
  const f = parseFloat(cleaned);
  if (!Number.isFinite(f) || f < 0) return 0;
  return Math.round(f * 100);
}

export async function updateDeliverableRate(formData: FormData) {
  const { db, accountId } = await requireScoped();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const floorCents   = dollarsToCents(formData.get("floor"));
  const finalCents   = dollarsToCents(formData.get("final"));
  const stretchCents = dollarsToCents(formData.get("stretch"));

  // Gated on accountId so this can't reach into another creator's row.
  await db.update(deliverable)
    .set({ floorCents, finalRateCents: finalCents, stretchCents })
    .where(and(eq(deliverable.id, id), eq(deliverable.accountId, accountId)));

  revalidatePath("/rates");
}

export async function recomputeAllRates() {
  const { db, accountId } = await requireScoped();

  const socials = await db.query.socialAccount.findMany({
    where: and(eq(socialAccount.accountId, accountId), isNull(socialAccount.disconnectedAt)),
  });

  for (const sa of socials) {
    await computeAndStoreDeliverables(db, accountId, {
      platform:          sa.platform as Platform,
      followers:         sa.followers,
      engagementRateBps: sa.engagementRateBps,
      avgViews:          sa.avgViews,
    });
  }

  revalidatePath("/rates");
}

/**
 * Publish a rate page. Freezes the current set of Deliverables + the creator's
 * profile and connected socials into a JSON snapshot on RatePage.frozenRates.
 *
 * `/r/[token]` reads frozenRates verbatim — the public URL never changes its
 * numbers after publish, even if the creator later edits their rates or the
 * admin retunes the global engine.
 */
export async function publishRatePage(): Promise<void> {
  const { db, accountId, env } = await requireScoped();

  const ds = await db.query.deliverable.findMany({
    where: and(eq(deliverable.accountId, accountId), eq(deliverable.isActive, true)),
  });
  if (ds.length === 0) {
    throw new Error("Nothing to publish — generate some rates first.");
  }

  const profile = await db.query.creatorProfile.findFirst({
    where: eq(creatorProfile.accountId, accountId),
  });

  const socials = await db.query.socialAccount.findMany({
    where: and(eq(socialAccount.accountId, accountId), isNull(socialAccount.disconnectedAt)),
  });

  // Build the FrozenRates JSON shape the public /r/[token] page already consumes.
  const handles: Record<string, string> = {};
  let audience: unknown = undefined;
  for (const sa of socials) {
    handles[sa.platform] = sa.handle;
    if (!audience && sa.audience) audience = sa.audience;
  }

  const frozenRates = {
    deliverables: ds.map(d => ({
      id:               d.id,
      platform:         d.platform,
      deliverableType:  d.type,
      label:            d.label ?? undefined,
      targetCents:      d.finalRateCents,
      floorCents:       d.floorCents,
      stretchCents:     d.stretchCents,
      breakdown:        d.breakdown,
      // followers/engagementRateBps from the first social on this platform —
      // RateCard surfaces them as context labels.
      followers:         socials.find(s => s.platform === d.platform)?.followers ?? 0,
      engagementRateBps: socials.find(s => s.platform === d.platform)?.engagementRateBps ?? 0,
    })),
    audience,
    bio:        profile?.bio        ?? undefined,
    handles,
    avatarKey:  profile?.avatarKey  ?? undefined,
  };

  // One PUBLISHED RatePage per account at MVP. If one exists, replace it in
  // place so the existing token stays stable. Otherwise mint a fresh token.
  const existing = await db.query.ratePage.findFirst({
    where: and(eq(ratePage.accountId, accountId), eq(ratePage.status, "PUBLISHED")),
    orderBy: desc(ratePage.publishedAt),
  });

  const now = new Date();
  let token: string;

  if (existing) {
    token = existing.token;
    await db.update(ratePage)
      .set({ frozenRates, publishedAt: now })
      .where(eq(ratePage.id, existing.id));
  } else {
    token = generateToken();
    await db.insert(ratePage).values({
      accountId,
      token,
      status:      "PUBLISHED",
      frozenRates,
      publishedAt: now,
    });
  }

  // Use the public host the worker is actually serving so we don't accidentally
  // redirect a published creator to localhost from a stale env.
  const origin = env.NEXT_PUBLIC_APP_URL || env.BETTER_AUTH_URL || "";
  revalidatePath("/rates");
  redirect(origin ? `${origin}/r/${token}` : `/r/${token}`);
}
