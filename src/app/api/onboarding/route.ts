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

export const dynamic = "force-dynamic";

const OnboardingSchema = z.object({
  displayName: z.string().min(1).max(80),
  niche:       z.string().max(40).optional().default(""),
  bio:         z.string().max(500).optional().default(""),
  platforms:   z.array(z.enum(["TIKTOK", "INSTAGRAM"])).min(1),
  handles:     z.record(z.string(), z.string()).default({}),
  followers:   z.record(z.string(), z.string()).default({}),
  engagement:  z.record(z.string(), z.string()).default({}),
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

  // 3. Upsert one SocialAccount per selected platform.
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

    await db.insert(socialAccount)
      .values({
        accountId: ca.id,
        platform,
        handle,
        followers,
        engagementRateBps,
        avgViews: 0,
        source: "SELF_REPORTED",
      })
      .onConflictDoUpdate({
        target: [socialAccount.accountId, socialAccount.platform],
        set: { handle, followers, engagementRateBps, disconnectedAt: null },
      });
  }

  return Response.json({ ok: true, accountId: ca.id });
}
