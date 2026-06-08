/**
 * Ticker — scrolling ticker strip.
 * Used decoratively on the public rate page.
 */

interface TickerProps {
  items: string[];
  speed?: "slow" | "normal" | "fast";
}

const SPEED_MAP = {
  slow:   "48s",
  normal: "24s",
  fast:   "12s",
};

export default function Ticker({ items, speed = "normal" }: TickerProps) {
  // Duplicate items so the loop appears seamless
  const doubled = [...items, ...items];
  const duration = SPEED_MAP[speed];

  return (
    <div
      style={{
        overflow: "hidden",
        borderTop:    "1.5px solid var(--volt)",
        borderBottom: "1.5px solid var(--volt)",
        background: "var(--volt)",
        padding: "7px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 40,
          width: "max-content",
          animation: `ticker ${duration} linear infinite`,
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-clash-display)",
              fontWeight: 600,
              fontSize: 13,
              color: "var(--ink)",
              whiteSpace: "nowrap",
              letterSpacing: "0.06em",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
