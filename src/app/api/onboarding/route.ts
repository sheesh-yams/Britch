/**
 * POST /api/onboarding
 *
 * Called once at the end of the 4-step onboarding wizard. Creates the user's
 * CreatorAccount, CreatorProfile, and one SocialAccount per selected platform.
 *
 * Behavior is idempotent — if the user submits a second time (re-onboarding),
 * the existing rows are updated rather than duplicated.
 *
 * NOTE: this only sets up the creator's *identity*. Deliverables (rates) get
 * populated later by a separate "Generate Rates" step once the global pricing
 * plane is seeded (Niche / CpmBenchmark / FormatMultiplier / EngineParams rows).
 */

import { headers }            from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq }                  from "drizzle-orm";
import { z }                   from "zod";
import { getSession }          from "@/lib/auth";
import { getDb }               from "@/lib/db";
import { creatorAccount, creatorProfile, socialAccount, postSample } from "@/db/schema";
import { computeAndStoreDeliverables, type Platform } from "@/lib/rates";

export const dynamic = "force-dynamic";

const OnboardingSchema = z.object({
  displayName: z.string().min(1).max(80),
  niche:       z.string().max(40).optional().default(""),
  bio:         z.string().max(500).optional().default(""),
  platforms:   z.array(z.enum(["TIKTOK", "INSTAGRAM"])).min(1),
  handles:     z.record(z.string(), z.string()).default({}),
  followers:   z.record(z.string(), z.string()).default({}),
  engagement:  z.record(z.string(), z.string()).default({}),
  // Free-form: a textarea of view counts per platform — one per line or
  // comma-separated. We parse, take up to 20, and write PostSample rows.
  videoViews:  z.record(z.string(), z.string()).default({}),
});

/**
 * Parse a free-form textarea of view counts into a list of integers.
 *  - splits on newlines, commas, spaces, semicolons
 *  - strips $ , and decimals; "12.5K" / "12K" → 12500 / 12000
 *  - drops non-numeric tokens
 *  - caps at 20 entries
 */
function parseViewCounts(input: string): number[] {
  if (!input) return [];
  return input
    .split(/[\n,;\s]+/)
    .map(raw => {
      const t = raw.trim().replace(/[$,]/g, "");
      if (!t) return NaN;
      const km = t.match(/^([0-9]*\.?[0-9]+)\s*([kKmM]?)$/);
      if (!km) return NaN;
      const n = parseFloat(km[1]);
      if (!Number.isFinite(n)) return NaN;
      const mult = km[2].toLowerCase() === "m" ? 1_000_000 : km[2].toLowerCase() === "k" ? 1_000 : 1;
      return Math.round(n * mult);
    })
    .filter(n => Number.isFinite(n) && n > 0)
    .slice(0, 20);
}

export async function POST(req: Request) {
  const { env } = getCloudflareContext();

  const session = await getSession(env.DB, await headers());
  if (!session?.user) {
    return Response.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  let payload: z.infer<typeof OnboardingSchema>;
  try {
    const raw = await req.json();
    payload = OnboardingSchema.parse(raw);
  } catch (err) {
    return Response.json(
      { ok: false, error: "Invalid payload", detail: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  const db = getDb(env.DB);

  // 1. Find or create the CreatorAccount.
  let ca = await db.query.creatorAccount.findFirst({
    where: eq(creatorAccount.ownerUserId, session.user.id),
  });
  if (!ca) {
    const [created] = await db.insert(creatorAccount)
      .values({ ownerUserId: session.user.id })
      .returning();
    ca = created;
  }

  // 2. Upsert the CreatorProfile.
  const niches = payload.niche ? [payload.niche.toLowerCase()] : [];
  const profileValues = {
    displayName: payload.displayName,
    bio:         payload.bio || null,
    niches,
  };

  const existingProfile = await db.query.creatorProfile.findFirst({
    where: eq(creatorProfile.accountId, ca.id),
  });

  if (existingProfile) {
    await db.update(creatorProfile)
      .set(profileValues)
      .where(eq(creatorProfile.id, existingProfile.id));
  } else {
    await db.insert(creatorProfile).values({
      accountId: ca.id,
      ...profileValues,
    });
  }

  // 3. Upsert one SocialAccount per selected platform, store PostSample rows,
  //    then compute rates from the real per-video view sample.
  let deliverableCount = 0;
  for (const platform of payload.platforms) {
    const rawHandle = (payload.handles[platform] ?? "").trim();
    if (!rawHandle) continue;
    const handle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;
    const followers = Math.max(0, parseInt(payload.followers[platform] ?? "0", 10) || 0);
    // engagement comes in as "4.5" meaning 4.5%; store as basis points (450).
    // Engagement is a quality MULTIPLIER on the rate (0.7×–1.3×). It does NOT
    // contribute to reach — reach comes from the video-views sample below.
    const engagementRateBps = Math.max(
      0,
      Math.round((parseFloat(payload.engagement[platform] ?? "0") || 0) * 100),
    );

    // Parse the last-20 view sample. Mean of organic views = avgReach.
    const sampleViews = parseViewCounts(payload.videoViews[platform] ?? "");
    const avgViews =
      sampleViews.length > 0
        ? Math.round(sampleViews.reduce((a, b) => a + b, 0) / sampleViews.length)
        : 0;

    // Upsert the SocialAccount. avgViews holds the computed sample mean (or 0).
    const [saRow] = await db
      .insert(socialAccount)
      .values({
        accountId: ca.id,
        platform,
        handle,
        followers,
        engagementRateBps,
        avgViews,
        source: "SELF_REPORTED",
      })
      .onConflictDoUpdate({
        target: [socialAccount.accountId, socialAccount.platform],
        set: { handle, followers, engagementRateBps, avgViews, disconnectedAt: null },
      })
      .returning();

    // 4. Replace any prior PostSample rows for this social with the new sample
    //    so re-running onboarding doesn't double up entries.
    if (saRow && sampleViews.length > 0) {
      await db.delete(postSample).where(eq(postSample.socialAccountId, saRow.id));
      await db.insert(postSample).values(
        sampleViews.map(views => ({
          socialAccountId: saRow.id,
          accountId: ca.id,
          platform,
          views,
          isPaid: false,
        })),
      );
    }

    // 5. Compute initial Deliverables. Pass the parsed sample directly so the
    //    rates reflect the real video reach the creator just entered.
    try {
      const { created } = await computeAndStoreDeliverables(db, ca.id, {
        platform:           platform as Platform,
        followers,
        engagementRateBps,
        avgViews,
        organicPostViews:   sampleViews,
      });
      deliverableCount += created;
    } catch {
      // Don't fail onboarding because the rate engine had a hiccup — the
      // creator's identity is saved either way. They can recompute from /rates.
    }
  }

  return Response.json({ ok: true, accountId: ca.id, deliverables: deliverableCount });
}
