/**
 * Cloudflare Turnstile shared constants + verify helper.
 *
 * - SITEKEY is public (rendered into HTML for every visitor). Hardcoded
 *   instead of NEXT_PUBLIC_TURNSTILE_SITE_KEY because Next.js bakes
 *   NEXT_PUBLIC_* at build time, and our build env doesn't see wrangler.toml [vars].
 * - WORKER_URL points at the managed siteverify Worker deployed by the
 *   turnstile-spin skill. The Worker holds the secret (set via
 *   `wrangler secret put TURNSTILE_SECRET_KEY` on that Worker).
 * - verifyTurnstileToken() is called from the browser before any sensitive
 *   auth call (sign-up, sign-in). The browser must NEVER call
 *   challenges.cloudflare.com/turnstile/v0/siteverify directly — that path
 *   leaks the secret.
 */

export const TURNSTILE_SITEKEY    = "0x4AAAAAADhvaK0hY3deEHQt";
export const TURNSTILE_WORKER_URL = "https://turnstile-siteverify-britch.ashish-yamdagni.workers.dev";

// Telemetry marker — see skill docs/turnstile-spin. Account-level aggregate
// only; Cloudflare uses it to measure activation. Removing it doesn't break
// anything, you just lose segmentation in dashboard analytics.
export const TURNSTILE_ACTION = "turnstile-spin-v1";

export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(TURNSTILE_WORKER_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
