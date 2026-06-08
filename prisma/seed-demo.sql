-- Britch Demo Seed — creator plane
-- Run AFTER seed.sql (global plane must exist first).
--
-- Creates Sarah Creates as a real CreatorAccount + RatePage so /r/demo-sarah
-- renders actual engine-computed rates using the seeded data.
--
--   npx wrangler d1 execute britch-db --local --file=./prisma/seed.sql
--   npx wrangler d1 execute britch-db --local --file=./prisma/seed-demo.sql
--
-- Published rates (pre-computed to match engine.test.ts assertions):
--   TikTok Video:    $2,750 target ($2,200 floor / $3,300 stretch)
--   TikTok Story:    $1,350 target ($1,100 floor / $1,650 stretch)
--   TikTok Live:     $3,300 target ($2,650 floor / $3,950 stretch)
--   Instagram Reel:  $1,500 target ($1,200 floor / $1,800 stretch)
--   Instagram Carousel: $1,250 target ($1,000 floor / $1,500 stretch)
--   Instagram Story: $750 target  ($600 floor  / $900 stretch)

-- Idempotent: clean previous demo data
DELETE FROM "RatePageView"    WHERE ratePageId = 'demo_rate_page_1';
DELETE FROM "RatePage"        WHERE id = 'demo_rate_page_1';
DELETE FROM "Deliverable"     WHERE accountId = 'demo_account_sarah';
DELETE FROM "CreatorProfile"  WHERE accountId = 'demo_account_sarah';
DELETE FROM "SocialAccount"   WHERE accountId = 'demo_account_sarah';
DELETE FROM "CreatorAccount"  WHERE id = 'demo_account_sarah';
DELETE FROM "Session"         WHERE userId = 'demo_user_sarah';
DELETE FROM "Account"         WHERE userId = 'demo_user_sarah';
DELETE FROM "User"            WHERE id = 'demo_user_sarah';

-- ── 1. User ───────────────────────────────────────────────────────────────────

INSERT INTO "User" ("id","name","email","emailVerified","image","role","createdAt","updatedAt")
VALUES (
  'demo_user_sarah',
  'Sarah Creates',
  'sarah@britchdemo.com',
  1,
  NULL,
  'USER',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);

-- ── 2. CreatorAccount ─────────────────────────────────────────────────────────

INSERT INTO "CreatorAccount" ("id","userId","createdAt","updatedAt")
VALUES (
  'demo_account_sarah',
  'demo_user_sarah',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);

-- ── 3. CreatorProfile ─────────────────────────────────────────────────────────

INSERT INTO "CreatorProfile"
  ("id","accountId","displayName","bio","niche","avatarKey","accentColor","createdAt","updatedAt")
VALUES (
  'demo_profile_sarah',
  'demo_account_sarah',
  'Sarah Creates',
  'Lifestyle creator focused on food, fashion, and everyday moments. Based in NYC. Partnering with brands I actually use.',
  'lifestyle',
  NULL,
  '#D6FB46',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);

-- ── 4. SocialAccounts ────────────────────────────────────────────────────────

INSERT INTO "SocialAccount"
  ("id","accountId","platform","handle","isActive","source","snapshot","postSample","createdAt","updatedAt")
VALUES (
  'demo_sa_tiktok',
  'demo_account_sarah',
  'TIKTOK',
  '@sarah_creates',
  1,
  'SEEDED',
  '{"platform":"TIKTOK","handle":"@sarah_creates","followers":500000,"engagementRateBps":450,"avgViews":150000,"audience":{"gender":{"Female":64,"Male":32,"Other":4},"ageBands":{"18-24":38,"25-34":42,"35-44":14,"45+":6},"topCountries":[{"code":"US","label":"United States","pct":45},{"code":"UK","label":"United Kingdom","pct":18},{"code":"CA","label":"Canada","pct":12},{"code":"AU","label":"Australia","pct":8}]},"source":"SEEDED"}',
  '[{"views":162000,"isPaid":false},{"views":148000,"isPaid":false},{"views":201000,"isPaid":false},{"views":137000,"isPaid":false},{"views":172000,"isPaid":false},{"views":143000,"isPaid":true},{"views":155000,"isPaid":false},{"views":168000,"isPaid":false},{"views":131000,"isPaid":false},{"views":189000,"isPaid":false},{"views":145000,"isPaid":false},{"views":177000,"isPaid":false},{"views":122000,"isPaid":false},{"views":194000,"isPaid":false},{"views":138000,"isPaid":false},{"views":160000,"isPaid":true},{"views":151000,"isPaid":false},{"views":143000,"isPaid":false},{"views":167000,"isPaid":false},{"views":158000,"isPaid":false}]',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);

