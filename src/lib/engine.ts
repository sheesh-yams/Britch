/**
 * Britch Rate Engine — pure function, integer math only
 *
 * Formula (from BRITCH_ARCHITECTURE.md):
 *
 *   avgReach      = mean(views of organic PostSample)
 *   engAdj        = clamp(engagementRateBps × 10000 / benchmarkEngagementBps,
 *                         engAdjMinBps, engAdjMaxBps)
 *   weightedReach = (avgReach × reachWeightBps + followers × followerWeightBps) / 10000
 *   baseCents     = weightedReach × cpm / 1000 × formatMult / 10000 × engAdj / 10000
 *   target        = roundTo(baseCents, roundingCents)
 *   floor         = roundTo(target × (10000 − floorSpreadBps) / 10000, roundingCents)
 *   stretch       = roundTo(target × (10000 + stretchSpreadBps) / 10000, roundingCents)
 */

export interface EngineInput {
  platform: "INSTAGRAM" | "TIKTOK";
  deliverableType: string;
  followers: number;
  engagementRateBps: number;  // e.g. 450 = 4.5%
  organicPostViews: number[]; // organic-only; paid posts excluded before calling

  // Global plane values — fetched from DB before calling
  cpmCents: number;           // cents per 1,000 reach (e.g. 1000 = $10 CPM)
  formatMultiplierBps: number;// e.g. 10000 = 1.0×, 8500 = 0.85×

  // EngineParams
  reachWeightBps: number;          // default 8500
  followerWeightBps: number;       // default 1500
  benchmarkEngagementBps: number;  // default 300 (3.0%)
  engAdjMinBps: number;            // default 7000
  engAdjMaxBps: number;            // default 13000
  roundingCents: number;           // default 5000 ($50)
  floorSpreadBps: number;          // default 2000 (20%)
  stretchSpreadBps: number;        // default 2000 (20%)
}

export interface RateBreakdown {
  avgReach: number;
  cpmCents: number;
  formatMultiplierBps: number;
  engAdjBps: number;
  weightedReach: number;
  baseCents: number;
}

export interface EngineOutput {
  targetCents: number;
  floorCents: number;
  stretchCents: number;
  breakdown: RateBreakdown;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function idiv(a: number, b: number): number {
  return Math.floor(a / b);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function roundTo(cents: number, step: number): number {
  return Math.round(cents / step) * step;
}

function avgInt(nums: number[]): number {
  if (nums.length === 0) return 0;
  return idiv(nums.reduce((a, b) => a + b, 0), nums.length);
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function computeRate(input: EngineInput): EngineOutput {
  const {
    followers, engagementRateBps, organicPostViews,
    cpmCents, formatMultiplierBps,
    reachWeightBps, followerWeightBps,
    benchmarkEngagementBps, engAdjMinBps, engAdjMaxBps,
    roundingCents, floorSpreadBps, stretchSpreadBps,
  } = input;

  const avgReach = avgInt(organicPostViews);

  const engAdjBps = clamp(
    idiv(engagementRateBps * 10000, benchmarkEngagementBps),
    engAdjMinBps,
    engAdjMaxBps
  );

  const weightedReach = idiv(
    avgReach * reachWeightBps + followers * followerWeightBps,
    10000
  );

  // Apply each factor with integer division to avoid intermediate float drift
  const baseCents = idiv(
    idiv(idiv(weightedReach * cpmCents, 1000) * formatMultiplierBps, 10000) * engAdjBps,
    10000
  );

  const targetCents  = roundTo(baseCents, roundingCents);
  const floorCents   = roundTo(idiv(targetCents * (10000 - floorSpreadBps), 10000), roundingCents);
  const stretchCents = roundTo(idiv(targetCents * (10000 + stretchSpreadBps), 10000), roundingCents);

  return {
    targetCents,
    floorCents,
    stretchCents,
    breakdown: { avgReach, cpmCents, formatMultiplierBps, engAdjBps, weightedReach, baseCents },
  };
}

/** Seed EngineParams — match BRITCH_ARCHITECTURE.md defaults exactly */
export const DEFAULT_ENGINE_PARAMS = {
  reachWeightBps:         8500,
  followerWeightBps:      1500,
  benchmarkEngagementBps: 300,
  engAdjMinBps:           7000,
  engAdjMaxBps:           13000,
  roundingCents:          5000,
  floorSpreadBps:         2000,
  stretchSpreadBps:       2000,
} as const;
