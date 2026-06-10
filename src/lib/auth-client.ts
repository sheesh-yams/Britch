/**
 * Better Auth browser client
 * Used in client components for sign-in/sign-up/sign-out.
 *
 * baseURL is resolved at runtime in the browser (window.location.origin) so
 * it always matches the deployed origin — not whatever NEXT_PUBLIC_APP_URL
 * happened to be at build time. During SSR/build we fall back to the env
 * var if present, then localhost; neither path is exercised in production.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createAuthClient } = require("better-auth/react");

const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({ baseURL });

export const { signIn, signUp, signOut, useSession } = authClient;
