/**
 * drizzle-kit config — used to generate SQL migrations from src/db/schema.ts.
 *
 * `drizzle-kit generate` writes migrations into ./drizzle. Apply them to D1
 * via `wrangler d1 migrations apply britch-db --remote`. The wrangler.toml
 * `migrations_dir = "drizzle"` tells wrangler to look there.
 */

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema:  "./src/db/schema.ts",
  out:     "./drizzle",
  dialect: "sqlite",
});
