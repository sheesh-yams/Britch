-- Britch — Global pricing plane seed
-- Run: npx wrangler d1 execute britch-db --remote --file=./drizzle/seed.sql
-- Idempotent — uses INSERT OR REPLACE / INSERT OR IGNORE on primary key.

-- ─── 1. Niches ────────────────────────────────────────────────────────────────

INSERT OR REPLACE INTO niche (id, slug, label, isActive, "order") VALUES
  ('niche_lifestyle',  'lifestyle',  'Lifestyle',  1, 1),
  ('niche_beauty',     'beauty',     'Beauty',     1, 2),
  ('niche_food',       'food',       'Food',       1, 3),
  ('niche_fitness',    'fitness',    'Fitness',    1, 4),
  ('niche_tech',       'tech',       'Tech',       1, 5),
  ('niche_gaming',     'gaming',     'Gaming',     1, 6),
  ('niche_fashion',    'fashion',    'Fashion',    1, 7),
  ('niche_finance',    'finance',    'Finance',    1, 8),
  ('niche_travel',     'travel',     'Travel',     1, 9),
  ('niche_comedy',     'comedy',     'Comedy',     1, 10);

-- ─── 2. Generic CPM benchmarks (nicheId NULL = generic) ──────────────────────
-- cpmCents = cents per 1,000 reach. IG $12 = 1200, TT $10 = 1000.

INSERT OR REPLACE INTO cpmBenchmark
  (id, platform, nicheId, followerTier, cpmCents, source, effectiveDate, isActive, createdAt, updatedAt)
VALUES
  ('cpm_ig_nano',   'INSTAGRAM', NULL, 'NANO',   1200, '2026 benchmark — admin-tunable', 1781050000000, 1, 1781050000000, 1781050000000),
  ('cpm_ig_micro',  'INSTAGRAM', NULL, 'MICRO',  1200, '2026 benchmark — admin-tunable', 1781050000000, 1, 1781050000000, 1781050000000),
  ('cpm_ig_mid',    'INSTAGRAM', NULL, 'MID',    1200, '2026 benchmark — admin-tunable', 1781050000000, 1, 1781050000000, 1781050000000),
  ('cpm_ig_macro',  'INSTAGRAM', NULL, 'MACRO',  1200, '2026 benchmark — admin-tunable', 1781050000000, 1, 1781050000000, 1781050000000),
  ('cpm_tt_nano',   'TIKTOK',    NULL, 'NANO',   1000, '2026 benchmark — admin-tunable', 1781050000000, 1, 1781050000000, 1781050000000),
  ('cpm_tt_micro',  'TIKTOK',    NULL, 'MICRO',  1000, '2026 benchmark — admin-tunable', 1781050000000, 1, 1781050000000, 1781050000000),
  ('cpm_tt_mid',    'TIKTOK',    NULL, 'MID',    1000, '2026 benchmark — admin-tunable', 1781050000000, 1, 1781050000000, 1781050000000),
  ('cpm_tt_macro',  'TIKTOK',    NULL, 'MACRO',  1000, '2026 benchmark — admin-tunable', 1781050000000, 1, 1781050000000, 1781050000000);

-- ─── 3. Format multipliers (bps; 10000 = 1.0× baseline video unit) ───────────

INSERT OR REPLACE INTO formatMultiplier
  (id, platform, deliverableType, multiplierBps, isActive, createdAt, updatedAt)
VALUES
  ('mult_ig_reel',     'INSTAGRAM', 'REEL',     10000, 1, 1781050000000, 1781050000000),
  ('mult_ig_carousel', 'INSTAGRAM', 'CAROUSEL',  8500, 1, 1781050000000, 1781050000000),
  ('mult_ig_story',    'INSTAGRAM', 'STORY',     5000, 1, 1781050000000, 1781050000000),
  ('mult_tt_video',    'TIKTOK',    'VIDEO',    10000, 1, 1781050000000, 1781050000000),
  ('mult_tt_slide',    'TIKTOK',    'SLIDE',     5000, 1, 1781050000000, 1781050000000),
  ('mult_tt_story',    'TIKTOK',    'STORY',     5000, 1, 1781050000000, 1781050000000),
  ('mult_tt_live',     'TIKTOK',    'LIVE',     12000, 1, 1781050000000, 1781050000000);

-- ─── 4. EngineParams (singleton active) ──────────────────────────────────────

