/**
 * Better Auth API handler
 * Confirmed working on Workers/OpenNext — see SPIKES.md § Spike 2a
 */

import { createAuth } from "@/lib/auth";

// Cloudflare Workers: env bindings come via the request context
// OpenNext exposes them via process.env and the cloudflare() helper
declare const process: { env: CloudflareEnv & NodeJS.ProcessEnv };

function getD1(): CloudflareEnv["DB"] {
  // In Workers, D1 is available via the binding name set in wrangler.toml
  // OpenNext/Next.js 15 exposes Cloudflare bindings via `getCloudflareContext()`
  // For now use a type cast; wired properly in production via the CF adapter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (process.env as any).DB as CloudflareEnv["DB"];
}

function makeHandlers() {
  const auth = createAuth(getD1());
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { toNextJsHandler } = require("better-auth/next-js");
  return toNextJsHandler(auth);
}

export const { GET, POST } = makeHandlers();