INSERT INTO "SocialAccount"
  ("id","accountId","platform","handle","isActive","source","snapshot","postSample","createdAt","updatedAt")
VALUES (
  'demo_sa_instagram',
  'demo_account_sarah',
  'INSTAGRAM',
  '@sarah.creates',
  1,
  'SEEDED',
  '{"platform":"INSTAGRAM","handle":"@sarah.creates","followers":245000,"engagementRateBps":380,"avgViews":70000,"audience":{"gender":{"Female":64,"Male":32,"Other":4},"ageBands":{"18-24":38,"25-34":42,"35-44":14,"45+":6},"topCountries":[{"code":"US","label":"United States","pct":45},{"code":"UK","label":"United Kingdom","pct":18},{"code":"CA","label":"Canada","pct":12},{"code":"AU","label":"Australia","pct":8}]},"source":"SEEDED"}',
  '[{"views":73000,"isPaid":false},{"views":68000,"isPaid":false},{"views":82000,"isPaid":false},{"views":64000,"isPaid":false},{"views":79000,"isPaid":false},{"views":71000,"isPaid":true},{"views":67000,"isPaid":false},{"views":76000,"isPaid":false},{"views":59000,"isPaid":false},{"views":88000,"isPaid":false},{"views":65000,"isPaid":false},{"views":74000,"isPaid":false},{"views":61000,"isPaid":false},{"views":83000,"isPaid":false},{"views":70000,"isPaid":false},{"views":77000,"isPaid":true},{"views":66000,"isPaid":false},{"views":72000,"isPaid":false},{"views":69000,"isPaid":false},{"views":75000,"isPaid":false}]',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);

-- ── 5. Deliverables (with pre-computed engine output) ─────────────────────────
-- Values match engine.test.ts Sarah Creates assertions exactly.
-- All cents. Breakdowns stored as JSON for "Why this rate?" display.

INSERT INTO "Deliverable"
  ("id","accountId","platform","deliverableType","label","isActive",
   "floorCents","targetCents","stretchCents","engineBreakdown","createdAt","updatedAt")
VALUES
  ('demo_del_tt_video',   'demo_account_sarah','TIKTOK',    'VIDEO',    'TikTok Video',    1, 220000,275000,330000,
   '{"avgReach":158777,"cpmCents":1000,"formatMultiplierBps":10000,"engAdjBps":13000,"weightedReach":157010,"baseCents":204113}',
   '2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z'),

  ('demo_del_tt_story',   'demo_account_sarah','TIKTOK',    'STORY',    'TikTok Story',    1, 110000,135000,165000,
   '{"avgReach":158777,"cpmCents":1000,"formatMultiplierBps":5000,"engAdjBps":13000,"weightedReach":157010,"baseCents":102056}',
   '2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z'),

  ('demo_del_tt_live',    'demo_account_sarah','TIKTOK',    'LIVE',     'TikTok Live',     1, 265000,330000,395000,
   '{"avgReach":158777,"cpmCents":1000,"formatMultiplierBps":12000,"engAdjBps":13000,"weightedReach":157010,"baseCents":244935}',
   '2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z'),

  ('demo_del_ig_reel',    'demo_account_sarah','INSTAGRAM', 'REEL',     'Instagram Reel',  1, 120000,150000,180000,
   '{"avgReach":71722,"cpmCents":1200,"formatMultiplierBps":10000,"engAdjBps":12666,"weightedReach":68516,"baseCents":103950}',
   '2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z'),

  ('demo_del_ig_carousel','demo_account_sarah','INSTAGRAM', 'CAROUSEL', 'Instagram Carousel',1,100000,125000,150000,
   '{"avgReach":71722,"cpmCents":1200,"formatMultiplierBps":8500,"engAdjBps":12666,"weightedReach":68516,"baseCents":88357}',
   '2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z'),

  ('demo_del_ig_story',   'demo_account_sarah','INSTAGRAM', 'STORY',    'Instagram Story', 1,  60000, 75000, 90000,
   '{"avgReach":71722,"cpmCents":1200,"formatMultiplierBps":5000,"engAdjBps":12666,"weightedReach":68516,"baseCents":51975}',
   '2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');

