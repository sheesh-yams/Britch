-- Britch Seed Data
-- Run: npx wrangler d1 execute britch-db --local --file=./prisma/seed.sql

DELETE FROM "ProviderConfig";
DELETE FROM "SeedCreator";
DELETE FROM "EngineParams";
DELETE FROM "FormatMultiplier";
DELETE FROM "CpmBenchmark";
DELETE FROM "Niche";

-- 1. Niches
INSERT INTO "Niche" ("id","slug","label","isActive","order") VALUES ('niche_lifestyle','lifestyle','Lifestyle',1,1);
INSERT INTO "Niche" ("id","slug","label","isActive","order") VALUES ('niche_beauty','beauty','Beauty',1,2);
INSERT INTO "Niche" ("id","slug","label","isActive","order") VALUES ('niche_food','food','Food',1,3);
INSERT INTO "Niche" ("id","slug","label","isActive","order") VALUES ('niche_fitness','fitness','Fitness',1,4);
INSERT INTO "Niche" ("id","slug","label","isActive","order") VALUES ('niche_tech','tech','Tech',1,5);
INSERT INTO "Niche" ("id","slug","label","isActive","order") VALUES ('niche_gaming','gaming','Gaming',1,6);
INSERT INTO "Niche" ("id","slug","label","isActive","order") VALUES ('niche_fashion','fashion','Fashion',1,7);
INSERT INTO "Niche" ("id","slug","label","isActive","order") VALUES ('niche_finance','finance','Finance',1,8);
INSERT INTO "Niche" ("id","slug","label","isActive","order") VALUES ('niche_travel','travel','Travel',1,9);
INSERT INTO "Niche" ("id","slug","label","isActive","order") VALUES ('niche_comedy','comedy','Comedy',1,10);

