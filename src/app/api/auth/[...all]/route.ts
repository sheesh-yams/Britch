/**
 * Better Auth API handler
 * Confirmed working on Workers/OpenNext — see SPIKES.md § Spike 2a
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/lib/auth";

// Route segment config — auth handlers must not be prerendered or statically analyzed
export const dynamic = "force-dynamic";

// Lazy: only construct better-auth + Prisma on first request, never at module load.
// Module load happens during Next.js build ("Collecting page data") where there is
// no Cloudflare context yet — instantiating Prisma there throws.
type Handlers = { GET: (req: Request) => Response | Promise<Response>; POST: (req: Request) => Response | Promise<Response> };
let handlers: Handlers | null = null;

function getHandlers(): Handlers {
  if (handlers) return handlers;
  const { env } = getCloudflareContext();
  const auth = createAuth(env.DB);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { toNextJsHandler } = require("better-auth/next-js");
  handlers = toNextJsHandler(auth) as Handlers;
  return handlers;
}

export async function GET(req: Request)  { return getHandlers().GET(req); }
export async function POST(req: Request) { return getHandlers().POST(req); }
