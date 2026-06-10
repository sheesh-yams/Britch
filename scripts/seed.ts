/**
 * Britch — Seed Script
 *
 * Seeds the GLOBAL PRICING PLANE only (admin-governed data).
 * Creator-scoped data is never seeded here.
 *
 * What gets seeded:
 *   1. 10 Niches
 *   2. Generic CPM benchmarks (nicheId = NULL) per platform × tier
 *   3. Format multipliers per platform × type
 *   4. EngineParams defaults (singleton)
 *   5. ProviderConfig (active = SEEDED)
 *   6. "Creator Name" seed creator — TikTok + Instagram
 *
 * Run:
 *   npx wrangler d1 execute britch-db --local --file=./prisma/seed.sql
 *
 * Or via the ts-node approach for local dev with a real D1 binding:
 *   npx tsx scripts/seed.ts
 *
 * All values match BRITCH_ARCHITECTURE.md § "Seed values (v0)".
 * All are admin-editable from /admin after seeding.
 */

// ─── Types (inline — no DB connection needed for SQL generation) ────────────

interface NicheRow {
  id: string;
  slug: string;
  label: string;
  order: number;
}

interface CpmRow {
  id: string;
  platform: string;
  nicheId: string | null;
  followerTier: string;
  cpmCents: number;
  source: string;
}

interface MultiplierRow {
  id: string;
  platform: string;
  deliverableType: string;
  multiplierBps: number;
}

// ─── Seed data ───────────────────────────────────────────────────────────────

const NICHES: NicheRow[] = [
  { id: "niche_lifestyle",  slug: "lifestyle",  label: "Lifestyle",  order: 1 },
  { id: "niche_beauty",     slug: "beauty",     label: "Beauty",     order: 2 },
  { id: "niche_food",       slug: "food",       label: "Food",       order: 3 },
  { id: "niche_fitness",    slug: "fitness",    label: "Fitness",    order: 4 },
  { id: "niche_tech",       slug: "tech",       label: "Tech",       order: 5 },
  { id: "niche_gaming",     slug: "gaming",     label: "Gaming",     order: 6 },
  { id: "niche_fashion",    slug: "fashion",    label: "Fashion",    order: 7 },
  { id: "niche_finance",    slug: "finance",    label: "Finance",    order: 8 },
  { id: "niche_travel",     slug: "travel",     label: "Travel",     order: 9 },
  { id: "niche_comedy",     slug: "comedy",     label: "Comedy",     order: 10 },
];

// Generic CPM benchmarks (nicheId = NULL) — cents per 1,000 reach
// Source: published 2026 benchmarks — admin-tunable
// Instagram: $12 CPM → 1200 cents; TikTok: $10 CPM → 1000 cents
// Applied uniformly across tiers at MVP; niche × tier rows layered in via admin later
const CPM_BENCHMARKS: CpmRow[] = [
  // Instagram generic
  { id: "cpm_ig_nano",   platform: "INSTAGRAM", nicheId: null, followerTier: "NANO",   cpmCents: 1200, source: "2026 benchmark — admin-tunable" },
  { id: "cpm_ig_micro",  platform: "INSTAGRAM", nicheId: null, followerTier: "MICRO",  cpmCents: 1200, source: "2026 benchmark — admin-tunable" },
  { id: "cpm_ig_mid",    platform: "INSTAGRAM", nicheId: null, followerTier: "MID",    cpmCents: 1200, source: "2026 benchmark — admin-tunable" },
  { id: "cpm_ig_macro",  platform: "INSTAGRAM", nicheId: null, followerTier: "MACRO",  cpmCents: 1200, source: "2026 benchmark — admin-tunable" },
  // TikTok generic
  { id: "cpm_tt_nano",   platform: "TIKTOK",    nicheId: null, followerTier: "NANO",   cpmCents: 1000, source: "2026 benchmark — admin-tunable" },
  { id: "cpm_tt_micro",  platform: "TIKTOK",    nicheId: null, followerTier: "MICRO",  cpmCents: 1000, source: "2026 benchmark — admin-tunable" },
  { id: "cpm_tt_mid",    platform: "TIKTOK",    nicheId: null, followerTier: "MID",    cpmCents: 1000, source: "2026 benchmark — admin-tunable" },
  { id: "cpm_tt_macro",  platform: "TIKTOK",    nicheId: null, followerTier: "MACRO",  cpmCents: 1000, source: "2026 benchmark — admin-tunable" },
];