INSERT OR REPLACE INTO engineParams
  (id, version, isActive, label, reachWeightBps, followerWeightBps, benchmarkEngagementBps,
   engAdjMinBps, engAdjMaxBps, roundingCents, floorSpreadBps, stretchSpreadBps,
   createdAt, updatedAt)
VALUES
  ('engine_params_v1', 2, 1, 'v2 — pure reach pricing',
   -- reachWeightBps=10000 means 100% of the rate comes from average video
   -- reach. Followers contribute 0 to the rate. Britch's thesis baked into
   -- the engine: you are priced on what you actually deliver (views), not
   -- on a vanity number (followers). The follower count still informs the
   -- CPM tier lookup (NANO/MICRO/MID/MACRO).
   10000, 0, 300,
   7000, 13000, 5000, 2000, 2000,
   1781050000000, 1781050000000);

-- ─── 5. ProviderConfig (singleton; defaults to SEEDED) ───────────────────────

INSERT OR REPLACE INTO providerConfig (id, activeAnalyticsProvider, oembedTokens, updatedAt) VALUES
  ('provider_config_1', 'SEEDED', '{}', 1781050000000);

-- ─── 6. Demo SeedCreator — TikTok + Instagram (generic "Creator" persona) ────
-- Used by SeededProvider when a creator types @creator_demo / @creator.demo
-- into the onboarding handle field.

INSERT OR REPLACE INTO seedCreator
  (id, handle, platform, displayName, snapshot, postSample, isActive, createdAt, updatedAt)
VALUES
  ('seed_creator_tiktok',
   '@creator_demo',
   'TIKTOK',
   'Creator Name',
   '{"platform":"TIKTOK","handle":"@creator_demo","followers":500000,"engagementRateBps":450,"avgViews":150000,"audience":{"gender":{"Female":64,"Male":32,"Other":4},"ageBands":{"18-24":38,"25-34":42,"35-44":14,"45+":6},"topCountries":[{"code":"US","label":"United States","pct":45},{"code":"UK","label":"United Kingdom","pct":18},{"code":"CA","label":"Canada","pct":12},{"code":"AU","label":"Australia","pct":8}]},"source":"SEEDED"}',
   '[{"views":162000,"isPaid":false},{"views":148000,"isPaid":false},{"views":201000,"isPaid":false},{"views":137000,"isPaid":false},{"views":172000,"isPaid":false},{"views":143000,"isPaid":true},{"views":155000,"isPaid":false},{"views":168000,"isPaid":false},{"views":131000,"isPaid":false},{"views":189000,"isPaid":false},{"views":145000,"isPaid":false},{"views":177000,"isPaid":false},{"views":122000,"isPaid":false},{"views":194000,"isPaid":false},{"views":138000,"isPaid":false},{"views":160000,"isPaid":true},{"views":151000,"isPaid":false},{"views":143000,"isPaid":false},{"views":167000,"isPaid":false},{"views":158000,"isPaid":false}]',
   1, 1781050000000, 1781050000000),

  ('seed_creator_instagram',
   '@creator.demo',
   'INSTAGRAM',
   'Creator Name',
   '{"platform":"INSTAGRAM","handle":"@creator.demo","followers":245000,"engagementRateBps":380,"avgViews":70000,"audience":{"gender":{"Female":64,"Male":32,"Other":4},"ageBands":{"18-24":38,"25-34":42,"35-44":14,"45+":6},"topCountries":[{"code":"US","label":"United States","pct":45},{"code":"UK","label":"United Kingdom","pct":18},{"code":"CA","label":"Canada","pct":12},{"code":"AU","label":"Australia","pct":8}]},"source":"SEEDED"}',
   '[{"views":73000,"isPaid":false},{"views":68000,"isPaid":false},{"views":82000,"isPaid":false},{"views":64000,"isPaid":false},{"views":79000,"isPaid":false},{"views":71000,"isPaid":true},{"views":67000,"isPaid":false},{"views":76000,"isPaid":false},{"views":59000,"isPaid":false},{"views":88000,"isPaid":false},{"views":65000,"isPaid":false},{"views":74000,"isPaid":false},{"views":61000,"isPaid":false},{"views":83000,"isPaid":false},{"views":70000,"isPaid":false},{"views":77000,"isPaid":true},{"views":66000,"isPaid":false},{"views":72000,"isPaid":false},{"views":69000,"isPaid":false},{"views":75000,"isPaid":false}]',
   1, 1781050000000, 1781050000000);
