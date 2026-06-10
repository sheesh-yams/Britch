import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, count } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { niche, cpmBenchmark, formatMultiplier, seedCreator, engineParams, providerConfig } from "@/db/schema";

export default async function AdminDashboard() {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);

  const [nicheRows, cpmRows, multRows, seedRows, ep, pc] = await Promise.all([
    db.select({ c: count() }).from(niche).where(eq(niche.isActive, true)),
    db.select({ c: count() }).from(cpmBenchmark).where(eq(cpmBenchmark.isActive, true)),
    db.select({ c: count() }).from(formatMultiplier).where(eq(formatMultiplier.isActive, true)),
    db.select({ c: count() }).from(seedCreator).where(eq(seedCreator.isActive, true)),
    db.query.engineParams.findFirst({ where: eq(engineParams.isActive, true) }),
    db.query.providerConfig.findFirst(),
  ]);

  const stats = [
    { label: "Active niches",          value: String(nicheRows[0]?.c ?? 0) },
    { label: "CPM benchmarks",         value: String(cpmRows[0]?.c ?? 0) },
    { label: "Format multipliers",     value: String(multRows[0]?.c ?? 0) },
    { label: "Seed creators",          value: String(seedRows[0]?.c ?? 0) },
    { label: "Engine version",         value: ep ? `v${ep.version}` : "—" },
    { label: "Active provider",        value: pc?.activeAnalyticsProvider ?? "—" },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 36, color: "var(--paper)", margin: "0 0 8px" }}>Admin</h1>
      <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.45, margin: "0 0 32px" }}>
        Britch global pricing plane. All changes are versioned and affect all creators.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ background: "var(--ink-3)", borderRadius: "var(--r)", padding: "16px 18px" }}>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.08em", marginBottom: 6 }}>
              {label.toUpperCase()}
            </div>
            <div style={{ fontFamily: "var(--font-clash-display)", fontSize: 28, color: "var(--flush)", fontWeight: 600 }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
