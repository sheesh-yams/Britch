/**
 * RateCard — single deliverable rate card.
 *
 * Displays the deliverable type label, platform pill,
 * floor/target/stretch FloorBar, and expandable WhyThisRate.
 */

import FloorBar    from "./FloorBar";
import WhyThisRate from "./WhyThisRate";

interface RateCardProps {
  platform:         string;          // "TIKTOK" | "INSTAGRAM"
  deliverableType:  string;          // "VIDEO" | "REEL" | etc
  label?:           string;          // optional override label
  targetCents:      number;
  floorCents:       number;
  stretchCents:     number;
  breakdown: {
    avgReach: number;
    cpmCents: number;
    formatMultiplierBps: number;
    engAdjBps: number;
    weightedReach: number;
    baseCents: number;
  };
  followers:          number;
  engagementRateBps:  number;
}

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK:    "TikTok",
  INSTAGRAM: "Instagram",
  YOUTUBE:   "YouTube",
};

const DELIVERABLE_LABELS: Record<string, string> = {
  VIDEO:    "Video",
  REEL:     "Reel",
  CAROUSEL: "Carousel",
  STORY:    "Story",
  LIVE:     "Live",
  SLIDE:    "Slide",
  SHORT:    "Short",
  POST:     "Post",
};

export default function RateCard({
  platform,
  deliverableType,
  label,
  targetCents,
  floorCents,
  stretchCents,
  breakdown,
  followers,
  engagementRateBps,
}: RateCardProps) {
  const platformLabel    = PLATFORM_LABELS[platform]   ?? platform;
  const deliverableLabel = label ?? (DELIVERABLE_LABELS[deliverableType] ?? deliverableType);

  return (
    <div
      style={{
        background: "var(--ink-2)",
        border: "1.5px solid var(--ink-3)",
        borderRadius: "var(--r)",
        padding: "20px 22px",
        transition: "border-color 0.15s",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-clash-display)",
            fontSize: 17,
            color: "var(--paper)",
            fontWeight: 600,
          }}
        >
          {deliverableLabel}
        </span>
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            padding: "3px 8px",
            background: "var(--ink-3)",
            color: "var(--paper)",
            opacity: 0.6,
            borderRadius: "var(--r)",
            letterSpacing: "0.05em",
          }}
        >
          {platformLabel.toUpperCase()}
        </span>
      </div>

      <FloorBar
        floorCents={floorCents}
        targetCents={targetCents}
        stretchCents={stretchCents}
      />

      <WhyThisRate
        breakdown={breakdown}
        followers={followers}
        engagementRateBps={engagementRateBps}
      />
    </div>
  );
}
