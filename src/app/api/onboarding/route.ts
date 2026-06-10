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
import { creatorAccount, creatorProfile, socialAccount } from "@/db/schema";
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
  avgViews:    z.record(z.string(), z.string()).default({}),
});

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

  // 3. Upsert one SocialAccount per selected platform, then compute rates.
  let deliverableCount = 0;
  for (const platform of payload.platforms) {
    const rawHandle = (payload.handles[platform] ?? "").trim();
    if (!rawHandle) continue;
    const handle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;
    const followers = Math.max(0, parseInt(payload.followers[platform] ?? "0", 10) || 0);
    // engagement comes in as "4.5" meaning 4.5%; store as basis points (450).
    const engagementRateBps = Math.max(
      0,
      Math.round((parseFloat(payload.engagement[platform] ?? "0") || 0) * 100),
    );
    // avgViews: creator-entered "average organic views" — drives the rate engine.
    // If they leave it blank, synthesize a sensible default: ~30% of followers
    // (a typical organic reach ratio). Real PostSample replaces this later.
    const enteredAvgViews = Math.max(0, parseInt(payload.avgViews[platform] ?? "0", 10) || 0);
    const avgViews = enteredAvgViews > 0 ? enteredAvgViews : Math.round(followers * 0.3);

    await db.insert(socialAccount)
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
      });

    // 4. Compute initial Deliverables for this platform. Best-effort: if the
    //    global pricing plane isn't seeded, we return ok:true anyway with
    //    deliverableCount=0 and the dashboard surfaces "no rates yet" cleanly.
    try {
      const { created } = await computeAndStoreDeliverables(db, ca.id, {
        platform: platform as Platform,
        followers,
        engagementRateBps,
        avgViews,
      });
      deliverableCount += created;
    } catch {
      // Don't fail onboarding because the rate engine had a hiccup — the
      // creator's identity is saved either way. They can recompute from /rates.
    }
  }

  return Response.json({ ok: true, accountId: ca.id, deliverables: deliverableCount });
}
