/**
 * Better Auth browser client
 * Used in client components for sign-in/sign-up/sign-out.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createAuthClient } = require("better-auth/react");

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
