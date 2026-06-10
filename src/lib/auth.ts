/**
 * Better Auth config — Drizzle + D1.
 *
 * Pattern: factory function, NOT a module-level singleton.
 * D1 binding is request-scoped in Workers, so auth must be created per-request.
 *
 * Session mechanism: cookie-based (signed, server-verified against D1).
 * No separate KV session store needed — KV remains dedicated to OpenNext cache.
 */

import { betterAuth }       from "better-auth";
import { drizzleAdapter }   from "@better-auth/drizzle-adapter";
import { nextCookies }      from "better-auth/next-js";
import { getDb }            from "./db";
import * as schema          from "@/db/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAuth(d1: CloudflareEnv["DB"]): any {
  const db = getDb(d1);

  return betterAuth({
    secret:  process.env.BETTER_AUTH_SECRET ?? "",
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

    database: drizzleAdapter(db, {
      provider: "sqlite",
      // Our columns are camelCase (emailVerified, expiresAt, ...). Without this,
      // the adapter would generate snake_case (email_verified) and fail to find columns.
      camelCase: true,
      schema: {
        user:         schema.user,
        session:      schema.session,
        account:      schema.account,
        verification: schema.verification,
      },
    }),

    plugins: [nextCookies()],

    session: {
      expiresIn:   60 * 60 * 24 * 7, // 7 days
      updateAge:   60 * 60 * 24,      // refresh daily
      cookieCache: { enabled: true, maxAge: 5 * 60 }, // 5-min client cache
    },

    emailAndPassword: { enabled: true },

    user: {
      additionalFields: {
        // role drives /admin gate — set manually in DB ("USER" | "ADMIN")
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
 *   import { headers } from "next/headers";
 *   const session = await getSession(env.DB, await headers());
 */
export async function getSession(
  d1: CloudflareEnv["DB"],
  requestHeaders: Headers,
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
  requestHeaders: Headers,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const session = await getSession(d1, requestHeaders);
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/sign-in");
  }
  return session;
}