-- ── 6. RatePage ───────────────────────────────────────────────────────────────
-- token = demo-sarah → accessible at /r/demo-sarah
-- frozenRates contains the published snapshot so the page renders without DB joins.

INSERT INTO "RatePage"
  ("id","accountId","token","title","status","frozenRates","createdAt","updatedAt")
VALUES (
  'demo_rate_page_1',
  'demo_account_sarah',
  'demo-sarah',
  'Sarah Creates — Rate Card 2026',
  'PUBLISHED',
  '{
    "deliverables": [
      {"id":"demo_del_tt_video",   "platform":"TIKTOK",    "deliverableType":"VIDEO",    "label":"TikTok Video",      "targetCents":275000,"floorCents":220000,"stretchCents":330000,"breakdown":{"avgReach":158777,"cpmCents":1000,"formatMultiplierBps":10000,"engAdjBps":13000,"weightedReach":157010,"baseCents":204113},"followers":500000,"engagementRateBps":450},
      {"id":"demo_del_tt_story",   "platform":"TIKTOK",    "deliverableType":"STORY",    "label":"TikTok Story",      "targetCents":135000,"floorCents":110000,"stretchCents":165000,"breakdown":{"avgReach":158777,"cpmCents":1000,"formatMultiplierBps":5000,"engAdjBps":13000,"weightedReach":157010,"baseCents":102056},"followers":500000,"engagementRateBps":450},
      {"id":"demo_del_tt_live",    "platform":"TIKTOK",    "deliverableType":"LIVE",     "label":"TikTok Live",       "targetCents":330000,"floorCents":265000,"stretchCents":395000,"breakdown":{"avgReach":158777,"cpmCents":1000,"formatMultiplierBps":12000,"engAdjBps":13000,"weightedReach":157010,"baseCents":244935},"followers":500000,"engagementRateBps":450},
      {"id":"demo_del_ig_reel",    "platform":"INSTAGRAM", "deliverableType":"REEL",     "label":"Instagram Reel",    "targetCents":150000,"floorCents":120000,"stretchCents":180000,"breakdown":{"avgReach":71722,"cpmCents":1200,"formatMultiplierBps":10000,"engAdjBps":12666,"weightedReach":68516,"baseCents":103950},"followers":245000,"engagementRateBps":380},
      {"id":"demo_del_ig_carousel","platform":"INSTAGRAM", "deliverableType":"CAROUSEL", "label":"Instagram Carousel","targetCents":125000,"floorCents":100000,"stretchCents":150000,"breakdown":{"avgReach":71722,"cpmCents":1200,"formatMultiplierBps":8500,"engAdjBps":12666,"weightedReach":68516,"baseCents":88357},"followers":245000,"engagementRateBps":380},
      {"id":"demo_del_ig_story",   "platform":"INSTAGRAM", "deliverableType":"STORY",    "label":"Instagram Story",   "targetCents":75000, "floorCents":60000, "stretchCents":90000, "breakdown":{"avgReach":71722,"cpmCents":1200,"formatMultiplierBps":5000,"engAdjBps":12666,"weightedReach":68516,"baseCents":51975},"followers":245000,"engagementRateBps":380}
    ],
    "handles": {"TIKTOK":"@sarah_creates","INSTAGRAM":"@sarah.creates"},
    "bio": "Lifestyle creator focused on food, fashion, and everyday moments. Based in NYC. Partnering with brands I actually use.",
    "audience": {
      "gender":       {"Female":64,"Male":32,"Other":4},
      "ageBands":     {"18-24":38,"25-34":42,"35-44":14,"45+":6},
      "topCountries": [{"code":"US","label":"United States","pct":45},{"code":"UK","label":"United Kingdom","pct":18},{"code":"CA","label":"Canada","pct":12},{"code":"AU","label":"Australia","pct":8}]
    }
  }',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);

-- Done. Visit /r/demo-sarah to see the live rate page.