// Format multipliers — bps (10000 = 1.0×, baseline video unit)
const FORMAT_MULTIPLIERS: MultiplierRow[] = [
  // Instagram
  { id: "mult_ig_reel",      platform: "INSTAGRAM", deliverableType: "REEL",      multiplierBps: 10000 },
  { id: "mult_ig_carousel",  platform: "INSTAGRAM", deliverableType: "CAROUSEL",  multiplierBps: 8500  },
  { id: "mult_ig_story",     platform: "INSTAGRAM", deliverableType: "STORY",     multiplierBps: 5000  },
  // TikTok
  { id: "mult_tt_video",     platform: "TIKTOK",    deliverableType: "VIDEO",     multiplierBps: 10000 },
  { id: "mult_tt_slide",     platform: "TIKTOK",    deliverableType: "SLIDE",     multiplierBps: 5000  },
  { id: "mult_tt_story",     platform: "TIKTOK",    deliverableType: "STORY",     multiplierBps: 5000  },
  { id: "mult_tt_live",      platform: "TIKTOK",    deliverableType: "LIVE",      multiplierBps: 12000 },
];

// EngineParams defaults from architecture
const ENGINE_PARAMS = {
  id:                     "engine_params_v1",
  version:                1,
  isActive:               1,
  label:                  "v1 — launch defaults",
  reachWeightBps:         8500,   // 85% weight on reach
  followerWeightBps:      1500,   // 15% weight on followers
  benchmarkEngagementBps: 300,    // 3.0% baseline engagement
  engAdjMinBps:           7000,   // floor: 0.7× (low engagement)
  engAdjMaxBps:           13000,  // ceiling: 1.3× (high engagement)
  roundingCents:          5000,   // round to nearest $50
  floorSpreadBps:         2000,   // floor = 20% below target
  stretchSpreadBps:       2000,   // stretch = 20% above target
};

// ─── Creator Name seed creator ──────────────────────────────────────────────
// Exactly as specified in BRITCH_ARCHITECTURE.md
// TikTok: @creator_demo — 500K followers, 4.5% engagement, ~150K avg reach
// Instagram: @creator.demo — 245K followers, 3.8% engagement, ~70K avg reach

const DEMO_TIKTOK_SNAPSHOT = {
  platform: "TIKTOK",
  handle: "@creator_demo",
  followers: 500000,
  engagementRateBps: 450,        // 4.5%
  avgViews: 150000,
  audience: {
    gender:     { Female: 64, Male: 32, Other: 4 },
    ageBands:   { "18-24": 38, "25-34": 42, "35-44": 14, "45+": 6 },
    topCountries: [
      { code: "US", label: "United States", pct: 45 },
      { code: "UK", label: "United Kingdom", pct: 18 },
      { code: "CA", label: "Canada",         pct: 12 },
      { code: "AU", label: "Australia",      pct: 8  },
    ],
  },
  source: "SEEDED",
};

