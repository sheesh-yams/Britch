/**
 * FloorBar — visual floor / target / stretch range bar.
 *
 * Renders a horizontal bar showing the three rate tiers:
 *   floor ──[●]── target ──[●]── stretch
 *
 * All values in cents; display-only.
 */
import { formatCents } from "@/lib/money";

interface FloorBarProps {
  floorCents:   number;
  targetCents:  number;
  stretchCents: number;
}

export default function FloorBar({ floorCents, targetCents, stretchCents }: FloorBarProps) {
  // Position target as a percentage between floor and stretch
  const range   = stretchCents - floorCents;
  const tPct    = range > 0 ? ((targetCents - floorCents) / range) * 100 : 50;

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Bar track */}
      <div style={{ position: "relative", height: 6, background: "var(--ink-3)", borderRadius: 3, margin: "14px 0" }}>
        {/* Fill: floor → stretch */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(90deg, var(--ink-3) 0%, var(--volt) 100%)",
            borderRadius: 3,
            opacity: 0.35,
          }}
        />
        {/* Target pip */}
        <div
          style={{
            position: "absolute",
            left: `${tPct}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 14,
            height: 14,
            background: "var(--volt)",
            borderRadius: "50%",
            border: "2px solid var(--ink)",
            boxShadow: "0 0 0 3px rgba(214,251,70,0.3)",
          }}
        />
      </div>

      {/* Labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-space-mono)",
          fontSize: 11,
        }}
      >
        <span style={{ color: "var(--paper)", opacity: 0.5 }}>
          Floor<br />
          <span style={{ color: "var(--paper)", opacity: 0.7, fontSize: 12 }}>
            {formatCents(floorCents)}
          </span>
        </span>
        <span style={{ textAlign: "center", color: "var(--volt)" }}>
          Target<br />
          <span style={{ fontSize: 14, fontWeight: 700 }}>
            {formatCents(targetCents)}
          </span>
        </span>
        <span style={{ textAlign: "right", color: "var(--paper)", opacity: 0.5 }}>
          Stretch<br />
          <span style={{ color: "var(--paper)", opacity: 0.7, fontSize: 12 }}>
            {formatCents(stretchCents)}
          </span>
        </span>
      </div>
    </div>
  );
}
