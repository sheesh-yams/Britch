/**
 * WhyThisRate — expandable breakdown showing how the engine computed this rate.
 *
 * Shows the formula chain: avgReach → weighted reach → base → adjustments → target.
 * Pure presentational; receives the breakdown object from EngineOutput.
 */
"use client";

import { useState } from "react";
import { formatCents, formatBps, formatMultiplier } from "@/lib/money";

interface Breakdown {
  avgReach: number;
  cpmCents: number;
  formatMultiplierBps: number;
  engAdjBps: number;
  weightedReach: number;
  baseCents: number;
}

interface WhyThisRateProps {
  breakdown: Breakdown;
  followers: number;
  engagementRateBps: number;
}

export default function WhyThisRate({ breakdown, followers, engagementRateBps }: WhyThisRateProps) {
  const [open, setOpen] = useState(false);

  const rows = [
    { label: "Followers",            value: followers.toLocaleString() },
    { label: "Avg organic reach",    value: breakdown.avgReach.toLocaleString() },
    { label: "Weighted reach",       value: breakdown.weightedReach.toLocaleString() },
    { label: "CPM benchmark",        value: formatCents(breakdown.cpmCents) + " /1K" },
    { label: "Format multiplier",    value: formatMultiplier(breakdown.formatMultiplierBps) },
    { label: "Engagement rate",      value: formatBps(engagementRateBps) },
    { label: "Engagement adj.",      value: formatMultiplier(breakdown.engAdjBps) },
    { label: "Base rate",            value: formatCents(breakdown.baseCents) },
  ];

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: "none",
          border: "none",
          color: "var(--volt)",
          fontFamily: "var(--font-space-mono)",
          fontSize: 11,
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: 0.8,
        }}
      >
        <span style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▶</span>
        Why this rate?
      </button>

      {open && (
        <div
          style={{
            marginTop: 10,
            padding: 14,
            background: "var(--ink-3)",
            borderRadius: "var(--r)",
            border: "1px solid var(--ink-3)",
          }}
        >
          <div style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 11,
            color: "var(--paper)",
            opacity: 0.5,
            marginBottom: 10,
            letterSpacing: "0.05em",
          }}>
            RATE BREAKDOWN
          </div>
          {rows.map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                borderBottom: "1px solid rgba(244,241,233,0.07)",
                fontFamily: "var(--font-general-sans)",
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--paper)", opacity: 0.55 }}>{label}</span>
              <span style={{ color: "var(--paper)", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
          <div
            style={{
              marginTop: 10,
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--paper)",
              opacity: 0.35,
              lineHeight: 1.6,
            }}
          >
            Rate = weightedReach × CPM/1000 × formatMult × engAdj, rounded to $50
          </div>
        </div>
      )}
    </div>
  );
}
