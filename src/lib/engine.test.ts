import { describe, it, expect, beforeAll } from "vitest";
import { computeRate, DEFAULT_ENGINE_PARAMS, type EngineInput } from "./engine";

// ── Demo Creator seed data (from BRITCH_ARCHITECTURE.md + scripts/seed.ts) ──

const DEMO_TT_ORGANIC = [
  162000,148000,201000,137000,172000,
  // 143000 isPaid — excluded
  155000,168000,131000,189000,
  145000,177000,122000,194000,138000,
  // 160000 isPaid — excluded
  151000,143000,167000,158000,
];

const DEMO_IG_ORGANIC = [
  73000,68000,82000,64000,79000,
  // 71000 isPaid — excluded
  67000,76000,59000,88000,
  65000,74000,61000,83000,70000,
  // 77000 isPaid — excluded
  66000,72000,69000,75000,
];

const TT_BASE: EngineInput = {
  platform: "TIKTOK",
  deliverableType: "VIDEO",
  followers: 500000,
  engagementRateBps: 450,          // 4.5%
  organicPostViews: DEMO_TT_ORGANIC,
  cpmCents: 1000,                  // $10 TikTok CPM
  formatMultiplierBps: 10000,      // 1.0× video
  ...DEFAULT_ENGINE_PARAMS,
};

