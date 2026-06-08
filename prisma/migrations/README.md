# Britch D1 Migrations

Using manual SQL migrations (not `prisma migrate`) because:
- D1 adapter requires `driverAdapters` preview feature
- `prisma migrate` cannot connect to D1 at CLI time
- `prisma generate` works fine locally after `npm install`

## Apply locally (dev)
```bash
npx wrangler d1 migrations apply britch-db --local
```

## Apply to production
```bash
npx wrangler d1 migrations apply britch-db --remote
```

## After schema changes
1. Write a new `migrations/XXXX_description/migration.sql`
2. Apply with wrangler as above
3. `npm run db:generate` to regenerate Prisma client