// Last-20 TikTok posts — mix of organic and paid, views in line with 150K avg reach
// Organic posts feed avgReach calculation; paid posts excluded from reach avg
const DEMO_TIKTOK_POST_SAMPLE = [
  { views: 162000, isPaid: false },
  { views: 148000, isPaid: false },
  { views: 201000, isPaid: false },
  { views: 137000, isPaid: false },
  { views: 172000, isPaid: false },
  { views: 143000, isPaid: true  },  // paid — excluded from avgReach
  { views: 155000, isPaid: false },
  { views: 168000, isPaid: false },
  { views: 131000, isPaid: false },
  { views: 189000, isPaid: false },
  { views: 145000, isPaid: false },
  { views: 177000, isPaid: false },
  { views: 122000, isPaid: false },
  { views: 194000, isPaid: false },
  { views: 138000, isPaid: false },
  { views: 160000, isPaid: true  },  // paid — excluded
  { views: 151000, isPaid: false },
  { views: 143000, isPaid: false },
  { views: 167000, isPaid: false },
  { views: 158000, isPaid: false },
];
// Organic-only mean ≈ 156K — rounds to 150K after engine rounding

const DEMO_IG_SNAPSHOT = {
  platform: "INSTAGRAM",
  handle: "@creator.demo",
  followers: 245000,
  engagementRateBps: 380,        // 3.8%
  avgViews: 70000,
  audience: {
    gender:     { Female: 64, Male: 32, Other: 4 },
    ageBands:   { "18-24": 38, "25-34": 42, "35-44": 14, "45+": 6 },
    topCountries: [
      { code: "US", label: "United States", pct: 45 },
      { code: "UK", label: "United Kingdom", pct: 18 },
      { code: "CA", label: "Canada",         pct: 12 },
      { code: "AU", label: "Australia",      pct: 8  },
    ],
  },
  source: "SEEDED",
};

const DEMO_IG_POST_SAMPLE = [
  { views: 73000, isPaid: false },
  { views: 68000, isPaid: false },
  { views: 82000, isPaid: false },
  { views: 64000, isPaid: false },
  { views: 79000, isPaid: false },
  { views: 71000, isPaid: true  },
  { views: 67000, isPaid: false },
  { views: 76000, isPaid: false },
  { views: 59000, isPaid: false },
  { views: 88000, isPaid: false },
  { views: 65000, isPaid: false },
  { views: 74000, isPaid: false },
  { views: 61000, isPaid: false },
  { views: 83000, isPaid: false },
  { views: 70000, isPaid: false },
  { views: 77000, isPaid: true  },
  { views: 66000, isPaid: false },
  { views: 72000, isPaid: false },
  { views: 69000, isPaid: false },
  { views: 75000, isPaid: false },
];
// Organic-only mean ≈ 72K — rounds to 70K

// ─── SQL generation ───────────────────────────────────────────────────────────

function sq(s: string | null): string {
  if (s === null) return "NULL";
  return `'${s.replace(/'/g, "''")}'`;
}

function now(): string {
  return new Date().toISOString();
}

