import React from "react";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  href?: string;
}

const sizes = {
  sm: { box: 22, font: 14, word: 16 },
  md: { box: 30, font: 18, word: 18 },
  lg: { box: 40, font: 24, word: 24 },
};

export function BrandMark({ size = "md", href }: BrandMarkProps) {
  const s = sizes[size];
  const inner = (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-clash-display)",
          fontWeight: 700,
          fontSize: s.font,
          background: "var(--volt)",
          color: "var(--ink)",
          width: s.box,
          height: s.box,
          display: "grid",
          placeItems: "center",
          border: "var(--line)",
          flexShrink: 0,
        }}
      >
        B
      </span>
      <span
        style={{
          fontFamily: "var(--font-clash-display)",
          fontWeight: 700,
          letterSpacing: "0.04em",
          fontSize: s.word,
          textTransform: "uppercase",
        }}
      >
        BRITCH
      </span>
    </span>
  );

  if (href) {
    return <a href={href} style={{ textDecoration: "none", color: "inherit" }}>{inner}</a>;
  }
  return inner;
}
