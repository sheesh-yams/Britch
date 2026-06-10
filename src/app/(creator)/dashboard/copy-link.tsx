"use client";

import { useState } from "react";

/**
 * Tiny "copy to clipboard" button used in the public-rate-page sidebar card.
 * Server component pages can't run navigator.clipboard, so this is the one
 * thin client island the dashboard needs.
 */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore — old browsers / iframe sandbox; the URL is right there to copy by hand
        }
      }}
      style={{
        flex: 1,
        padding: "9px 12px",
        background: copied ? "var(--volt)" : "var(--ink-3)",
        color:      copied ? "var(--ink)" : "var(--paper)",
        border: "none",
        borderRadius: "var(--r)",
        fontFamily: "var(--font-space-mono)",
        fontSize: 11,
        letterSpacing: "0.05em",
        cursor: "pointer",
        transition: "background 0.12s",
      }}
    >
      {copied ? "✓ COPIED" : "COPY LINK"}
    </button>
  );
}