const IG_REEL_BASE: EngineInput = {
  platform: "INSTAGRAM",
  deliverableType: "REEL",
  followers: 245000,
  engagementRateBps: 380,          // 3.8%
  organicPostViews: DEMO_IG_ORGANIC,
  cpmCents: 1200,                  // $12 Instagram CPM
  formatMultiplierBps: 10000,      // 1.0× reel
  ...DEFAULT_ENGINE_PARAMS,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("computeRate — integer invariants", () => {
  it("returns only integer values", () => {
    const r = computeRate(TT_BASE);
    expect(Number.isInteger(r.targetCents)).toBe(true);
    expect(Number.isInteger(r.floorCents)).toBe(true);
    expect(Number.isInteger(r.stretchCents)).toBe(true);
    expect(Number.isInteger(r.breakdown.avgReach)).toBe(true);
    expect(Number.isInteger(r.breakdown.weightedReach)).toBe(true);
    expect(Number.isInteger(r.breakdown.baseCents)).toBe(true);
    expect(Number.isInteger(r.breakdown.engAdjBps)).toBe(true);
  });

  it("target is always a multiple of roundingCents", () => {
    const r = computeRate(TT_BASE);
    expect(r.targetCents % DEFAULT_ENGINE_PARAMS.roundingCents).toBe(0);
  });

  it("floor and stretch are multiples of roundingCents", () => {
    const r = computeRate(TT_BASE);
    expect(r.floorCents % DEFAULT_ENGINE_PARAMS.roundingCents).toBe(0);
    expect(r.stretchCents % DEFAULT_ENGINE_PARAMS.roundingCents).toBe(0);
  });

  it("floor < target < stretch", () => {
    const r = computeRate(TT_BASE);
    expect(r.floorCents).toBeLessThan(r.targetCents);
    expect(r.stretchCents).toBeGreaterThan(r.targetCents);
  });

  it("spread is ~20% in each direction", () => {
    const r = computeRate(TT_BASE);
    // Floor should be ~80% of target (within $100 due to rounding)
    expect(Math.abs(r.floorCents - r.targetCents * 0.8)).toBeLessThanOrEqual(10000);
    // Stretch should be ~120% of target
    expect(Math.abs(r.stretchCents - r.targetCents * 1.2)).toBeLessThanOrEqual(10000);
  });
});

describe("computeRate — Demo Creator TikTok Video", () => {
  let r: ReturnType<typeof computeRate>;
  beforeAll(() => { r = computeRate(TT_BASE); });

  it("uses organic-only avgReach (excludes 2 paid posts)", () => {
    // 18 organic posts
    const sum = DEMO_TT_ORGANIC.reduce((a, b) => a + b, 0);
    const expected = Math.floor(sum / DEMO_TT_ORGANIC.length);
    expect(r.breakdown.avgReach).toBe(expected);
  });

  it("engAdj is capped at max (4.5% well above 3% baseline)", () => {
    // engAdj raw = 450 * 10000 / 300 = 15000 → clamps to 13000
    expect(r.breakdown.engAdjBps).toBe(13000);
  });

  it("weightedReach is greater than avgReach alone (follower weight adds)", () => {
    expect(r.breakdown.weightedReach).toBeGreaterThan(r.breakdown.avgReach);
  });

  it("targetCents is a positive round number in expected range", () => {
    // With $10 CPM + 1.3× engagement adj + 500K followers,
    // target should be a meaningful rate > $1,000 for a 500K creator
    expect(r.targetCents).toBeGreaterThan(100000);   // > $1,000
    expect(r.targetCents).toBeLessThan(1000000);     // < $10,000 (sanity cap)
  });

  it("breakdown.cpmCents matches input", () => {
    expect(r.breakdown.cpmCents).toBe(1000);
  });

  it("breakdown.formatMultiplierBps matches input (1.0× video)", () => {
    expect(r.breakdown.formatMultiplierBps).toBe(10000);
  });
});

describe("computeRate — Demo Creator Instagram Reel", () => {
  let r: ReturnType<typeof computeRate>;
  beforeAll(() => { r = computeRate(IG_REEL_BASE); });

  it("uses organic-only avgReach (excludes 2 paid posts)", () => {
    const sum = DEMO_IG_ORGANIC.reduce((a, b) => a + b, 0);
    const expected = Math.floor(sum / DEMO_IG_ORGANIC.length);
    expect(r.breakdown.avgReach).toBe(expected);
  });

  it("engAdj is above 1.0× (3.8% > 3.0% baseline)", () => {
    // engAdj raw = 380 * 10000 / 300 = 12666 → in range [7000,13000]
    expect(r.breakdown.engAdjBps).toBeGreaterThan(10000);
    expect(r.breakdown.engAdjBps).toBeLessThanOrEqual(13000);
  });

  it("IG rate is lower than TikTok rate despite higher CPM (smaller audience)", () => {
    const ttRate = computeRate(TT_BASE).targetCents;
    expect(r.targetCents).toBeLessThan(ttRate);
  });

  it("targetCents positive and in sensible range", () => {
    expect(r.targetCents).toBeGreaterThan(50000);   // > $500
    expect(r.targetCents).toBeLessThan(500000);     // < $5,000
  });
});

describe("computeRate — format multiplier effects", () => {
  it("Story (0.5×) produces roughly half the rate of Video (1.0×)", () => {
    const video  = computeRate({ ...TT_BASE, formatMultiplierBps: 10000 });
    const story  = computeRate({ ...TT_BASE, formatMultiplierBps: 5000 });
    const ratio  = story.targetCents / video.targetCents;
    expect(ratio).toBeGreaterThanOrEqual(0.45);
    expect(ratio).toBeLessThanOrEqual(0.55);
  });

  it("Live (1.2×) produces more than Video (1.0×)", () => {
    const video = computeRate({ ...TT_BASE, formatMultiplierBps: 10000 });
    const live  = computeRate({ ...TT_BASE, formatMultiplierBps: 12000 });
    expect(live.targetCents).toBeGreaterThan(video.targetCents);
  });

  it("Carousel (0.85×) is between Story and Reel", () => {
    const reel     = computeRate({ ...IG_REEL_BASE, formatMultiplierBps: 10000 });
    const carousel = computeRate({ ...IG_REEL_BASE, formatMultiplierBps: 8500 });
    const story    = computeRate({ ...IG_REEL_BASE, formatMultiplierBps: 5000 });
    expect(carousel.targetCents).toBeLessThan(reel.targetCents);
    expect(carousel.targetCents).toBeGreaterThan(story.targetCents);
  });
});

describe("computeRate — engagement adjustment clamping", () => {
  it("very low engagement (0.5%) clamps to engAdjMinBps (0.7×)", () => {
    const r = computeRate({ ...TT_BASE, engagementRateBps: 50 });
    expect(r.breakdown.engAdjBps).toBe(DEFAULT_ENGINE_PARAMS.engAdjMinBps);
  });

  it("very high engagement (10%) clamps to engAdjMaxBps (1.3×)", () => {
    const r = computeRate({ ...TT_BASE, engagementRateBps: 1000 });
    expect(r.breakdown.engAdjBps).toBe(DEFAULT_ENGINE_PARAMS.engAdjMaxBps);
  });

  it("exact benchmark engagement (3.0%) gives 1.0× adj (10000 bps)", () => {
    const r = computeRate({ ...TT_BASE, engagementRateBps: 300 });
    expect(r.breakdown.engAdjBps).toBe(10000);
  });
});

describe("computeRate — edge cases", () => {
  it("zero organic posts → avgReach 0 → only follower weight contributes", () => {
    const r = computeRate({ ...TT_BASE, organicPostViews: [] });
    expect(r.breakdown.avgReach).toBe(0);
    expect(r.breakdown.weightedReach).toBeGreaterThan(0); // followers still contribute
    expect(r.targetCents).toBeGreaterThan(0);
  });

  it("zero followers → only reach weight contributes", () => {
    const r = computeRate({ ...TT_BASE, followers: 0 });
    expect(r.targetCents).toBeGreaterThan(0);
  });

  it("all same views → avgReach equals that view count", () => {
    const r = computeRate({ ...TT_BASE, organicPostViews: [100000, 100000, 100000] });
    expect(r.breakdown.avgReach).toBe(100000);
  });

  it("produces deterministic output for same input", () => {
    const r1 = computeRate(TT_BASE);
    const r2 = computeRate(TT_BASE);
    expect(r1.targetCents).toBe(r2.targetCents);
    expect(r1.breakdown.engAdjBps).toBe(r2.breakdown.engAdjBps);
  });
});
