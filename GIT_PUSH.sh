#!/bin/bash
# Run this from your Mac Terminal in the Britch folder:
#   cd "/Users/thethirdplace/Documents/AY PERSONAL/Claude Projects/Britch"
#   bash GIT_PUSH.sh

set -e
cd "$(dirname "$0")"

git add -A
git commit -m "feat: Step 6–8 complete — routes, UI, layouts, admin, seed-demo, SETUP+STATUS

Step 6 (complete):
- SeededProvider, ManualProvider, OEmbedProvider (TikTok/Instagram/Fallback)
- R2 fetch-once thumbnail caching
- Better Auth factory + getSession/requireSession helpers

Step 7 — Route skeleton (all MVP routes wired):
- app/admin/layout.tsx: hard ADMIN role guard via getRequestContext()
- app/(creator)/layout.tsx: requireSession() + AppShell
- AppShell + AdminShell layout components (sidebar, nav, sign-out)
- FloorBar, WhyThisRate, RateCard, AudiencePanel, WorkStrip, ProposalStatus, Ticker
- /r/[token]: fully wired public rate page — reads frozenRates from DB, renders
  Sarah Creates engine-computed rates with Britch brand styling
- /p/[token]: public proposal page with line items + read receipt
- /sign-in and /sign-up with Cloudflare Turnstile
- Onboarding wizard (4-step client component)
- Creator routes: dashboard, analytics, rates, proposals, brands, settings
- Admin routes: overview, benchmarks, multipliers, niches, engine, seed-creators, providers
- prisma/seed-demo.sql: Sarah Creates full creator plane — /r/demo-sarah works end-to-end

Step 8:
- SETUP.md: env vars, wrangler resources, migrations, seed, local dev, deploy, admin setup
- STATUS.md: complete build status, known gaps, deferred V1.1/V2 list, next steps

Fixes:
- CloudflareEnv: added R2_PUBLIC_URL, BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL
- wrangler.toml: added missing vars (BETTER_AUTH_SECRET, BETTER_AUTH_URL, R2_PUBLIC_URL)
- admin/actions.ts: replaced process.env.DB hack with getRequestContext()
- All admin page guards use getRequestContext() consistently"

git push origin main
echo "✓ Pushed to github.com/sheesh-yams/Britch"
