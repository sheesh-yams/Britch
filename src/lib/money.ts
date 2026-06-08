/**
 * Format integer cents to display string.
 * $120000 cents → "$1,200"
 * Display-edge only — never use for math.
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Format basis points to percentage string.
 * 450 bps → "4.5%"
 */
export function formatBps(bps: number): string {
  return (bps / 100).toFixed(1) + "%";
}

/**
 * Format basis points as a multiplier.
 * 10000 → "1.0×"  |  8500 → "0.85×"
 */
export function formatMultiplier(bps: number): string {
  return (bps / 10000).toFixed(2) + "×";
}