-- 2. CPM benchmarks
INSERT INTO "CpmBenchmark" ("id","platform","nicheId","followerTier","cpmCents","source","effectiveDate","isActive","createdAt","updatedAt") VALUES ('cpm_ig_nano','INSTAGRAM',NULL,'NANO',1200,'2026 benchmark','2026-06-08T10:02:58.717Z',1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
INSERT INTO "CpmBenchmark" ("id","platform","nicheId","followerTier","cpmCents","source","effectiveDate","isActive","createdAt","updatedAt") VALUES ('cpm_ig_micro','INSTAGRAM',NULL,'MICRO',1200,'2026 benchmark','2026-06-08T10:02:58.717Z',1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
INSERT INTO "CpmBenchmark" ("id","platform","nicheId","followerTier","cpmCents","source","effectiveDate","isActive","createdAt","updatedAt") VALUES ('cpm_ig_mid','INSTAGRAM',NULL,'MID',1200,'2026 benchmark','2026-06-08T10:02:58.717Z',1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
INSERT INTO "CpmBenchmark" ("id","platform","nicheId","followerTier","cpmCents","source","effectiveDate","isActive","createdAt","updatedAt") VALUES ('cpm_ig_macro','INSTAGRAM',NULL,'MACRO',1200,'2026 benchmark','2026-06-08T10:02:58.717Z',1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
INSERT INTO "CpmBenchmark" ("id","platform","nicheId","followerTier","cpmCents","source","effectiveDate","isActive","createdAt","updatedAt") VALUES ('cpm_tt_nano','TIKTOK',NULL,'NANO',1000,'2026 benchmark','2026-06-08T10:02:58.717Z',1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
INSERT INTO "CpmBenchmark" ("id","platform","nicheId","followerTier","cpmCents","source","effectiveDate","isActive","createdAt","updatedAt") VALUES ('cpm_tt_micro','TIKTOK',NULL,'MICRO',1000,'2026 benchmark','2026-06-08T10:02:58.717Z',1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
INSERT INTO "CpmBenchmark" ("id","platform","nicheId","followerTier","cpmCents","source","effectiveDate","isActive","createdAt","updatedAt") VALUES ('cpm_tt_mid','TIKTOK',NULL,'MID',1000,'2026 benchmark','2026-06-08T10:02:58.717Z',1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
INSERT INTO "CpmBenchmark" ("id","platform","nicheId","followerTier","cpmCents","source","effectiveDate","isActive","createdAt","updatedAt") VALUES ('cpm_tt_macro','TIKTOK',NULL,'MACRO',1000,'2026 benchmark','2026-06-08T10:02:58.717Z',1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');

-- 3. Format multipliers
INSERT INTO "FormatMultiplier" ("id","platform","deliverableType","multiplierBps","isActive","createdAt","updatedAt") VALUES ('mult_ig_reel','INSTAGRAM','REEL',10000,1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
INSERT INTO "FormatMultiplier" ("id","platform","deliverableType","multiplierBps","isActive","createdAt","updatedAt") VALUES ('mult_ig_carousel','INSTAGRAM','CAROUSEL',8500,1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
INSERT INTO "FormatMultiplier" ("id","platform","deliverableType","multiplierBps","isActive","createdAt","updatedAt") VALUES ('mult_ig_story','INSTAGRAM','STORY',5000,1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
INSERT INTO "FormatMultiplier" ("id","platform","deliverableType","multiplierBps","isActive","createdAt","updatedAt") VALUES ('mult_tt_video','TIKTOK','VIDEO',10000,1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
INSERT INTO "FormatMultiplier" ("id","platform","deliverableType","multiplierBps","isActive","createdAt","updatedAt") VALUES ('mult_tt_slide','TIKTOK','SLIDE',5000,1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
INSERT INTO "FormatMultiplier" ("id","platform","deliverableType","multiplierBps","isActive","createdAt","updatedAt") VALUES ('mult_tt_story','TIKTOK','STORY',5000,1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
INSERT INTO "FormatMultiplier" ("id","platform","deliverableType","multiplierBps","isActive","createdAt","updatedAt") VALUES ('mult_tt_live','TIKTOK','LIVE',12000,1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');

-- 4. EngineParams
INSERT INTO "EngineParams" ("id","version","isActive","label","reachWeightBps","followerWeightBps","benchmarkEngagementBps","engAdjMinBps","engAdjMaxBps","roundingCents","floorSpreadBps","stretchSpreadBps","createdAt","updatedAt") VALUES ('engine_params_v1',1,1,'v1 — launch defaults',8500,1500,300,7000,13000,5000,2000,2000,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');

-- 5. ProviderConfig
INSERT INTO "ProviderConfig" ("id","activeAnalyticsProvider","oembedTokens","updatedAt") VALUES ('provider_config_1','SEEDED','{}','2026-06-08T10:02:58.717Z');

-- 6. Sarah Creates — TikTok
INSERT INTO "SeedCreator" ("id","handle","platform","displayName","snapshot","postSample","isActive","createdAt","updatedAt") VALUES ('seed_sarah_tiktok','@sarah_creates','TIKTOK','Sarah Creates','{"platform":"TIKTOK","handle":"@sarah_creates","followers":500000,"engagementRateBps":450,"avgViews":150000,"audience":{"gender":{"Female":64,"Male":32,"Other":4},"ageBands":{"18-24":38,"25-34":42,"35-44":14,"45+":6},"topCountries":[{"code":"US","label":"United States","pct":45},{"code":"UK","label":"United Kingdom","pct":18},{"code":"CA","label":"Canada","pct":12},{"code":"AU","label":"Australia","pct":8}]},"source":"SEEDED"}','[{"views":162000,"isPaid":false},{"views":148000,"isPaid":false},{"views":201000,"isPaid":false},{"views":137000,"isPaid":false},{"views":172000,"isPaid":false},{"views":143000,"isPaid":true},{"views":155000,"isPaid":false},{"views":168000,"isPaid":false},{"views":131000,"isPaid":false},{"views":189000,"isPaid":false},{"views":145000,"isPaid":false},{"views":177000,"isPaid":false},{"views":122000,"isPaid":false},{"views":194000,"isPaid":false},{"views":138000,"isPaid":false},{"views":160000,"isPaid":true},{"views":151000,"isPaid":false},{"views":143000,"isPaid":false},{"views":167000,"isPaid":false},{"views":158000,"isPaid":false}]',1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');

-- 6. Sarah Creates — Instagram
INSERT INTO "SeedCreator" ("id","handle","platform","displayName","snapshot","postSample","isActive","createdAt","updatedAt") VALUES ('seed_sarah_instagram','@sarah.creates','INSTAGRAM','Sarah Creates','{"platform":"INSTAGRAM","handle":"@sarah.creates","followers":245000,"engagementRateBps":380,"avgViews":70000,"audience":{"gender":{"Female":64,"Male":32,"Other":4},"ageBands":{"18-24":38,"25-34":42,"35-44":14,"45+":6},"topCountries":[{"code":"US","label":"United States","pct":45},{"code":"UK","label":"United Kingdom","pct":18},{"code":"CA","label":"Canada","pct":12},{"code":"AU","label":"Australia","pct":8}]},"source":"SEEDED"}','[{"views":73000,"isPaid":false},{"views":68000,"isPaid":false},{"views":82000,"isPaid":false},{"views":64000,"isPaid":false},{"views":79000,"isPaid":false},{"views":71000,"isPaid":true},{"views":67000,"isPaid":false},{"views":76000,"isPaid":false},{"views":59000,"isPaid":false},{"views":88000,"isPaid":false},{"views":65000,"isPaid":false},{"views":74000,"isPaid":false},{"views":61000,"isPaid":false},{"views":83000,"isPaid":false},{"views":70000,"isPaid":false},{"views":77000,"isPaid":true},{"views":66000,"isPaid":false},{"views":72000,"isPaid":false},{"views":69000,"isPaid":false},{"views":75000,"isPaid":false}]',1,'2026-06-08T10:02:58.717Z','2026-06-08T10:02:58.717Z');