export function generateSeedSQL(): string {
  const lines: string[] = [
    "-- Britch Seed Data — generated by scripts/seed.ts",
    "-- Run: npx wrangler d1 execute britch-db --local --file=./prisma/seed.sql",
    "",
    "-- Clear existing global plane data (idempotent re-seed)",
    "DELETE FROM ProviderConfig;",
    "DELETE FROM SeedCreator;",
    "DELETE FROM EngineParams;",
    "DELETE FROM FormatMultiplier;",
    "DELETE FROM CpmBenchmark;",
    "DELETE FROM Niche;",
    "",
    "-- 1. Niches",
  ];

  for (const n of NICHES) {
    lines.push(
      `INSERT INTO "Niche" ("id","slug","label","isActive","order") VALUES (${sq(n.id)},${sq(n.slug)},${sq(n.label)},1,${n.order});`
    );
  }

  lines.push("", "-- 2. Generic CPM benchmarks (nicheId = NULL)");
  const ts = now();
  for (const c of CPM_BENCHMARKS) {
    lines.push(
      `INSERT INTO "CpmBenchmark" ("id","platform","nicheId","followerTier","cpmCents","source","effectiveDate","isActive","createdAt","updatedAt") VALUES (${sq(c.id)},${sq(c.platform)},NULL,${sq(c.followerTier)},${c.cpmCents},${sq(c.source)},${sq(ts)},1,${sq(ts)},${sq(ts)});`
    );
  }

  lines.push("", "-- 3. Format multipliers");
  for (const m of FORMAT_MULTIPLIERS) {
    lines.push(
      `INSERT INTO "FormatMultiplier" ("id","platform","deliverableType","multiplierBps","isActive","createdAt","updatedAt") VALUES (${sq(m.id)},${sq(m.platform)},${sq(m.deliverableType)},${m.multiplierBps},1,${sq(ts)},${sq(ts)});`
    );
  }

  lines.push("", "-- 4. EngineParams (singleton)");
  const ep = ENGINE_PARAMS;
  lines.push(
    `INSERT INTO "EngineParams" ("id","version","isActive","label","reachWeightBps","followerWeightBps","benchmarkEngagementBps","engAdjMinBps","engAdjMaxBps","roundingCents","floorSpreadBps","stretchSpreadBps","createdAt","updatedAt") VALUES (${sq(ep.id)},${ep.version},${ep.isActive},${sq(ep.label)},${ep.reachWeightBps},${ep.followerWeightBps},${ep.benchmarkEngagementBps},${ep.engAdjMinBps},${ep.engAdjMaxBps},${ep.roundingCents},${ep.floorSpreadBps},${ep.stretchSpreadBps},${sq(ts)},${sq(ts)});`
  );

  lines.push("", "-- 5. ProviderConfig (active = SEEDED)");
  lines.push(
    `INSERT INTO "ProviderConfig" ("id","activeAnalyticsProvider","oembedTokens","updatedAt") VALUES ('provider_config_1','SEEDED','{}',${sq(ts)});`
  );

  lines.push("", "-- 6. Creator Name — TikTok");
  lines.push(
    `INSERT INTO "SeedCreator" ("id","handle","platform","displayName","snapshot","postSample","isActive","createdAt","updatedAt") VALUES ('seed_creator_tiktok','@creator_demo','TIKTOK','Creator Name',${sq(JSON.stringify(DEMO_TIKTOK_SNAPSHOT))},${sq(JSON.stringify(DEMO_TIKTOK_POST_SAMPLE))},1,${sq(ts)},${sq(ts)});`
  );

  lines.push("", "-- 6. Creator Name — Instagram");
  lines.push(
    `INSERT INTO "SeedCreator" ("id","handle","platform","displayName","snapshot","postSample","isActive","createdAt","updatedAt") VALUES ('seed_creator_instagram','@creator.demo','INSTAGRAM','Creator Name',${sq(JSON.stringify(DEMO_IG_SNAPSHOT))},${sq(JSON.stringify(DEMO_IG_POST_SAMPLE))},1,${sq(ts)},${sq(ts)});`
  );

  lines.push("");
  return lines.join("\n");
}

// ─── Entry point ─────────────────────────────────────────────────────────────

if (require.main === module || import.meta.url === `file://${process.argv[1]}`) {
  const sql = generateSeedSQL();

  // Write to prisma/seed.sql for wrangler d1 execute
  const fs = await import("fs");
  const path = await import("path");
  const outPath = path.join(process.cwd(), "prisma", "seed.sql");
  fs.writeFileSync(outPath, sql, "utf8");
  console.log(`✓ Seed SQL written to ${outPath}`);
  console.log(`  Niches:            ${NICHES.length}`);
  console.log(`  CPM benchmarks:    ${CPM_BENCHMARKS.length}`);
  console.log(`  Format multipliers:${FORMAT_MULTIPLIERS.length}`);
  console.log(`  EngineParams:      1 (singleton)`);
  console.log(`  ProviderConfig:    1 (active = SEEDED)`);
  console.log(`  SeedCreators:      2 (Creator Name — TikTok + Instagram)`);
  console.log(`\nApply locally:`);
  console.log(`  npx wrangler d1 migrations apply britch-db --local`);
  console.log(`  npx wrangler d1 execute britch-db --local --file=./prisma/seed.sql`);
}
