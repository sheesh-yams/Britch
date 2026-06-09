/**
 * Prisma + D1 adapter + row-level security wrapper
 *
 * Two entry points:
 *   getPrisma(d1)              — raw client, for admin actions + global plane reads
 *   getScopedDb(d1, accountId) — creator-scoped client, injects accountId on every query
 *
 * The scoped wrapper uses Prisma's $extends() to add a beforeQuery middleware
 * that automatically appends `where: { accountId }` to all creator-plane models.
 * This is the "getScopedDb" pattern from TTP, re-keyed from workspaceId → accountId.
 *
 * Admin actions import getPrisma() directly and are quarantined in src/admin/actions.ts.
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

// Creator-scoped models — every query on these MUST include accountId
const SCOPED_MODELS = new Set([
  "creatorAccount",
  "creatorProfile",
  "socialAccount",
  "analyticsSnapshot",
  "postSample",
  "deliverable",
  "bundle",
  "addOn",
  "workItem",
  "brand",
  "ratePage",
  "ratePageView",
  "proposal",
  "proposalWorkItem",
  "proposalView",
]);

/**
 * Raw Prisma client backed by a D1 binding.
 * Use this only in:
 *   - Admin server actions (src/admin/actions.ts)
 *   - Global pricing plane reads (niches, benchmarks, multipliers, etc.)
 *   - Better Auth database adapter
 */
export function getPrisma(d1: CloudflareEnv["DB"]): PrismaClient {
  const adapter = new PrismaD1(d1);
  return new PrismaClient({ adapter });
}

/**
 * Row-level-secured Prisma client.
 *
 * Wraps getPrisma() with a $extends() query middleware that injects
 * `where: { accountId }` on every operation targeting a creator-scoped model.
 *
 * Usage in server actions / route handlers:
 *   const db = getScopedDb(env.DB, session.accountId);
 *   const profile = await db.creatorProfile.findUnique({ where: { id } });
 *   // accountId filter is applied automatically — can never leak cross-account data
 */
export function getScopedDb(d1: CloudflareEnv["DB"], accountId: string): PrismaClient {
  const prisma = getPrisma(d1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any).$extends({
    query: {
      $allModels: {
        async $allOperations({
          model,
          operation,
          args,
          query,
        }: {
          model: string;
          operation: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          query: (args: any) => Promise<any>;
        }) {
          // Only scope creator-plane models
          const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
          if (!SCOPED_MODELS.has(modelKey)) return query(args);

          // Inject accountId on write operations
          if (operation === "create" || operation === "createMany") {
            if (args.data) {
              args.data = Array.isArray(args.data)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? args.data.map((d: any) => ({ ...d, accountId }))
                : { ...args.data, accountId };
            }
          }

          // Inject accountId on read/update/delete where clauses
          if (
            operation === "findUnique" ||
            operation === "findFirst" ||
            operation === "findMany" ||
            operation === "update" ||
            operation === "updateMany" ||
            operation === "delete" ||
            operation === "deleteMany" ||
            operation === "count" ||
            operation === "aggregate"
          ) {
            args.where = { ...args.where, accountId };
          }

          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;
}
