/**
 * Better Auth config — confirmed working on Workers/OpenNext (see SPIKES.md)
 *
 * Pattern: factory function, NOT a module-level singleton.
 * D1 binding is request-scoped in Workers, so auth must be created per-request.
 *
 * Session mechanism: cookie-based (signed, server-verified against D1).
 * No separate KV session store needed — KV remains dedicated to OpenNext cache.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { betterAuth }    = require("better-auth");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prismaAdapter } = require("@better-auth/prisma-adapter");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { nextCookies }   = require("better-auth/next-js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getPrisma }     = require("./db");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAuth(d1: CloudflareEnv["DB"]): any {
  const prisma = getPrisma(d1);

  return betterAuth({
    secret:  process.env.BETTER_AUTH_SECRET ?? "",
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

    database: prismaAdapter(prisma, { provider: "sqlite" }),

    plugins: [nextCookies()],

    session: {
      expiresIn:   60 * 60 * 24 * 7, // 7 days
      updateAge:   60 * 60 * 24,      // refresh daily
      cookieCache: { enabled: true, maxAge: 5 * 60 }, // 5-min client cache
    },

    emailAndPassword: { enabled: true },

    user: {
      additionalFields: {
        // isAdmin drives /admin role guard — set manually in DB for now
        // (No self-serve admin signup; set via wrangler d1 execute)
        role: {
          type: "string" as const,
          defaultValue: "USER",
          required: false,
        },
      },
    },
  });
}

/**
 * Get the current session from a server component or server action.
 *
 * Usage:
 *   import { headers } from "next/headers";
 *   const session = await getSession(env.DB, await headers());
 */
export async function getSession(
  d1: CloudflareEnv["DB"],
  requestHeaders: Headers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | null> {
  const auth = createAuth(d1);
  return auth.api.getSession({ headers: requestHeaders });
}

/**
 * Require a valid session — throws a redirect to /sign-in if missing.
 * Use in (creator) route layouts and server actions.
 */
export async function requireSession(
  d1: CloudflareEnv["DB"],
  requestHeaders: Headers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const session = await getSession(d1, requestHeaders);
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/sign-in");
  }
  return session;
}
