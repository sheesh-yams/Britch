# Britch — Setup Guide

> Prerequisites: Node 20+, `wrangler` CLI authenticated, a Cloudflare account.

---

## 1. Clone & install

```bash
git clone https://github.com/sheesh-yams/Britch.git
cd Britch
npm install
```

---

## 2. Create Cloudflare resources

Run these once. Copy the IDs into `wrangler.toml`.

```bash
# D1 database
npx wrangler d1 create britch-db
# → outputs: database_id = "xxxx"

# KV namespace (used by OpenNext incremental cache)
npx wrangler kv namespace create CACHE
# → outputs: id = "xxxx"

# R2 bucket
npx wrangler r2 bucket create britch-assets
```

Update `wrangler.toml` with the IDs:

```toml
[[d1_databases]]
database_id = "YOUR_D1_ID"

[[kv_namespaces]]
id = "YOUR_KV_ID"
```

---

## 3. Environment variables

Set secrets via wrangler (never commit these):

```bash
npx wrangler secret put BETTER_AUTH_SECRET
# Enter a random 32+ char string

npx wrangler secret put RESEND_API_KEY
# Enter your Resend API key (get one free at resend.com)

npx wrangler secret put TURNSTILE_SECRET_KEY
# From Cloudflare Turnstile dashboard
```

Update `wrangler.toml` `[vars]` with your public values:

```toml
[vars]
BETTER_AUTH_URL = "https://your-app.workers.dev"
NEXT_PUBLIC_APP_URL = "https://your-app.workers.dev"
NEXT_PUBLIC_TURNSTILE_SITE_KEY = "YOUR_TURNSTILE_SITE_KEY"
R2_PUBLIC_URL = "https://pub-xxx.r2.dev"  # from R2 bucket settings
```

For local dev, create `.dev.vars`:

```
BETTER_AUTH_SECRET=dev-secret-change-in-prod-please-use-32chars
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_xxxx
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA  # Cloudflare test key (always passes)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA             # Cloudflare test site key
R2_PUBLIC_URL=
```

---

## 4. Database migrations

```bash
# Local dev
npx wrangler d1 migrations apply britch-db --local

# Production
npx wrangler d1 migrations apply britch-db
```

---

## 5. Seed the database

Two seed files — run in order:

```bash
# Global pricing plane (niches, CPM benchmarks, format multipliers, engine params, ProviderConfig)
npx wrangler d1 execute britch-db --local --file=./prisma/seed.sql

# Demo creator plane (Sarah Creates account + rate page at /r/demo-sarah)
npx wrangler d1 execute britch-db --local --file=./prisma/seed-demo.sql
```

For production:

```bash
npx wrangler d1 execute britch-db --file=./prisma/seed.sql
npx wrangler d1 execute britch-db --file=./prisma/seed-demo.sql
```

---

## 6. Local development

```bash
npm run dev
```

This runs Next.js dev server against local D1/KV/R2 via wrangler bindings.

Test the demo rate page: [http://localhost:3000/r/demo-sarah](http://localhost:3000/r/demo-sarah)

---

## 7. Make a user admin

After signing up, grant yourself admin role:

```bash
npx wrangler d1 execute britch-db --local \
  --command="UPDATE User SET role='ADMIN' WHERE email='your@email.com';"
```

Then visit [http://localhost:3000/admin](http://localhost:3000/admin).

---

## 8. Build & deploy

```bash
npm run build
npx wrangler deploy
```

Or via CI — see `.github/workflows/` (not yet created, see STATUS.md).

---

## 9. Generate seed SQL from TypeScript

If you modify `scripts/seed.ts`:

```bash
npx tsx scripts/seed.ts
# → writes prisma/seed.sql
```

---

## Key URLs

| Path | Description |
|------|-------------|
| `/sign-up` | Create a creator account |
| `/sign-in` | Sign in |
| `/onboarding` | Creator setup wizard |
| `/dashboard` | Creator home |
| `/r/demo-sarah` | Public demo rate page (Sarah Creates) |
| `/admin` | Admin panel (ADMIN role required) |

---

## Troubleshooting

**`getRequestContext()` returns null in local dev**
Ensure you're running `npm run dev` (which uses wrangler), not `next dev` directly. The bindings only exist inside the Workers runtime.

**`prisma generate` fails**
This project uses `@prisma/adapter-d1` with `driverAdapters` preview. The migration SQL is in `prisma/migrations/` — apply it with wrangler, not `prisma migrate`. You don't need `prisma generate` to run the app; only needed for TS type generation if you change the schema.

**Better Auth: "Missing secret"**
Check `.dev.vars` exists and `BETTER_AUTH_SECRET` is set.

**Empty rate page at `/r/demo-sarah`**
Run `seed.sql` first (global plane), then `seed-demo.sql` (creator plane). Order matters — FK references.
