import { getPrisma }         from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export default async function AdminDashboard() {
  const { env } = getCloudflareContext();
  const prisma  = getPrisma(env.DB);

  const [niches, cpmCount, multCount, seedCount, engineParams, providerConfig] = await Promise.all([
    prisma.niche.count({ where: { isActive: true } }),
    prisma.cpmBenchmark.count({ where: { isActive: true } }),
    prisma.formatMultiplier.count({ where: { isActive: true } }),
    prisma.seedCreator.count({ where: { isActive: true } }),
    prisma.engineParams.findFirst({ where: { isActive: true } }),
    prisma.providerConfig.findFirst(),
  ]);

  const stats = [
    { label: "Active niches",          value: String(niches) },
    { label: "CPM benchmarks",         value: String(cpmCount) },
    { label: "Format multipliers",     value: String(multCount) },
    { label: "Seed creators",          value: String(seedCount) },
    { label: "Engine version",         value: engineParams ? `v${engineParams.version}` : "—" },
    { label: "Active provider",        value: providerConfig?.activeAnalyticsProvider ?? "—" },
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
