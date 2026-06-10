/**
 * Drizzle + D1 — replaces the Prisma+adapter-d1 client we used pre-MVP.
 *
 * Two entry points:
 *   getDb(d1)                       — raw drizzle instance, for admin actions
 *                                     + global plane reads + the Better Auth adapter.
 *   getScopedDb(d1, userId)         — looks up the user's CreatorAccount.id and
 *                                     returns { db, accountId }. Use in every
 *                                     creator-plane server component.
 *
 * Why not auto-inject like the old code? Drizzle has no $extends middleware.
 * The previous Prisma-based getScopedDb pretended to inject `where: { accountId }`
 * but was passing User.id where the schema expects CreatorAccount.id — a latent
 * row-isolation bug that never tripped because SQLite doesn't enforce FKs by
 * default. We surface the lookup explicitly now; callers always see the right id.
 */

import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";

export type DB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Raw drizzle client backed by a D1 binding.
 */
export function getDb(d1: CloudflareEnv["DB"]): DB {
  return drizzle(d1, { schema });
}

/**
 * Resolve the user's CreatorAccount row and return a scoped client.
 *
 * Returns null when the user has no CreatorAccount yet (post-signup, pre-onboarding).
 * Callers should redirect to /onboarding in that case.
 *
 *   const scoped = await getScopedDb(env.DB, session.user.id);
 *   if (!scoped) redirect("/onboarding");
 *   const { db, accountId } = scoped;
 *
 *   const profile = await db.query.creatorProfile.findFirst({
 *     where: eq(creatorProfile.accountId, accountId),
 *   });
 */
export async function getScopedDb(
  d1: CloudflareEnv["DB"],
  userId: string,
): Promise<{ db: DB; accountId: string } | null> {
  const db = getDb(d1);
  const ca = await db.query.creatorAccount.findFirst({
    where: eq(schema.creatorAccount.ownerUserId, userId),
    columns: { id: true },
  });
  if (!ca) return null;
  return { db, accountId: ca.id };
}
